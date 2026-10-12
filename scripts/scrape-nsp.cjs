/* Public scholarship catalogue only. Never visits applicant accounts or submits applications.
 * Writes a review snapshot; publication remains an explicit versioned-data operation. */
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const cheerio = require('../backend/node_modules/cheerio');
const {officialFetch,boundedBody} = require('../backend/src/services/ingestion/officialFetch');
const {officialUrl} = require('../frontend/src/js/source-policy');
const SOURCE = 'https://scholarships.gov.in/All-Scholarships';
const clean = text => String(text).replace(/\s+/g,' ').trim();
function iso(text) {
  const m = text.match(/(\d{2})-(\d{2})-(\d{4})/);
  if (!m) return null;
  const value = `${m[3]}-${m[2]}-${m[1]}`;
  const date=new Date(value+'T00:00:00Z');
  return Number.isNaN(date.valueOf()) ? null : date.toISOString().slice(0,10) === value ? value : null;
}
function parsePage(html, scope = {}) {
  const $ = cheerio.load(html);
  const academicYear = clean($('.announcementText').text()).match(/\d{4}-\d{2}/)?.[0] || null;
  const records = [];
    $('h6').each((_, heading) => {
      if(!$(heading).closest('.col-md-10').length)return;
      const row = $(heading).closest('.row');
      const department = clean($(heading).closest('.accordion-item').find('.accordion-button').first().text()) || (scope.state ? 'State of '+scope.state : '');
      const name = clean($(heading).text());
      const spans = row.find('span').map((_,s)=>clean($(s).text())).get();
      const student = spans.find(s=>/^Student Application\s+(Open till|Closed on)/i.test(s));
      const opening = spans.find(s=>/^Scheme\s+Open from/i.test(s));
      const links = row.find('a').map((_,a)=>({label:clean($(a).text()),url:officialUrl(new URL($(a).attr('href') || '',SOURCE).href)})).get().filter(a=>a.url);
      if(!name || !department || !links.some(a=>/Specifications|FAQ/i.test(a.label)))return;
      const stem = name.replace(/\((Merit|Welfare) Based Scheme\)/i,'').trim();
      const state = scope.state || (/^(State of|UT of)\s+/.test(department) ? department.replace(/^(State of|UT of)\s+/,'').replace('Chattisgarh','Chhattisgarh') : null);
      records.push({id:'nsp-'+createHash('sha256').update(name).digest('hex').slice(0,16),name:stem,publishedName:name,department,
        state,classification:({central:'central-sector',centralscheme:'central-sector',sponserscheme:'centrally-sponsored',statescheme:'state'})[scope.classification] || scope.classification || 'unknown',academicYear,
        applicationRoute:student && /Renewal/i.test(student) ? 'renewal' : 'student',
        status:student ? (/Closed on/i.test(student) ? 'closed' : 'published-window') : 'unknown',
        opensOn:opening ? iso(opening) : null,deadline:student ? iso(student) : null,
        verificationWindows:spans.filter(s=>/Verification/i.test(s)).map(s=>({label:s.replace(/:\s*\d{2}-\d{2}-\d{4}.*/,''),date:iso(s)})),
        guidelineUrl:links.find(a=>/Specifications/i.test(a.label))?.url || null,faqUrl:links.find(a=>/FAQ/i.test(a.label))?.url || null,
        source:SOURCE,sourceChecked:scope.checkedOn || new Date().toISOString().slice(0,10),matchingEnabled:false,eligibilityVerification:'pending'});
    });
  const states = $('select[name="stateidschems"] option').map((_,o)=>({id:$(o).attr('value'),label:clean($(o).text())})).get().filter(s=>/^\d+$/.test(s.id));
  return {records,states,academicYear};
}
async function main() {
  const checkedOn = new Date().toISOString().slice(0,10);
  const pages = [], failures = [], unique = new Map();
  async function read(url,scope,body) {
    try {
      const opts = {signal:AbortSignal.timeout(20000)};
      if(body){opts.method='POST';opts.headers={'Content-Type':'application/x-www-form-urlencoded'};opts.body=new URLSearchParams(body).toString();}
      const {response,finalUrl} = await officialFetch(url,opts);
      const bytes=await boundedBody(response,3*1024*1024);
      const parsed=parsePage(bytes.toString('utf8'),{...scope,checkedOn});
      pages.push({url,finalUrl,scope,sha256:createHash('sha256').update(bytes).digest('hex'),count:parsed.records.length,academicYear:parsed.academicYear});
      for(const record of parsed.records){const prior=unique.get(record.id);if(scope.classification==='domicile-filter' && prior)record.classification=prior.classification;if(!prior || record.state)unique.set(record.id,record);}
      console.log(`${scope.state || scope.classification || 'default'}: ${parsed.records.length} public listings`);
      return parsed;
    }catch(error){failures.push({url,scope,error:error.name==='TimeoutError'?'timeout':error.message});console.log(`${scope.state || scope.classification || 'default'}: fetch failed`);return null;}
  }
  const initial=await read(SOURCE,{classification:'central'});
  if(!initial?.records.length)throw new Error('NSP public catalogue could not be parsed; no snapshot written.');
  // Follow every public classification and domicile filter advertised by NSP.
  for(const classification of ['centralscheme','sponserscheme','statescheme'])await read(new URL('centralsOrsponsoredOrstate',SOURCE).href,{classification},{central_sponsored_state:classification});
  for(const state of initial.states)await read(new URL('allschemesdomicile',SOURCE).href,{classification:'domicile-filter',state:state.label.replace(/^(State of|UT of)\s+/,'').replace('Chattisgarh','Chhattisgarh')},{stateidschems:state.id});
  const output={source:SOURCE,checkedOn,scope:'Public central, sponsored and advertised state/UT scholarship catalogue filters. Applicant accounts, dashboards and linked guideline contents are not scraped.',complete:failures.length===0,pages,failures,records:[...unique.values()]};
  const target=path.resolve(__dirname,'../docs/evidence/nsp-catalogue.snapshot.json');
  fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(output,null,2)+'\n');
  console.log(`Saved ${output.records.length} distinct listings; ${failures.length} failed filters. Review before publication.`);
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={parsePage,iso};
