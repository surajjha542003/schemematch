/**
 * SCHEME FINDER — Frontend test helpers
 *
 * The frontend is deliberately zero-build-step vanilla JS (see docs/
 * ARCHITECTURE.md) — no ES modules, no bundler. So instead of reimplementing
 * chunks of app logic as test doubles, these helpers load the REAL source
 * files into a jsdom window and drive the actual functions. Two jsdom quirks
 * this works around (both confirmed by hand, not guessed):
 *
 *  - `new JSDOM(html)` without `runScripts: 'outside-only'` runs window.eval()
 *    code in a realm whose top-level declarations don't attach to the
 *    window object Node sees — so `dom.window.someFunction` comes back
 *    undefined even though the eval succeeded. `runScripts: 'outside-only'`
 *    fixes it.
 *  - With `runScripts: 'outside-only'` set, `location` IS resolvable as a
 *    bare identifier inside window.eval() (it reads the real jsdom
 *    Location object from the `url` option below) — no shim needed. An
 *    earlier version of this helper shimmed it with a plain object, which
 *    actually made things worse: assigning to the real `location` global
 *    triggers jsdom's Location setter (a page-navigation attempt), logged
 *    as noisy "Not implemented: navigation" stderr spam on every load.
 *  - Each separate `window.eval()` CALL gets its own `let`/`const` script
 *    environment — it does NOT share those bindings with an earlier eval()
 *    call, even on the same window (only `var`/`function` declarations,
 *    which attach to the real Global Object, are shared across calls). So
 *    a later `dom.window.eval('AUTH_USER = {...}')` to stub a `let
 *    AUTH_USER` from state.js silently creates an unrelated ad-hoc
 *    global instead of touching the binding any of the loaded functions
 *    actually close over — no error, just silently wrong. Setting such a
 *    variable must happen in the SAME eval() call as the source that
 *    declares it — see `opts.postEval` below.
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');

/**
 * @param {string[]} relFiles - frontend/src/js/*.js paths, relative to repo root, in load order
 * @param {object} [opts]
 * @param {(src:string)=>string} [opts.transform] - optional per-concatenated-source transform (e.g. strip a DOMContentLoaded block that needs a full browser)
 * @param {string} [opts.bodyHtml] - HTML to seed <body> with before scripts run
 * @param {string} [opts.postEval] - extra JS appended to the SAME eval() call as the source files (e.g. `AUTH_USER = {...}` to stub a `let` from state.js) — see the `let`/`const` note above for why this must be appended, not run as a separate dom.window.eval() afterward
 */
function loadWindow(relFiles, opts = {}) {
  const dom = new JSDOM(`<!doctype html><html><body>${opts.bodyHtml || ''}</body></html>`, {
    url: 'http://localhost:3000/',
    runScripts: 'outside-only',
  });
  let combined = relFiles.map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n;\n');
  if (opts.transform) combined = opts.transform(combined);
  if (opts.postEval) combined += '\n;\n' + opts.postEval;
  dom.window.eval(combined);
  return dom;
}

module.exports = { loadWindow };
