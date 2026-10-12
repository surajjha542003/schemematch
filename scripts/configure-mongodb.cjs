/* Run in your own Terminal. Secret inputs and connection strings are never logged. */
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const { Writable } = require('node:stream');
const dotenv = require('../backend/node_modules/dotenv');
const mongoose = require('../backend/node_modules/mongoose');
const root = path.resolve(__dirname, '..');

function buildUri(template, username, password, database) {
  const u = new URL(template);
  if (u.protocol !== 'mongodb+srv:' || !u.hostname.endsWith('.mongodb.net') || u.hash) throw new Error('Use the Atlas Drivers mongodb+srv connection string.');
  if (username) u.username = encodeURIComponent(username);
  if (password) u.password = encodeURIComponent(password);
  if (database) u.pathname = '/' + encodeURIComponent(database);
  if (!u.username || !u.password || /<|%3C/i.test(u.username + u.password)) throw new Error('Enter the database user and password; placeholders cannot connect.');
  return u.href;
}
function replaceEnv(text, uri) {
  // Quoting protects # and other dotenv-significant characters in URI options.
  const line = 'MONGODB_URI=' + JSON.stringify(uri);
  if (/^\s*MONGODB_URI\s*=/m.test(text)) return text.replace(/^\s*MONGODB_URI\s*=.*$/m, () => line);
  return text.replace(/\s*$/, '') + '\n' + line + '\n';
}
function hiddenQuestion(prompt) {
  return new Promise((resolve, reject) => {
    let muted = false, answered = false;
    const output = new Writable({ write(chunk, _encoding, done) { if (!muted) process.stdout.write(chunk); done(); } });
    const rl = readline.createInterface({ input: process.stdin, output, terminal: true });
    rl.on('close', () => { if (!answered) reject(new Error('Cancelled. Environment files unchanged.')); });
    rl.on('SIGINT', () => { rl.close(); process.stdout.write('\n'); reject(new Error('Cancelled. Environment files unchanged.')); });
    rl.question(prompt, value => { answered = true; muted = false; rl.close(); process.stdout.write('\n'); resolve(value); });
    muted = true;
  });
}
async function main() {
  if (!process.stdin.isTTY) throw new Error('Run npm run db:configure in your own interactive Terminal.');
  const targets = ['.env', 'backend/.env'].map(f => path.join(root, f));
  const originals = targets.map(f => fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '');
  const prior = dotenv.parse(originals[1]).MONGODB_URI || dotenv.parse(originals[0]).MONGODB_URI;
  console.log('Hidden inputs. Enter reuses an existing value. The database is only pinged; no database records are changed.');
  const template = (await hiddenQuestion('Atlas Drivers connection string (hidden; Enter keeps current cluster): ')).trim() || prior;
  if (!template) throw new Error('A connection string is required.');
  const previousDatabase = prior ? decodeURIComponent(new URL(prior).pathname.slice(1)) : '';
  const username = await hiddenQuestion('Database username (hidden; Enter keeps URI username): ');
  const password = await hiddenQuestion('Database password (hidden; Enter keeps URI password): ');
  const uri = buildUri(template, username, password, previousDatabase || 'schemematch');
  const connection = mongoose.createConnection();
  try {
    console.log('Testing the connection…');
    await connection.openUri(uri, { serverSelectionTimeoutMS: 6000, connectTimeoutMS: 6000 });
    await connection.db.admin().ping();
  } catch (error) {
    throw new Error(/bad auth|authentication|credential/i.test(error.message || '') ? 'Database authentication failed. Recheck the Atlas database user/password. Environment files unchanged.' : 'Connection failed. Recheck the cluster and Atlas network access. Environment files unchanged.');
  } finally { await connection.close(); }
  // Precompute both replacements before writing; preserve all other settings.
  const updated = originals.map(text => replaceEnv(text, uri));
  try {
    targets.forEach((file, i) => { fs.writeFileSync(file, updated[i], { mode: 0o600 }); fs.chmodSync(file, 0o600); });
  } catch (_) {
    targets.forEach((file, i) => { if (originals[i]) fs.writeFileSync(file, originals[i], { mode: 0o600 }); });
    throw new Error('Environment update failed; original settings restored.');
  }
  console.log('Connection succeeded. Updated .env and backend/.env. Credentials were not displayed.');
  console.log('Tell Codex the setup succeeded so it can restart and retest SchemeMatch.');
}
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { buildUri, replaceEnv, hiddenQuestion };
