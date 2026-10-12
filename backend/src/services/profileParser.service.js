/**
 * SCHEME FINDER BACKEND — Natural-Language Profile Parser
 *
 * Converts a free-text student self-description ("I'm a male BC student,
 * income 1.8L, studied VI-XII now doing B.Tech") into the SAME structured
 * profile shape the eligibility engine consumes. This is extraction only —
 * the AI never infers eligibility, only pulls out values the student
 * actually stated. Any required field (cat/edu/inc) it can't find is
 * reported back as missing so the caller asks the student instead of
 * guessing, per spec.
 */

const { chatComplete, aiEnabled, extractJsonText } = require('./openrouter.client');

const FIELD_ENUMS = {
  gender: ['Male', 'Female', 'Other / Transgender'],
  cat: ['General', 'OBC', 'SC', 'ST', 'BC', 'MBC', 'DNC', 'EWS', 'Minority (Muslim)', 'Minority (Christian)', 'Minority (Buddhist)', 'Minority (Jain)', 'Minority (Sikh)', 'Minority'],
  inc: ['under1', '1to2.5', '2.5to4.5', '4.5to8', 'above8'],
  edu: ['9-10', '11-12', 'diploma', 'ug-arts', 'ug-tech', 'ug-medical', 'pg', 'phd'],
  stream: ['science', 'engineering', 'medical', 'arts', 'commerce', 'law', 'agriculture'],
  firstGrad: ['Yes', 'No'],
  disability: ['Yes', 'No'],
  parentDisabled: ['Yes', 'No'],
  parentOcc: ['construction', 'government', 'other'],
  state: [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
    'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
    'Uttarakhand', 'West Bengal', 'J&K', 'Ladakh'
  ]
};

const REQUIRED_FIELDS = ['cat', 'edu', 'inc'];

const SYSTEM_PROMPT = `You extract a structured student profile from free text for a government scholarship
eligibility tool. You do NOT decide eligibility — only extract facts the student actually stated.

Return strict JSON only, shape:
{"profile": {"name": null|string, "gender": null|string, "age": null|string, "state": null|string, "cat": null|string,
  "inc": null|string, "edu": null|string, "marks": null|string, "stream": null|string,
  "firstGrad": null|string, "disability": null|string, "parentDisabled": null|string, "parentOcc": null|string},
 "notes": ["any ambiguity you resolved, or things you could not determine"]}

Field value rules:
- name: the student's personal or full name if stated (e.g. "Kundan Gupta", "Rahul", "Priya Sharma")
- gender: one of ${FIELD_ENUMS.gender.join(' | ')}
- cat: one of ${FIELD_ENUMS.cat.join(' | ')} (BC/MBC/DNC are Tamil Nadu-specific categories, distinct from all-India OBC — only use OBC if the student didn't mention a TN-specific category)
- inc: bucket the stated ANNUAL family income into one of ${FIELD_ENUMS.inc.join(' | ')} (under1 = below ₹1L, 1to2.5 = ₹1L-2.5L, 2.5to4.5 = ₹2.5L-4.5L, 4.5to8 = ₹4.5L-8L, above8 = above ₹8L)
- edu: current education stage, one of ${FIELD_ENUMS.edu.join(' | ')} (BTech/BE = ug-tech; BA/BSc/BCom/BCA/BBA = ug-arts; MBBS/BDS/Nursing = ug-medical; MA/MSc/MTech/MCA = pg)
- stream: one of ${FIELD_ENUMS.stream.join(' | ')}
- parentOcc: 'government' if parents work in government/govt job, army, defence, railways, police, civil service, or PSU; 'construction' if construction worker/daily wage; 'other' if private job, private company, business, or shop. If not stated, null
- Honour explicit negations (not disabled = No) and the latest correction of a fact. Never reuse an old income when a current income is stated. Convert explicit monthly income to annual; unclear ranges or periods must be null.
- name/marks/age/state are free strings if stated, else null.`;

function validateEnum(field, value) {
  if (value == null) return null;
  const allowed = FIELD_ENUMS[field];
  if (!allowed) return value; // free-text fields (name, age, marks)
  if (allowed.includes(value)) return value;
  const valStr = String(value).toLowerCase().trim();
  const matched = allowed.find(a => a.toLowerCase() === valStr);
  if (matched) return matched;
  if (field === 'state') {
    if (/\b(j&k|jammu|kashmir)\b/i.test(valStr)) return 'J&K';
    if (/\b(orissa)\b/i.test(valStr)) return 'Odisha';
    if (/\b(uttaranchal)\b/i.test(valStr)) return 'Uttarakhand';
    if (/\b(bengal|kolkata)\b/i.test(valStr)) return 'West Bengal';
  }
  return null;
}

// Conservative extraction: explicit corrections win; uncertain income stays blank.
function extractIncomeBucket(text) {
  const words = {one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,half:0.5};
  const amounts = /(?:₹|\brs\.?|\binr)?\s*\b(\d[\d,]*(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|half)\s*(lpa|lakhs?|lacs?|locks?|l\b|crores?|k\b|thousand)?/gi;
  let incomeContext = false;
  let latest;
  let previousEnd = 0;
  for (const m of text.matchAll(amounts)) {
    const prefix = text.slice(previousEnd, m.index);
    const incomeMention = /\b(?:income|earn(?:s|ing)?|salary|varumanam|aadaayam)\b/i.test(prefix);
    if (incomeMention) incomeContext = true;
    else if (/[.!?;]\s|\n/.test(prefix) && !/\b(?:now|currently|actually|correction|it is|instead)\b/i.test(prefix)) incomeContext = false;
    previousEnd = m.index + m[0].length;
    if (!incomeContext) continue;
    // Avoid using a tuition amount/asset/benefit as family income.
    if (/\b(?:fee|tuition|scholarship|loan|savings|asset|rent)\b/i.test(prefix) && !incomeMention) { incomeContext = false; continue; }
    if (!m[2] && !/(?:₹|\brs\.?|\binr)/i.test(m[0]) && !incomeMention && !/\b(?:now|currently|actually|correction|it is|instead)\b/i.test(prefix)) continue;
    const raw = m[1].toLowerCase();
    let value = words[raw] ?? Number(raw.replace(/,/g, ''));
    const unit = (m[2] || '').toLowerCase();
    if (/^(?:lpa|lakh|lac|lock|l$)/.test(unit)) value *= 100000;
    else if (/^crore/.test(unit)) value *= 10000000;
    else if (unit === 'k' || unit === 'thousand') value *= 1000;
    const suffix = text.slice(previousEnd).split(/[;!?\n]|\.(?:\s|$)/)[0];
    const periodText = prefix + ' ' + suffix.split(/\b(?:but|now|currently|actually|and)\b/i)[0];
    if (/\b(?:monthly|per month|a month|each month|\/month)\b/i.test(periodText) && unit !== 'lpa') value *= 12;
    // Ranges and unspecified bounds can cross buckets: request an exact amount.
    const bounded = /(?:below|under|less than|up to|upto|above|over|more than|between|from|to|-|–|[<>])\s*(?:₹|rs\.?|inr)?\s*$/i.test(prefix.trim());
    const ranged = /^\s*(?:-|–|to)\s*\d/.test(suffix);
    if (!Number.isFinite(value) || bounded || ranged || /\b(?:daily|weekly|per day|per week)\b/i.test(periodText)) { latest = null; continue; }
    latest = value < 100000 ? 'under1' : value <= 250000 ? '1to2.5' : value <= 450000 ? '2.5to4.5' : value <= 800000 ? '4.5to8' : 'above8';
  }
  return latest;
}

function extractDeclaredFlags(text) {
  const result = {};
  for (const clause of text.split(/[.;!?\n]|\b(?:and|but)\b/i)) {
    const parent = /\b(?:parent|parents|father|mother|dad|mom)\b/i.test(clause);
    const terms = [
      ['firstGrad', /\bfirst\s*(?:generation\s*)?grad(?:uate)?\b/gi],
      [parent ? 'parentDisabled' : 'disability', /\b(?:disabled|handicapped?|pwd|differently[ -]abled)\b/gi],
    ];
    for (const [field, pattern] of terms) {
      for (const match of clause.matchAll(pattern)) {
        const prefix = clause.slice(0, match.index);
        if (/\b(?:if|whether|maybe|possibly|might|unsure)\b/i.test(prefix)) continue;
        const suffix = clause.slice(match.index + match[0].length);
        const negated = /\b(?:not|never|no|isn't|aren't|wasn't|without)(?:\s+(?:a|the|any))?\s*$/i.test(prefix.trim()) || /^\s*(?::|is)?\s*no\b/i.test(suffix);
        result[field] = negated ? 'No' : 'Yes';
      }
    }
  }
  return result;
}

function deterministicExtract(text) {
  if (typeof text !== 'string') return {};
  const t = text.toLowerCase();
  const p = {};

  // Name extraction
  const stopWords = new Set(['not', 'disabled', 'handicapped', 'first', 'male', 'female', 'sc', 'st', 'obc', 'bc', 'mbc', 'dnc', 'general', 'i', 'am', 'a', 'an', 'the', 'student', 'studying', 'doing', 'in', 'at', 'from', 'and', 'my', 'name', 'is', 'final', 'year', 'first', 'bca', 'btech', 'presidency', 'college']);
  const nameM = text.match(/\b(?:my name is|i am|i\'m|myself|this is|name is|name:)\s+([a-zA-Z\s]{2,40})/i);
  if (nameM) {
    const rawWords = nameM[1].trim().split(/\s+/);
    const nameWords = [];
    for (const w of rawWords) {
      if (stopWords.has(w.toLowerCase())) break;
      if (/^[A-Za-z]+$/.test(w)) nameWords.push(w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
      if (nameWords.length >= 3) break;
    }
    if (nameWords.length > 0) p.name = nameWords.join(' ');
  }

  if (/\b(female|girl|woman|she|vidyarthini|manavi|mahila|kanya)\b/i.test(t)) p.gender = 'Female';
  else if (/\b(male|boy|man|he|vidyarthi|manavan|chhatra|purush)\b/i.test(t)) p.gender = 'Male';
  else if (/\b(other|transgender|trans)\b/i.test(t)) p.gender = 'Other / Transgender';

  if (/\b(general|unreserved|open|oc|ur)\b/i.test(t)) p.cat = 'General';
  else if (/\b(mbc|most backward|most backward class)\b/i.test(t)) p.cat = 'MBC';
  else if (/\bdnc|de-notified\b/i.test(t)) p.cat = 'DNC';
  else if (/\bbc\b|\bbackward class\b|\bbackward category\b/i.test(t) && !/\bbca\b/i.test(t)) p.cat = 'BC';
  else if (/\b(obc|other backward class|other backward category|other backward)\b/i.test(t)) p.cat = 'OBC';
  else if (/\b(ews|economically weaker section|economically weaker)\b/i.test(t)) p.cat = 'EWS';
  else if (/\b(st|scheduled tribe|adivasi|girijan)\b/i.test(t)) p.cat = 'ST';
  else if (/\b(sc|scheduled caste|dalit)\b/i.test(t) && !/\bbsc\b/i.test(t)) p.cat = 'SC';
  else if (/muslim/i.test(t)) p.cat = 'Minority (Muslim)';
  else if (/christian/i.test(t)) p.cat = 'Minority (Christian)';
  else if (/sikh/i.test(t)) p.cat = 'Minority (Sikh)';
  else if (/buddhist/i.test(t)) p.cat = 'Minority (Buddhist)';
  else if (/jain/i.test(t)) p.cat = 'Minority (Jain)';

  if (/\bphd\b|research|doctorate/i.test(t)) {
    p.edu = 'phd';
  } else if (/\b(pg|postgrad|postgraduate|post-graduate|msc|mtech|mca|mba|ma\b|mcom|master)\b/i.test(t)) {
    p.edu = 'pg';
    if (/mca|mtech/i.test(t)) p.stream = 'engineering';
    else if (/mba|mcom/i.test(t)) p.stream = 'commerce';
  } else if (/btech|b\.tech|b\.e\.|engineering|bachelor of technology|bachelor of engineering/i.test(t)) {
    p.edu = 'ug-tech';
    p.stream = 'engineering';
  } else if (/\bbca\b|b\.c\.a\./i.test(t)) {
    p.edu = 'ug-arts';
    p.stream = 'science';
  } else if (/\b(mbbs|bds|nursing|pharmacy|bpharm|medical)\b/i.test(t)) {
    p.edu = 'ug-medical';
    p.stream = 'medical';
  } else if (/\bbcom\b|\bbba\b/i.test(t)) {
    p.edu = 'ug-arts';
    p.stream = 'commerce';
  } else if (/\bbsc\b/i.test(t)) {
    p.edu = 'ug-arts';
    p.stream = 'science';
  } else if (/\bba\b/i.test(t)) {
    p.edu = 'ug-arts';
    p.stream = 'arts';
  } else if (/\bdiploma\b|polytechnic|\biti\b/i.test(t)) {
    p.edu = 'diploma';
  } else if (/class\s*(11|12)|12th|11th|higher secondary|\+2|\+1/i.test(t)) {
    p.edu = '11-12';
  } else if (/class\s*(9|10)|10th|9th|matric/i.test(t)) {
    p.edu = '9-10';
  }

  if (!p.stream) {
    if (/science|physics|chemistry|biology|math/i.test(t)) p.stream = 'science';
    else if (/engineering|technology|tech|computer|software|\bcs\b|\bit course\b/i.test(t)) p.stream = 'engineering';
    else if (/medical|health|clinic|doctor|pharmacy/i.test(t)) p.stream = 'medical';
    else if (/commerce|accounting|finance|business/i.test(t)) p.stream = 'commerce';
    else if (/arts|humanities|social/i.test(t)) p.stream = 'arts';
    else if (/law|legal/i.test(t)) p.stream = 'law';
    else if (/agri|agriculture/i.test(t)) p.stream = 'agriculture';
  }

  // State detection (covers all 28 Indian states + UTs with capitals, major cities, and variations)
  const stateList = [
    ['Karnataka', /\b(karnataka|bangalore|bengaluru|mysore|mysuru|hubli|mangalore|belgaum|ka\b)/i],
    ['Tamil Nadu', /\b(tamil\s*nadu|tamilnadu|chennai|madras|madurai|coimbatore|trichy|tiruchirappalli|salem|presidency\s*college|tn\b)/i],
    ['Maharashtra', /\b(maharashtra|mumbai|bombay|pune|nagpur|nashik|thane|aurangabad|mh\b)/i],
    ['Telangana', /\b(telangana|hyderabad|secunderabad|warangal|ts\b)/i],
    ['Andhra Pradesh', /\b(andhra\s*pradesh|andhra|vizag|visakhapatnam|vijayawada|guntur|tirupati|ap\b)/i],
    ['Kerala', /\b(kerala|kochi|cochin|trivandrum|thiruvananthapuram|calicut|kozhikode|thrissur|kl\b)/i],
    ['Delhi', /\b(delhi|new\s*delhi|ncr\b)/i],
    ['Uttar Pradesh', /\b(uttar\s*pradesh|lucknow|kanpur|varanasi|banaras|noida|greater\s*noida|agra|prayagraj|allahabad|ghaziabad|meerut|bareilly|aligarh)/i],
    ['Gujarat', /\b(gujarat|ahmedabad|surat|vadodara|baroda|rajkot|gandhinagar|gj\b)/i],
    ['West Bengal', /\b(west\s*bengal|bengal|kolkata|calcutta|howrah|siliguri|durgapur|asansol|wb\b)/i],
    ['Rajasthan', /\b(rajasthan|jaipur|jodhpur|udaipur|kota|ajmer|bikaner|rj\b)/i],
    ['Madhya Pradesh', /\b(madhya\s*pradesh|bhopal|indore|gwalior|jabalpur|ujjain|mp\b)/i],
    ['Punjab', /\b(punjab|chandigarh|ludhiana|amritsar|jalandhar|patiala|pb\b)/i],
    ['Haryana', /\b(haryana|gurgaon|gurugram|faridabad|panipat|ambala|hr\b)/i],
    ['Bihar', /\b(bihar|patna|gaya|muzaffarpur|bhagalpur|br\b)/i],
    ['Odisha', /\b(odisha|orissa|bhubaneswar|cuttack|rourkela|puri|od\b)/i],
    ['Assam', /\b(assam|guwahati|dispur|silchar|dibrugarh)/i],
    ['Jharkhand', /\b(jharkhand|ranchi|jamshedpur|dhanbad|bokaro|jh\b)/i],
    ['Chhattisgarh', /\b(chhattisgarh|chhatisgarh|raipur|bilaspur|bhilai|cg\b)/i],
    ['Uttarakhand', /\b(uttarakhand|uttaranchal|dehradun|haridwar|roorkee|rishikesh|nainital|uk\b)/i],
    ['Himachal Pradesh', /\b(himachal\s*pradesh|himachal|shimla|dharamshala|manali|hp\b)/i],
    ['Goa', /\b(goa|panaji|margao|vasco)\b/i],
    ['Tripura', /\b(tripura|agartala|tr\b)/i],
    ['Manipur', /\b(manipur|imphal|mn\b)/i],
    ['Meghalaya', /\b(meghalaya|shillong|ml\b)/i],
    ['Mizoram', /\b(mizoram|aizawl|mz\b)/i],
    ['Nagaland', /\b(nagaland|kohima|dimapur|nl\b)/i],
    ['Sikkim', /\b(sikkim|gangtok|sk\b)/i],
    ['Arunachal Pradesh', /\b(arunachal\s*pradesh|arunachal|itanagar|ar\b)/i],
    ['J&K', /\b(jammu\s*&\s*kashmir|jammu\s*and\s*kashmir|j&k|jammu|kashmir|srinagar|jk\b)/i],
    ['Ladakh', /\b(ladakh|leh|kargil)\b/i]
  ];
  for (const [sName, sRgx] of stateList) {
    if (sRgx.test(t)) { p.state = sName; break; }
  }

  const income = extractIncomeBucket(text);
  if (income) p.inc = income;

  const mAge = t.match(/\b(\d{2})\s*(?:years?\s*old|yrs?\s*old|yo\b|age)/i) || t.match(/age\s*(?:is|:)?\s*(\d{2})/i);
  if (mAge) p.age = mAge[1];

  const mMarks = t.match(/(\d{1,3}(?:\.\d+)?)\s*(?:%|percent|marks)/i);
  if (mMarks) p.marks = Math.min(100, Math.round(parseFloat(mMarks[1]))).toString();

  Object.assign(p, extractDeclaredFlags(text));

  // Only assign a parent's occupation when a parent is actually mentioned.
  const parentText = text.split(/[.;!?\n]/).filter(c => /\b(?:parent|parents|father|mother|dad|mom)\b/i.test(c)).join(' ');
  if (/\b(gov[a-z]*ment|govt|army|defence|defense|railway|railways|police|navy|air\s*force|military|armed\s*forces|ias|ips|upsc|ssc|psu|public\s*sector|collectorate|revenue\s*department|civic|civil\s*service|post\s*office|anganwadi|bank\s*manager|bank\s*officer|sbi|lic|central\s*govt|state\s*govt)\b/i.test(parentText)) {
    p.parentOcc = 'government';
  } else if (/\b(construction\s*worker|construction|building\s*worker|mason|daily\s*wage|daily\s*wager|coolie|kooli|labourer|laborer|carpenter|painter|plumber|welder|brick\s*layer|site\s*worker)\b/i.test(parentText)) {
    p.parentOcc = 'construction';
  } else if (/\b(private\s*job|private\s*employee|private\s*company|private\s*sector|private\s*firm|corporate|software|it\s*job|developer|engineer|manager|consultant|executive|sales|marketing|accountant|analyst|tcs|infosys|wipro|cognizant|accenture|hcl|amazon|google|microsoft|business|shop|shopkeeper|merchant|trader|store|retail|self\s*employed|freelance|vendor|contractor|farmer|agriculture|cultivator|private)\b/i.test(parentText)) {
    p.parentOcc = 'other';
  }

  return p;
}

async function parseProfileText(text) {
  if (!text || !text.trim()) {
    return { profile: {}, missingRequired: REQUIRED_FIELDS, notes: [], aiGenerated: false };
  }
  if (!aiEnabled()) {
    const profile = deterministicExtract(text);
    const missingRequired = REQUIRED_FIELDS.filter(f => !profile[f]);
    return { profile, missingRequired, notes: ['Parsed using pattern matcher.'], aiGenerated: false };
  }

  const raw = await chatComplete(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: text.trim() },
    ],
    { jsonMode: true, temperature: 0, maxTokens: 400, timeoutMs: 5000 }
  );

  if (!raw) {
    const profile = deterministicExtract(text);
    const missingRequired = REQUIRED_FIELDS.filter(f => !profile[f]);
    return { profile, missingRequired, notes: ['AI service busy — pattern matcher used.'], aiGenerated: false };
  }

  try {
    const parsed = JSON.parse(extractJsonText(raw));
    const profile = {};
    for (const field of Object.keys(FIELD_ENUMS)) {
      const v = validateEnum(field, parsed.profile?.[field]);
      if (v) profile[field] = v;
    }
    for (const field of ['name', 'age', 'marks']) {
      if (parsed.profile?.[field]) profile[field] = String(parsed.profile[field]).trim();
    }
    Object.assign(profile, extractDeclaredFlags(text));
    const income = extractIncomeBucket(text);
    if (income) profile.inc = income;
    else if (income === null) delete profile.inc;
    const missingRequired = REQUIRED_FIELDS.filter(f => !profile[f]);
    return { profile, missingRequired, notes: Array.isArray(parsed.notes) ? parsed.notes : [], aiGenerated: true };
  } catch {
    return { profile: {}, missingRequired: REQUIRED_FIELDS, notes: ['Could not parse response — please fill the form manually.'], aiGenerated: false };
  }
}

module.exports = { parseProfileText, deterministicExtract, extractIncomeBucket, extractDeclaredFlags, REQUIRED_FIELDS, FIELD_ENUMS };
