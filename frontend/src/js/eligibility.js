/* ════════════════════════════════════════════════
   Scheme Finder — Eligibility Checker Panel
   Stage 1 · Ministry of Education
   ════════════════════════════════════════════════ */

// ══ NATURAL-LANGUAGE PROFILE INPUT ══
// Extraction only — the backend LLM pulls out values the student actually
// stated (never guesses eligibility), see backend/src/services/
// profileParser.service.js. Missing required fields are reported back so we
// ask the student, per spec, instead of silently leaving them blank.
const NL_FIELD_MAP = {
  name: 'ef-name',
  gender: 'ef-gender', age: 'ef-age', state: 'ef-state', cat: 'ef-cat',
  inc: 'ef-inc', edu: 'ef-edu', marks: 'ef-marks', stream: 'ef-stream',
  firstGrad: 'ef-firstgrad', disability: 'ef-disability', parentDisabled: 'ef-parentdis', parentOcc: 'ef-parentocc',
};
const FIELD_LABELS = {
  name: 'Full Name',
  cat: 'Category',
  edu: 'Education Level',
  inc: 'Annual Family Income',
  state: 'State',
  age: 'Age',
  marks: 'Marks',
  stream: 'Stream',
  parentOcc: "Parent's Occupation"
};

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

function localExtractProfile(text) {
  if (typeof text !== 'string') return {};
  const t = text.toLowerCase();
  const p = {};

  // Name extraction (from "I am [Name]", "My name is [Name]", etc.)
  const stopWords = new Set([
    'not', 'disabled', 'handicapped', 'first', 'male', 'female', 'sc', 'st', 'obc', 'bc', 'mbc', 'dnc', 'general', 'i', 'am', 'a', 'an', 'the', 'student', 'studying', 'doing', 'in', 'at', 'from',
    'and', 'my', 'name', 'is', 'final', 'year', 'first', 'bca', 'btech', 'presidency',
    'college', 'mom', 'dad', 'parent', 'parents', 'early', 'yearly', 'income', 'one', 'lock', 'lakh',
    'sc', 'st', 'bc', 'mbc', 'obc', 'general', 'male', 'female', 'boy', 'girl'
  ]);
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

  // Category matching (supports English and translated terms from all Indian languages)
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

  // Education level
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

  // Stream detection
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

async function fetchProfileJSON(url, options = {}, timeoutMs = 6000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) throw new Error('Profile service unavailable');
    return await response.json();
  } finally { clearTimeout(timeout); }
}

// ══ MULTILINGUAL TRANSLATION TO ENGLISH ══
async function translateToEnglish(text, sourceLang = 'auto') {
  if (!text || !text.trim()) return '';
  const clean = text.trim();

  // English with currency symbols/punctuation does not need translation.
  const hasNonAscii = /(?=[^\x00-\x7F])\p{Letter}/u.test(clean);
  const sl = (sourceLang && sourceLang !== 'auto') ? sourceLang.split('-')[0] : 'auto';

  if (!hasNonAscii && (sourceLang === 'en-IN' || sourceLang === 'en-US' || sourceLang === 'en')) {
    // Check if it's Romanized Indian language (Tanglish, Hinglish, etc.)
    const isRomanized = /\b(padikiren|padikren|varumanam|latcham|pirivu|kudumba|chaduvutunnanu|aadaayam|lakshalu|karat|kutumbache|utpanna|chhatra|vidyarthi|pustak)\b/i.test(clean);
    if (!isRomanized) return clean;
  }

  const fetchTranslate = async (slParam) => {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${slParam}&tl=en&dt=t&q=${encodeURIComponent(clean)}`;
      const data = await fetchProfileJSON(url);
      if (data) {
        if (Array.isArray(data) && Array.isArray(data[0])) {
          const translated = data[0].map(c => c && c[0] ? c[0] : '').join('').trim();
          if (translated && (translated !== clean || data[2] === 'en')) return translated;
        }
      }
    } catch (e) {}
    return null;
  };

  // 1. First try auto-detect (best for code-switching like Tamil + English)
  let result = await fetchTranslate('auto');
  if (result) return result;

  // 2. If sl was provided and auto did not change text, try explicit sl
  if (sl !== 'auto') {
    result = await fetchTranslate(sl);
    if (result) return result;
  }

  // 3. Fallback to backend translation API
  try {
    const json = await fetchProfileJSON(API_BASE + '/profile/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: clean, targetLang: 'en', sourceLang: sl })
    });
    if (json && json.data && json.data.status !== 'unavailable') {
      if (json.data.translated) {
        return json.data.translated;
      }
    }
  } catch (e) {
    console.warn('Backend translation failed:', e);
  }

  throw new Error('Translation unavailable');
}
window.translateToEnglish = translateToEnglish;

// ══ VOICE INPUT ══
let recognitionInstance = null;
let isVoiceRecording = false;
let userRequestedVoiceStop = false;
let accumulatedTranscript = '';
let currentInterim = '';
let voiceRestartTimer = null;
let voiceStopTimer = null;
let voiceProcessing = false;
const MAX_VOICE_RESTARTS = 3;

function setVoiceLang(code) {
  // Keep one language per session, including the translation step.
  if (isVoiceRecording || voiceProcessing) return;
  const sel = document.getElementById('nl-voice-lang');
  if (sel) {
    if (![...sel.options].some(option => option.value === code)) return;
    sel.value = code;
  }
  document.querySelectorAll('.nl-lang-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.lang === code);
  });
  try { localStorage.setItem('sf_voice_lang', code); } catch(e){}
}
window.setVoiceLang = setVoiceLang;

function cleanUpVoiceUI() {
  const btn = document.getElementById('nl-voice-btn');
  if (btn) {
    btn.classList.remove('recording');
    btn.disabled = voiceProcessing;
  }
  const label = document.getElementById('nl-voice-btn-txt');
  if (label) label.textContent = voiceProcessing ? 'Processing speech…' : 'Speak to Fill';
  const lang = document.getElementById('nl-voice-lang');
  if (lang) lang.disabled = isVoiceRecording || voiceProcessing;
  const parseBtn = document.getElementById('nl-btn');
  if (parseBtn) parseBtn.disabled = isVoiceRecording || voiceProcessing;
  document.querySelectorAll('.nl-lang-chip').forEach(c => { c.disabled = isVoiceRecording || voiceProcessing; });
  const status = document.getElementById('nl-voice-status');
  if (status && !isVoiceRecording && !voiceProcessing) status.style.display = 'none';
}

function showVoiceWarning(message) {
  const note = document.getElementById('nl-note');
  if (note) { note.textContent = message; note.className = 'nlnote warn'; }
}

function toggleVoiceInput() {
  if (voiceProcessing) return;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showVoiceWarning('Voice input is unavailable in this browser. You can type your details below.');
    return;
  }
  if (isVoiceRecording) {
    userRequestedVoiceStop = true;
    isVoiceRecording = false;
    voiceProcessing = true;
    cleanUpVoiceUI();
    clearTimeout(voiceRestartTimer);
    // If recognition is between sessions, there is no pending onend event.
    const recognition = recognitionInstance;
    if (!recognition) { voiceProcessing = false; cleanUpVoiceUI(); return; }
    recognition.finishRequested = true;
    voiceStopTimer = setTimeout(() => recognition.finish(), 3000);
    try { recognition.stop(); } catch(e) { recognition.finish(); }
    // A restart timer means the previous session already ended.
    if (recognition.sessionEnded) recognition.finish();
    return;
  }

  const lang = document.getElementById('nl-voice-lang');
  let savedLang = 'ta-IN';
  try { savedLang = localStorage.getItem('sf_voice_lang') || savedLang; } catch(e){}
  const selectedLang = lang?.value || savedLang;
  setVoiceLang(selectedLang);
  const textarea = document.getElementById('nl-text');
  accumulatedTranscript = '';
  currentInterim = '';
  userRequestedVoiceStop = false;
  isVoiceRecording = true;
  let restarts = 0;
  let recognition;

  function fail(message) {
    clearTimeout(voiceRestartTimer);
    clearTimeout(voiceStopTimer);
    isVoiceRecording = false;
    voiceProcessing = false;
    userRequestedVoiceStop = false;
    recognitionInstance = null;
    if (recognition) { try { recognition.abort(); } catch(e){} }
    cleanUpVoiceUI();
    showVoiceWarning(message);
  }

  try {
    recognition = new SpeechRecognition();
    recognitionInstance = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = selectedLang;
    recognition.sessionEnded = false;
    recognition.finishRequested = false;
    let finished = false;
    recognition.finish = () => {
      if (finished || recognitionInstance !== recognition) return;
      finished = true;
      clearTimeout(voiceRestartTimer);
      clearTimeout(voiceStopTimer);
      recognitionInstance = null;
      isVoiceRecording = false;
      if (!recognition.sessionEnded) { try { recognition.abort(); } catch(e){} }
      // Use only this session's transcript, never an earlier typed profile.
      const transcript = (accumulatedTranscript + currentInterim).trim();
      if (textarea && transcript) textarea.value = transcript;
      handleCompletedSpeech(selectedLang, transcript);
    };
    recognition.onstart = () => {
      if (recognitionInstance !== recognition) return;
      recognition.sessionEnded = false;
      if (userRequestedVoiceStop) { try { recognition.stop(); } catch(e) { recognition.finish(); } return; }
      cleanUpVoiceUI();
      const btn = document.getElementById('nl-voice-btn');
      if (btn) btn.classList.add('recording');
      const label = document.getElementById('nl-voice-btn-txt');
      if (label) label.textContent = 'Stop Speaking & Auto-Fill';
      const status = document.getElementById('nl-voice-status');
      if (status) {
        status.style.display = 'inline-flex';
        status.textContent = 'Listening… Click Stop when you have finished.';
      }
      const note = document.getElementById('nl-note');
      if (note) {
        note.className = 'nlnote';
        note.textContent = 'Speak your details, then review the transcript and filled fields before checking schemes. Browser speech services may process your audio online.';
      }
    };
    recognition.onresult = event => {
      if (recognitionInstance !== recognition) return;
      currentInterim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) accumulatedTranscript += transcript + ' ';
        else currentInterim += transcript;
      }
      if (textarea) textarea.value = (accumulatedTranscript + currentInterim).trim();
    };
    recognition.onerror = event => {
      if (recognitionInstance !== recognition) return;
      if (event.error === 'no-speech') return; // bounded restart on end
      const messages = {
        'not-allowed': 'Microphone permission was denied. Allow access in browser settings or type your details.',
        'service-not-allowed': 'The browser speech service is unavailable. Type your details or try again later.',
        'network': 'Speech recognition lost its network connection. Your transcript is retained; retry or type your details.',
        'audio-capture': 'No microphone could be accessed. Check your microphone or type your details.',
        'language-not-supported': 'This language is not supported by your browser speech service. Select another language or type your details.',
      };
      if (event.error === 'aborted' && userRequestedVoiceStop) return;
      fail(messages[event.error] || 'Speech recognition stopped. Your transcript is retained; retry or type your details.');
    };
    recognition.onend = () => {
      if (recognitionInstance !== recognition) return;
      recognition.sessionEnded = true;
      if (recognition.finishRequested) { recognition.finish(); return; }
      if (!isVoiceRecording) return;
      if (restarts >= MAX_VOICE_RESTARTS) {
        fail('Speech recognition paused repeatedly. Review the retained transcript and click Fill form, or start a new recording.');
        return;
      }
      const delay = 300 * (2 ** restarts++);
      voiceRestartTimer = setTimeout(() => {
        if (recognitionInstance !== recognition || !isVoiceRecording) return;
        try { recognition.start(); }
        catch(e) { fail('Voice input could not restart. Review the transcript or start a new recording.'); }
      }, delay);
    };
    cleanUpVoiceUI();
    recognition.start();
  } catch(e) {
    fail('Voice input could not start. Check microphone access and try again, or type your details.');
  }
}
window.toggleVoiceInput = toggleVoiceInput;

async function handleCompletedSpeech(selectedLang, transcript) {
  const textarea = document.getElementById('nl-text');
  const rawText = (transcript ?? textarea?.value ?? accumulatedTranscript).trim();
  if (!rawText) {
    voiceProcessing = false;
    cleanUpVoiceUI();
    showVoiceWarning('No speech detected. Start a new recording or type your details.');
    return;
  }
  voiceProcessing = true;
  cleanUpVoiceUI();
  try {
    const englishText = await translateToEnglish(rawText, selectedLang);
    if (textarea) textarea.value = englishText;
    await parseNLProfile(englishText, { translated: true });
  } catch(e) {
    showVoiceWarning('Translation or profile extraction is unavailable. Your transcript is retained. Retry or fill the form manually; no eligibility check was run.');
  } finally {
    voiceProcessing = false;
    cleanUpVoiceUI();
  }
}

async function parseNLProfile(explicitText, options = {}){
  if (isVoiceRecording) return;
  let text = (typeof explicitText === 'string' ? explicitText : (document.getElementById('nl-text')?.value || '')).trim();
  const noteEl = document.getElementById('nl-note');
  const btn = document.getElementById('nl-btn');
  if(!text){ 
    if (noteEl) {
      noteEl.textContent = 'Type or speak a short description of yourself first.'; 
      noteEl.className='nlnote warn'; 
    }
    return; 
  }

  if (btn) { btn.disabled = true; btn.textContent = 'Reading…'; }
  if (noteEl) { noteEl.className = 'nlnote'; noteEl.textContent = ''; }

  try {
    // Translate once; voice completion has already translated its transcript.
    const langSelect = document.getElementById('nl-voice-lang');
    const selectedLang = langSelect ? langSelect.value : 'auto';
    const hasNonAscii = /(?=[^\x00-\x7F])\p{Letter}/u.test(text);

    if (!options.translated && (hasNonAscii || (selectedLang && selectedLang !== 'en-IN' && selectedLang !== 'en-US'))) {
      if (noteEl) noteEl.textContent = 'Translating to English...';
      const translated = await translateToEnglish(text, selectedLang);
      if (translated && translated.trim()) {
        text = translated.trim();
        const ta = document.getElementById('nl-text');
        if (ta) ta.value = text;
      }
    }

    let profile = {};
    let notes = [];
    let missingRequired = [];

    try {
      const json = await fetchProfileJSON(API_BASE+'/profile/parse', {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({text}),
      });
      if (json) {
        if (json.data && json.data.profile) {
          profile = json.data.profile;
          missingRequired = json.data.missingRequired || [];
          notes = json.data.notes || [];
        }
      }
    } catch(e) {
      // API offline, fallback will handle it
    }

    // Merge local deterministic extraction as fallback or supplement
    const local = localExtractProfile(text);
    Object.keys(local).forEach(k => {
      if (!profile[k]) profile[k] = local[k];
    });

    Object.assign(profile, extractDeclaredFlags(text));
    const declaredIncome = extractIncomeBucket(text);
    if (declaredIncome) profile.inc = declaredIncome;
    else if (declaredIncome === null) {
      delete profile.inc;
      const incomeField = document.getElementById('ef-inc');
      if (incomeField) incomeField.value = '';
    }

    unlockEligibilityForm();
    const filledFields = [];
    Object.entries(profile).forEach(([field, value]) => {
      const elId = NL_FIELD_MAP[field];
      const el = elId && document.getElementById(elId);
      if (el && value) {
        if (el.tagName === 'SELECT') {
          el.value = value;
          // Case-insensitive or text matching fallback for select options
          if (!el.value) {
            const valLower = String(value).toLowerCase().trim();
            for (const opt of el.options) {
              if (opt.value.toLowerCase() === valLower || opt.text.toLowerCase() === valLower) {
                el.value = opt.value;
                break;
              }
            }
          }
        } else {
          el.value = value;
        }
        if (el.value) {
          filledFields.push(FIELD_LABELS[field] || field);
          el.style.transition = 'all 0.3s ease';
          el.style.borderColor = 'var(--gn)';
          el.style.boxShadow = '0 0 0 2px rgba(16, 185, 129, 0.25)';
          setTimeout(() => {
            el.style.borderColor = '';
            el.style.boxShadow = '';
          }, 3000);
        }
      }
    });
    saveFormData();

    // If user mentioned a name in the AI box, set it as their name across the app
    if (profile.name) {
      U.name = profile.name;
      const efName = document.getElementById('ef-name');
      if (efName) efName.value = profile.name;
      const sbName = document.getElementById('sbName');
      if (sbName) sbName.textContent = profile.name;
      const sbAv = document.getElementById('sbAv');
      if (sbAv) sbAv.textContent = profile.name.slice(0, 2).toUpperCase();
      const wbName = document.getElementById('wbName');
      if (wbName) wbName.textContent = profile.name;
      if (typeof updateUI === 'function') updateUI();
      saveFormData();
    }

    missingRequired = ['cat', 'edu', 'inc'].filter(f => !profile[f]);

    if (filledFields.length > 0) {
      const msg = `Auto-filled: ${filledFields.join(', ')}.` + (missingRequired.length ? ` Still need: ${missingRequired.map(f=>FIELD_LABELS[f]||f).join(', ')}.` : ' Review the filled fields before checking schemes.');
      if (noteEl) {
        noteEl.textContent = msg;
        noteEl.className = 'nlnote' + (missingRequired.length ? ' warn' : '');
      }
      const formEl = document.querySelector('.eform');
      if (formEl) formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      if (noteEl) {
        noteEl.textContent = 'Could not extract details. Please fill in the form manually below.';
        noteEl.className = 'nlnote warn';
      }
    }

  } catch(e) {
    if (noteEl) { noteEl.textContent = 'Could not translate or read your details. Review the transcript and fill the form manually, or retry.'; noteEl.className = 'nlnote warn'; }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Fill form with AI'; }
  }
}
window.parseNLProfile = parseNLProfile;

// ══ FORM DATA PERSISTENCE & LOCK/UNLOCK STATE ══
const ELIG_FORM_STORAGE_KEY = 'sf_elig_form';
const ELIG_LOCK_STORAGE_KEY = 'sf_form_locked';

const ELIG_FIELD_IDS = [
  'ef-name', 'ef-age', 'ef-gender', 'ef-state', 'ef-cat', 'ef-inc',
  'ef-edu', 'ef-marks', 'ef-firstgrad', 'ef-disability', 'ef-parentdis',
  'ef-parentocc', 'ef-stream'
];

function getFormData() {
  const data = {};
  ELIG_FIELD_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) data[id] = el.value || '';
  });
  return data;
}

function saveFormData() {
  try {
    const data = getFormData();
    const showingResults = !document.getElementById('elig-results')?.classList.contains('hidden');
    const changed = Object.entries(NL_FIELD_MAP).some(([field,id]) => data[id] !== undefined && data[id].trim() !== (U[field] || ''));
    if (changed) {
      LAST_MATCH = null;
      ['elig-followups','elig-results','bestfit-results','ai-explain-box'].forEach(id => document.getElementById(id)?.classList.add('hidden'));
    }
    // Clearing a field must also clear its persisted value.
    localStorage.setItem(ELIG_FORM_STORAGE_KEY, JSON.stringify(data));
    if (typeof invalidateEligibilityDetails === 'function') {
      const next = { ...U };
      Object.entries(NL_FIELD_MAP).forEach(([field,id]) => { if (data[id] !== undefined) next[field] = data[id].trim(); });
      U.eligibilityDetails = invalidateEligibilityDetails(U, next);
    }
    Object.entries(NL_FIELD_MAP).forEach(([field, id]) => {
      if (data[id] !== undefined) U[field] = data[id].trim();
    });
    if (typeof saveProfileLocal === 'function') saveProfileLocal();
    if (changed && typeof refreshProfileViews === 'function') {
      refreshProfileViews({results:showingResults});
      if (typeof scheduleProfileSync === 'function') scheduleProfileSync();
    }
  } catch(e) {}
}

function lockEligibilityForm() {
  const container = document.getElementById('elig-form-container');
  if (container) container.classList.add('is-locked');
  
  ELIG_FIELD_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = true;
  });

  const lockPill = document.getElementById('eform-lock-pill');
  if (lockPill) {
    lockPill.style.display = 'inline-flex';
    lockPill.className = 'eform-status-pill locked';
    lockPill.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Details Saved &amp; Locked`;
  }

  const editBtn = document.getElementById('ef-edit-btn');
  if (editBtn) editBtn.style.display = 'inline-flex';

  const submitBtn = document.getElementById('ef-submit-btn');
  if (submitBtn) {
    submitBtn.textContent = 'Re-check Eligibility →';
  }

  try { localStorage.setItem(ELIG_LOCK_STORAGE_KEY, 'true'); } catch(e) {}
}

function unlockEligibilityForm() {
  const container = document.getElementById('elig-form-container');
  if (container) container.classList.remove('is-locked');

  ELIG_FIELD_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = false;
  });

  const lockPill = document.getElementById('eform-lock-pill');
  if (lockPill) {
    lockPill.style.display = 'inline-flex';
    lockPill.className = 'eform-status-pill editing';
    lockPill.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> Editing Details`;
  }

  const editBtn = document.getElementById('ef-edit-btn');
  if (editBtn) editBtn.style.display = 'none';

  const submitBtn = document.getElementById('ef-submit-btn');
  if (submitBtn) {
    submitBtn.textContent = 'Save & Find Eligible Schemes →';
  }

  try { localStorage.setItem(ELIG_LOCK_STORAGE_KEY, 'false'); } catch(e) {}

  const firstInput = document.getElementById('ef-name');
  if (firstInput && !firstInput.disabled) firstInput.focus();
}

function restoreSavedEligibilityForm() {
  let saved = null;
  try {
    const raw = localStorage.getItem(ELIG_FORM_STORAGE_KEY);
    if (raw) saved = JSON.parse(raw);
  } catch(e) {}

  // Fallback to global U if form storage is not yet populated
  if (typeof U !== 'undefined' && U && (profileSet || !saved)) {
    saved = {
      'ef-name': U.name || '',
      'ef-age': U.age || '',
      'ef-gender': U.gender || '',
      'ef-state': U.state || '',
      'ef-cat': U.cat || '',
      'ef-inc': U.inc || '',
      'ef-edu': U.edu || '',
      'ef-marks': U.marks || '',
      'ef-stream': U.stream || '',
      'ef-firstgrad': U.firstGrad || '',
      'ef-disability': U.disability || '',
      'ef-parentdis': U.parentDisabled || '',
      'ef-parentocc': U.parentOcc || '',
    };
  }

  let hasData = false;
  if (saved) {
    ELIG_FIELD_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el && saved[id] !== undefined) {
        el.value = saved[id];
        if(saved[id] !== '')hasData = true;
      }
    });
  }

  // Check lock state
  let isLocked = false;
  try {
    const lockVal = localStorage.getItem(ELIG_LOCK_STORAGE_KEY);
    if (lockVal === 'true') {
      isLocked = true;
    } else if (lockVal === null && hasData && saved && saved['ef-cat'] && saved['ef-edu'] && saved['ef-inc']) {
      isLocked = true;
    }
  } catch(e) {}

  if (isLocked && hasData) {
    lockEligibilityForm();
  } else {
    unlockEligibilityForm();
    const lockPill = document.getElementById('eform-lock-pill');
    if (lockPill && !hasData) lockPill.style.display = 'none';
  }
}

function initFormAutoSave() {
  ELIG_FIELD_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.removeEventListener('input', saveFormData);
      el.removeEventListener('change', saveFormData);
      el.addEventListener('input', saveFormData);
      el.addEventListener('change', saveFormData);
    }
  });
}

window.unlockEligibilityForm = unlockEligibilityForm;
window.lockEligibilityForm = lockEligibilityForm;
window.restoreSavedEligibilityForm = restoreSavedEligibilityForm;
window.initFormAutoSave = initFormAutoSave;
window.saveFormData = saveFormData;

// ══ PREFILL FROM SAVED PROFILE ══
// U is restored from localStorage/account before this ever runs (see
// bootProfile() in init.js). Only fills fields that are currently empty, so
// it never clobbers text the student is mid-typing if this gets called more
// than once.
const EF_FIELD_MAP = {
  'ef-name':'name', 'ef-age':'age', 'ef-gender':'gender', 'ef-state':'state',
  'ef-cat':'cat', 'ef-inc':'inc', 'ef-edu':'edu', 'ef-marks':'marks',
  'ef-stream':'stream', 'ef-firstgrad':'firstGrad', 'ef-disability':'disability',
  'ef-parentdis':'parentDisabled', 'ef-parentocc':'parentOcc',
};
function fillEligibilityForm(){
  Object.entries(EF_FIELD_MAP).forEach(([elId, key]) => {
    const el = document.getElementById(elId);
    const val = U[key];
    if(el && !el.value && val) el.value = val;
  });
}
window.fillEligibilityForm = fillEligibilityForm;

// Every recommendation surface uses the same saved profile and ranking.
function renderEligibilityMatches(profile=U){
  const list=document.getElementById('elig-list'),section=document.getElementById('elig-results');
  if(!list || !section)return;
  const ranked=ProgrammeRules.rank(SchemeCatalog.forProfile(profile),profile,{excludeFailed:true});
  document.getElementById('eres-count').textContent=ranked.length+' profile matches';
  list.innerHTML=ranked.map(({s,check,profileMatch:fit},index)=>{
    const rate=ProgrammeRules.rate(s,profile);
    const amount=rate.amount?'₹'+rate.amount.toLocaleString('en-IN')+(rate.annual?'/year':''):s.benefitVerified?'Course-specific benefit':'Benefit details';
    return `<article class="erc" data-eligibility-scheme="${escapeSchemeText(s.id)}"><div class="erc-ico" style="color:var(--${s.col})">${getSchemeIcon(s)}</div><div class="erc-main"><div class="erc-name">${escapeSchemeText(s.name)}${index===0?'<span class="match-best">Best match</span>':''}</div><div class="erc-by">${escapeSchemeText(s.by)}</div><div class="erc-brow"><div class="erc-b"><div class="erc-bf" style="width:${fit.percent || 0}%;background:${scoreColor(fit.percent || 0)}"></div></div><span class="erc-pct" title="${escapeSchemeText(ProgrammeRules.matchExplanation(s,profile))}">${escapeSchemeText(ProgrammeRules.matchText(s,profile))}</span></div><details class="erc-details"><summary>Requirements &amp; benefit details</summary><p>${escapeSchemeText(rate.label)}</p><p>${escapeSchemeText(programmeStatusText(s,profile))}${check.blocks[0]?' · '+escapeSchemeText(check.blocks[0]):''}</p><p>${escapeSchemeText(ProgrammeRules.matchExplanation(s,profile))}</p></details></div><div class="erc-r"><div class="erc-amt">${escapeSchemeText(amount)}</div><button class="kbtn-track" data-eligibility-chat="${escapeSchemeText(s.id)}">Guide me →</button></div></article>`;
  }).join('') || '<div class="eno-results">No matching programme for these saved details. You can browse other programmes in All Schemes.</div>';
  list.onclick=event=>{const button=event.target.closest('[data-eligibility-chat]');if(button){goPanel('chat');addAI(startGuidedApplication(button.dataset.eligibilityChat));}};
  section.classList.remove('hidden');
}

// ══ ELIGIBILITY CHECKER ══
async function runElig(){
  const eu = {
    name:document.getElementById('ef-name').value.trim(),
    age:document.getElementById('ef-age').value.trim(),
    gender:document.getElementById('ef-gender').value,
    state:document.getElementById('ef-state').value,
    cat:document.getElementById('ef-cat').value,
    inc:document.getElementById('ef-inc').value,
    edu:document.getElementById('ef-edu').value,
    marks:document.getElementById('ef-marks').value.trim(),
    stream:document.getElementById('ef-stream').value,
    firstGrad:document.getElementById('ef-firstgrad').value,
    disability:document.getElementById('ef-disability').value,
    parentDisabled:document.getElementById('ef-parentdis').value,
    parentOcc:document.getElementById('ef-parentocc').value,
  };
  if(!eu.cat||!eu.edu||!eu.inc){
    alert('Please fill in at least Category, Education Level, and Income to get accurate results.');
    return;
  }
  // Always update global profile with form inputs, and persist it so the
  // next visit — or a scheme-specific re-check — starts prefilled instead
  // of asking the student to retype everything.
  if (typeof invalidateEligibilityDetails === 'function') U.eligibilityDetails = invalidateEligibilityDetails(U, eu);
  Object.assign(U, eu);
  if (typeof ReviewedConditions !== 'undefined') eu.eligibilityDetails = ReviewedConditions.sanitizeDetails(U.eligibilityDetails);
  profileSet = true;
  saveFormData();
  lockEligibilityForm();
  if (typeof saveProfileLocal === 'function') saveProfileLocal();
  if (typeof pushProfileToBackend === 'function') pushProfileToBackend();
  updateUI();
  updateDashboard();
  if (typeof renderEligibilityFollowups === 'function') renderEligibilityFollowups(eu);

  const resEl=document.getElementById('elig-results');
  const listEl=document.getElementById('elig-list');
  renderEligibilityMatches(eu);

  // Ask the real backend engine (eligibilityEngine.js + conflictEngine.js)
  // first. Falls back to the local SCHEMES/eligFn copy only if the API is
  // unreachable, so the checker still works offline.
  const apiData = await fetchMatch(eu);
  // Editing the profile while a request is running invalidates that result.
  if (Object.keys(eu).some(key => key !== 'eligibilityDetails' && U[key] !== eu[key]) ||
      JSON.stringify(U.eligibilityDetails || {}) !== JSON.stringify(eu.eligibilityDetails || {})) {
    LAST_MATCH = null;
    if(profileSet)renderEligibilityMatches(U);else resEl.classList.add('hidden');
    return;
  }
  markChecklist('elig');

  let eligible, partial, bestFitData;
  if(apiData){
    eligible = apiData.eligible.slice().sort((a,b)=>b.score-a.score);
    partial = apiData.needsVerification.slice().sort((a,b)=>b.score-a.score);
    bestFitData = { eligible: apiData.eligible, bestCombo: apiData.bestCombo, comboTotalValue: apiData.comboTotalValue, excludedByConflict: apiData.excludedByConflict, comboCompatibility: apiData.comboCompatibility };
    renderAIExplanation(apiData.explanation);
  } else {
    document.getElementById('ai-explain-box').classList.add('hidden');
    const results = SCHEMES.map(s=>{
      const r=scoreScheme(s,eu);
      return {...s,...r};
    }).filter(s=>s.score>0).sort((a,b)=>b.score-a.score);
    eligible=results.filter(r=>r.eligible);
    partial=results.filter(r=>!r.eligible&&r.score>0);
    bestFitData = typeof computeBestFit==='function' ? computeBestFit(eu, SCHEMES) : null;
  }
  renderBestFit(bestFitData, !apiData);
  if(window.__fromChatFindSchemes){window.__fromChatFindSchemes=false;setTimeout(()=>{goPanel('chat');sendQ('find my schemes');},1200);}
  renderEligibilityMatches(eu);
  updateDashboard();
  if (typeof renderEligibilityFollowups === 'function') renderEligibilityFollowups(eu);
  resEl.scrollIntoView({behavior:'smooth'});
  if(document.getElementById('schGrid')) renderSchemes(currentSchFilter);
}

// ══ AI EXPLANATION ══
// Pure phrasing layer over the deterministic result above — see backend/src/
// services/aiExplain.service.js. Never decides eligibility; if AI is
// unavailable the backend already falls back to a template, so this only
// has to render whatever comes back.
function renderAIExplanation(explanation){
  const el = document.getElementById('ai-explain-box');
  if(!explanation){ el.classList.add('hidden'); return; }
  const qualify = (explanation.whyYouQualify||[]).filter(r=>typeof r==='string').map(r=>`<div>• ${escapeSchemeText(r.replace(/^[✓\s]+/, ''))}</div>`).join('');
  const notSelected = (explanation.whyOthersWerentSelected||[]).filter(r=>typeof r==='string').map(r=>`<div>• ${escapeSchemeText(r.replace(/^[⚠\s]+/, ''))}</div>`).join('');
  el.innerHTML = `
    <details class="ai-explain">
      <summary class="ai-explain-lbl">${explanation.aiGenerated?'AI Explanation':'Screening summary'}</summary>
      <div style="margin-bottom:${qualify||notSelected?'10px':'0'}">${escapeSchemeText(explanation.summary)}</div>
      ${qualify?`<div style="font-weight:700;font-size:11.5px;margin-bottom:4px">Why you qualify</div>${qualify}`:''}
      ${notSelected?`<div style="font-weight:700;font-size:11.5px;margin:8px 0 4px">Why others weren't selected</div>${notSelected}`:''}
    </details>`;
  el.classList.remove('hidden');
}

// ══ CONFLICT-AWARE BEST-FIT RECOMMENDATION ══
function renderBestFit(r,isLocalFallback){
  const el=document.getElementById('bestfit-results');
  if(!r?.bestCombo?.length){el.classList.add('hidden');return;}
  const s=r.bestCombo[0];
  el.innerHTML=`<div class="eres-title">Annual benefit estimate <span class="ecount">₹${Number(s.amtNum || 0).toLocaleString('en-IN')}/year if selected</span></div><div class="erc"><div class="erc-ico" style="color:var(--${s.col})">${getSchemeIcon(s)}</div><div style="flex:1;min-width:0"><div class="erc-name">${escapeSchemeText(s.name)}</div><div class="erc-by">Your answers meet the published screening conditions.</div><div class="chat-programme-note">This is one programme’s annual rate. Awards are not added together when combination permission is unconfirmed.</div><a class="scheme-primary" href="${escapeSchemeText(officialSchemeUrl(s.guidelineUrl || s.source))}" target="_blank" rel="noopener noreferrer">View programme guideline ↗</a></div></div>${isLocalFallback?'<p class="chat-programme-note">Using the downloaded rules while the online service is unavailable.</p>':''}`;
  el.classList.remove('hidden');
}
