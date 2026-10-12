/* Official fetch -> text -> optional extraction -> pending human review.
 * AI confidence is never authority to publish government facts. */
const mongoose=require('mongoose');
const {fetchHtmlText}=require('./fetchHtml');
const {fetchPdfText}=require('./fetchPdf');
const {structureSourceText}=require('./structureViaLLM');
const {SOURCES}=require('./sources');
const Proposal=require('../../models/SchemeChangeProposal.model');
function dbReady(){return mongoose.connection.readyState===1;}
async function ingestOne(source){
  const fetched=source.type==='pdf' ? await fetchPdfText(source.url) : await fetchHtmlText(source.url);
  const record={schemeId:source.schemeId,sourceUrl:source.url,sourceType:source.type,fetchedAt:new Date(fetched.fetchedAt),fetchOk:fetched.ok,fetchError:fetched.ok?undefined:fetched.error,finalUrl:fetched.finalUrl,sourceHash:fetched.sourceHash,sourceExcerpt:fetched.text,textTruncated:fetched.textTruncated,status:'pending'};
  if(!fetched.ok || fetched.lowTextYield || fetched.textTruncated){
    record.extractionOk=false;
    record.extractionNote=!fetched.ok?'Fetch failed; published bundle unchanged.':fetched.lowTextYield?'Scanned/low-text PDF: manual reading or OCR review required.':'Source text exceeded extraction limit; complete document review required.';
  }else{
    const extracted=await structureSourceText(fetched.text,source.url,source.label);
    record.extractionOk=extracted.ok;
    record.extracted=extracted.ok?extracted.data:null;
    record.extractionNote=extracted.ok?'Extraction proposed for human review; no live facts changed.':extracted.reason;
  }
  if(dbReady()) await Proposal.create(record);
  return record;
}
let running=false;
async function runDailyIngestion(){
  if(running) return {skipped:true,note:'An ingestion run is already active.'};
  if(!dbReady()) return {skipped:true,note:'Database unavailable; cannot persist the review queue.'};
  running=true;
  try{
    const records=[];
    for(const source of SOURCES) records.push(await ingestOne(source));
    return {processed:records.length,pending:records.length,autoApplied:0,records};
  }finally{running=false;}
}
module.exports={runDailyIngestion,ingestOne};
