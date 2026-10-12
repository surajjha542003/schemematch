const { test } = require('node:test');
const assert = require('node:assert/strict');
const dotenv = require('../node_modules/dotenv');
const { buildUri, replaceEnv } = require('../../scripts/configure-mongodb.cjs');

test('local database setup encodes credential characters without changing Atlas options', () => {
  const uri = buildUri('mongodb+srv://old:old@cluster.example.mongodb.net/?retryWrites=true&w=majority', 'test@example', 'a$b:c/d?e#f[g]@h', 'scheme-match');
  const u = new URL(uri);
  assert.equal(decodeURIComponent(u.username), 'test@example');
  assert.equal(decodeURIComponent(u.password), 'a$b:c/d?e#f[g]@h');
  assert.equal(u.pathname, '/scheme-match');
  assert.equal(u.searchParams.get('retryWrites'), 'true');
  assert.equal(u.searchParams.get('w'), 'majority');
});
test('database setup preserves other settings and round-trips dotenv-sensitive values', () => {
  const uri = 'mongodb+srv://test:encoded@cluster.example.mongodb.net/schemematch?appName=Scheme#fragment';
  const updated = replaceEnv('JWT_SECRET=keep-this\nMONGODB_URI=old\nPORT=5050\n', uri);
  const env = dotenv.parse(updated);
  assert.equal(env.MONGODB_URI, uri);
  assert.equal(env.JWT_SECRET, 'keep-this');
  assert.equal(env.PORT, '5050');
  assert.equal((updated.match(/MONGODB_URI=/g) || []).length, 1);
});
test('database setup rejects placeholders and unrelated servers before any connection', () => {
  assert.throws(() => buildUri('mongodb+srv://<user>:<password>@cluster.example.mongodb.net/', '', '', 'schemematch'), /placeholders/);
  assert.throws(() => buildUri('https://example.test/', 'user', 'password', 'schemematch'), /Atlas/);
});
