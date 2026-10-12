/* Registry follows the same reviewed directory as the UI, across all 15 states.
 * Fetching a page only proposes a change. It does not approve or publish rules. */
const { ALL_SCHEMES } = require('../../data/catalog');
const SOURCES=ALL_SCHEMES.map(s=>({schemeId:s.id,type:/\.pdf(?:[?#]|$)/i.test(s.source)?'pdf':'html',url:s.source,label:s.name,state:s.state || null}));
module.exports={SOURCES};
