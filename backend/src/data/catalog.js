// One versioned source directory for browser, API, chat and ingestion.
const { records } = require('./shared')('scheme-catalog');
module.exports = { ALL_SCHEMES: records };
