# SchemeMatch prototype-round script — 10 October 2026

This script follows the current local code, reviewed on 10 October. Latest rerun: **150 tests passed, zero failed or skipped**. Three localhost HTTP checks needed an approved rerun outside sandbox restrictions. No new live browser, government portal, model or MongoDB test was performed for this script. Existing docs describe prior browser/account checks; those are prior evidence, not checks repeated today.

## What changed since yesterday's guide

The catalogue remains 120 records (77 state, 31 central, 12 other), with approved directory coverage across 15 states. Seven central records now enable reviewed screening and source-recorded annual-rate calculations: CSSS, plus degree and diploma variants of Pragati, Saksham and Swanath. The other 113 records remain information-only or partially reviewed. ProgrammeRules calculates applicable amounts at runtime; canonical amtNum remains zero in source records.

Profile-match percentage is a saved-profile recommendation heuristic. It is separate from strict screening completion and from government selection probability. Guided document preparation is active. A service worker caches 40 public app resources after a successful online visit. Offline core browsing/checks/preparation work with that cached shell; accounts, external official portals, online AI and translation still need network access. This current snapshot supersedes older blanket statements in HACKATHON_PROJECT_GUIDE.md that all matching/calculators/guidance are disabled and reload caching is absent.

## 1. The sentence to remember

“SchemeMatch helps a student move from ‘I don't know which scholarship to look for’ to relevant official programmes, explained screening checks and an organised preparation plan.”

## 2. Prepare the demonstration

Use a separate test browser session and fictional details, not an existing student's real account. Start frontend with the project's `npm start` script and, when using online backend features, start backend with `npm run backend`. Follow RTK command conventions in this workspace: `rtk npm start` and `rtk npm run backend`, in separate terminals. Do not reinstall packages or edit configuration just before the round unless something is actually broken. No hosting deployment is established by a running local demo.

Prepare this fictional persona through normal controls:

- Name: Ananya Demo; age 18; gender Female.
- State: Telangana; category SC.
- Education: undergraduate technical degree; first year.
- Annual family income: ₹80,000 / under ₹1 lakh.
- Student disability: No. Other optional personal fields may remain unknown.

For a Pragati screening example, the test fixture supports these additional declared facts: fresh application, AICTE-approved course/institution Yes, regular technical course Yes, dual degree No, other financial assistance No, course year 1, first-year admission entry, study gap 0, girl beneficiaries in family 1. Enter only fictional demonstration answers. Follow the labels displayed in the actual UI; internal keys are not speech lines.

Do not promise a specific match percentage. It changes with saved fields and programme metadata. Do not claim the student has received ₹50,000. The fixture verifies that the implementation produces that programme's annual rate when its supported checks pass.

Before going on stage, rehearse: Find my schemes → Pragati degree card → Check eligibility → questions → Guide me → Yes/No document answers → Track. Check a meaningful guideline link. For the optional offline demo, first load online and reload once so the service worker controls the page, then test a network-disabled reload in your own demo browser. Keep a typed profile and screenshots as backup. Do not rely on real speech recognition or account registration as the first action.

## 3. Seven-minute presentation: say this and do this

### 0:00–0:40 | Problem and introduction

**Say:** “Good morning. A student may be a suitable candidate for educational support but still not know which scheme to search for, which conditions apply or which documents to prepare. Information is spread across portals and guidelines. We built SchemeMatch to make that discovery and preparation journey easier.”

**Show:** Landing page, then enter the application.

**Transition:** “Let me show you this from one student's point of view.”

### 0:40–1:20 | Profile and natural-language entry

**Say:** “This is Ananya, our fictional demo student. She is a first-year technical student in Telangana. She can fill a form or describe her situation naturally. The application converts her description into structured fields, and she can review and correct them.”

**Show:** Use the structured form for a predictable start, or type: “My name is Ananya. I am a female BTech student from Telangana. My annual family income is ₹80,000. I am not disabled.” Review category/course/state/income explicitly and save/run the form. Confirm the UI shows the saved details.

**Say:** “Voice is an additional entry option. We configure eleven locales, but actual recognition depends on the browser and provider.”

**Do not:** Treat profile autofill as certificate verification.

### 1:20–2:00 | Recommendations and match percentages

**Show:** AI Assistant → type `Find my schemes`. Point to cards, match bars, best-match badge and official portal action. Briefly open All Schemes and show state/central filtering if time allows.

**Say:** “The recommendations use her saved profile. These percentages measure profile relevance. They are not the probability that the government will select her. A known incompatible audience or reviewed condition excludes a programme, while unanswered facts stay unanswered.”

**Say:** “The catalogue contains 120 official-reference listings. Seven central programme records have enabled screening and annual-rate logic; the rest retain their review limitations.”

### 2:00–3:15 | Scheme-specific screening

**Show:** Choose AICTE Pragati degree → Check eligibility. Expand the additional details if collapsed. Answer the fictional supported conditions. Show missing information before completion and the status after it. In rehearsal, optionally change one answer such as AICTE approval to No to show an exclusion, then restore the original fictional answer.

**Say:** “A broad match is only the beginning. This programme needs details that the basic form does not establish. We ask about the relevant route, institution approval, course year and other conditions. Deterministic rules evaluate those answers.”

**Say:** “When the implemented published checks pass, the app can calculate the applicable annual rate. For this supported Pragati example, it displays ₹50,000 per year if selected. The authority still verifies evidence and makes the award decision.”

**Do not:** Call the result an approved award or add unrelated programme amounts together.

### 3:15–4:05 | Guided document preparation

**Show:** Guide me on the programme card. Answer Yes to one document. Show the green tick labelled Confirmed by you. Answer No to the next document, expand preparation help, then use Next document if appropriate.

**Say:** “Finding a programme does not finish the job. We guide the student through the programme-specific preparation documents one at a time. If a document is missing, the assistant explains the next preparation step. The green tick records what the student confirmed; it is not independent verification.”

**Say:** “The checklist changes with the programme and route. We don't assume every scholarship needs the same documents.”

### 4:05–4:40 | Tracking and deadlines

**Show:** Track the programme → Application Tracker. Move one fictional stage or enter a safe demo note. Show Deadlines or the nearest deadline notice.

**Say:** “The student can keep a preparation record, remember deadlines and move through application stages. The tracker is local and self-reported. It doesn't claim we have submitted a government application or checked payment status.”

**Say:** “Published windows, renewal-only windows, closed windows and unknown dates are kept separate.”

### 4:40–5:10 | Accessibility and offline core

**Show:** Language selector briefly, or a pre-rehearsed cached offline reload. Do not attempt both if the round is short.

**Say:** “A successful online visit caches the public app shell. The catalogue, local checks and preparation flow can remain available offline. Government portals and account synchronization still require internet.”

If an external provider fails, say: “This part uses an external service. The student can continue with manual input and the local catalogue.” Continue the demo without repeatedly retrying.

### 5:10–6:20 | How we built it

**Show:** One readable architecture diagram.

**Say:** “The interface is HTML, CSS and vanilla JavaScript. We built an Express backend for parsing, accounts, matching and review operations. Both browser and backend use the same versioned catalogue and shared screening logic, so their results remain consistent.”

**Say:** “AI assists interpretation and phrasing. It does not supply the displayed profile relevance score or make the official selection decision.”

**Say:** “For data acquisition, we built a public NSP scraper and a known-source HTML/PDF ingestion pipeline. HTML is parsed with Cheerio; PDF text is extracted with pdf-parse. We retain source evidence and hashes. Backend extraction becomes a pending proposal rather than automatically publishing a new rule.”

**Say:** “MongoDB stores account/profile data and extraction proposals. The student's tracker currently remains local.”

### 6:20–7:00 | Evidence and closing

**Say:** “The latest local run passed 150 automated tests, including catalogue consistency, screening boundaries, recommendation ranking, guided documents, saved-profile races and fallback behavior. Tests establish those cases, not complete real-world policy accuracy or speech accuracy.”

**Say:** “Our next step is to complete more programme reviews and run a student pilot. We want to measure whether students reach the right official source and understand their next step with less effort. SchemeMatch makes the scholarship journey easier to navigate while keeping the source and uncertainty visible. Thank you.”

## 4. Features grouped by category, with the actual functions

### A. Entry and accessibility

| User action | Functions | What they do |
|---|---|---|
| Complete onboarding | selOpt(), mNext(), finishOnboard() | Capture choices, advance steps, finish initial profile |
| Parse description | parseNLProfile(), localExtractProfile(); backend parseProfileText(), deterministicExtract() | Translate/parse as needed, validate extracted fields, use pattern fallback |
| Speak a description | toggleVoiceInput(), setVoiceLang(), handleCompletedSpeech(), cleanUpVoiceUI() | Create a recognition session, preserve its locale, process transcript, release controls |
| Translate profile text | translateToEnglish(), fetchProfileJSON() | Request translation with bounded waiting and explicit failure |
| Translate page | initLangSwitcher(), switchLanguage(), withGoogleCombo() | Apply a selected widget language with provider availability handling |

Voice and page translation are different paths. The app did not train a speech model or translation model.

### B. Profile and persistence

| User action | Functions | What they do |
|---|---|---|
| Read/save form | getFormData(), saveFormData(), saveProfileLocal() | Capture displayed fields and persist student state |
| Edit saved profile | unlockEligibilityForm(), restoreSavedEligibilityForm() | Reopen filled controls rather than force re-entry |
| Change key facts | invalidateEligibilityDetails(), refreshProfileViews() | Clear dependent stale facts and refresh personalised screens |
| Account login/sync | loginAccount(), registerAccount(), pullProfileFromBackend(), pushProfileToBackend() | Authenticate and load/save account profile; saves/races are controlled |

Profile synchronization queues preserve pending offline edits. This does not synchronize all tracker cards. JWT is the login token; bcrypt hashes passwords; Mongoose maps account objects to MongoDB records.

### C. Discovery and explanations

| User action | Functions | What they do |
|---|---|---|
| Browse relevant listings | SchemeCatalog.forProfile(), renderSchemes() | Filter state/sector/audience and render cards |
| Rank suggestions | ProgrammeRules.profileMatch(), ProgrammeRules.rank() | Calculate saved-profile relevance and sort consistently |
| Ask for recommendations | doSend(), getReply(), routeCatalogueChat(), handleFindMySchemesFlow(), renderCatalogueMatches() | Route the task and show up to six ranked cards |
| Explain percentage | renderProfileMatchExplanation(), ProgrammeRules.matchExplanation() | Show the weighted factors behind the score |
| Change a hypothetical fact | renderCatalogueWhatIf() | Compare a parsed proposed change without claiming a hypothetical award |

Typical percentage calculation: round(100 × relevance points / applicable maximum points). Saved state contributes up to 25, education 30, category 25, targeted gender 5, and each distinct answered reviewed condition 5. Broad audiences receive less relevance than specific ones. Unknown fields are excluded from the denominator. A known exclusion forces zero and can remove the programme from recommendations.

Do not confuse profileMatch().percent with score().matchPercent: the latter describes screening-check completion in reviewed records. Neither is an official selection probability.

### D. Screening and benefits

| User action | Functions | What they do |
|---|---|---|
| Run full current check | runElig(), fetchMatch() | Save profile, attempt API, reject stale responses, use local fallback |
| Evaluate one programme | ReviewedConditions.evaluate(), ProgrammeRules.score() | Apply relevance, conditional routes, numerical boundaries and missing facts |
| Ask additional questions | renderEligibilityFollowups(), applyEligibilityFollowups(), chatConditionQuestion() | Collect valid necessary answers and recompute |
| Display results | renderEligibilityMatches(), renderBestFit(), renderAIExplanation() | Separate results, amounts and phrased explanations |
| Calculate rate | ProgrammeRules.rate(), ProgrammeRules.potential(), calcBenefit() | Use recorded benefit type and supported course/year; distinguish published rate from personal screening |
| Remaining fees | calcLoan() | Nonnegative entered fee minus entered award, not interest or loan underwriting |

For current reviewed records, matches() chooses one best supported annual rate. It does not sum unknown coexistence combinations. Nonannual overseas caps do not become annual totals. Legacy maxWeightIndependentSet() exists for graph optimization, but is not the headline current verified-combination path.

### E. Document guidance and student organisation

| User action | Functions | What they do |
|---|---|---|
| Start guidance | startGuidedApplication(), startCatalogueGuidance() | Enter the current catalogue preparation flow |
| Select relevant documents | ProgrammeRules.documents(), renderCatalogueDocumentStep() | Filter conditional checklist entries and ask contextual details |
| Confirm ready/missing | answerCatalogueDocument(), answerGuidedStep() | Record self-report, show green confirmation or missing-document help |
| Track programme | addToTracker(), renderTracker() | Create/display locally saved application-preparation cards |
| Move/edit stage | moveStage(), updateAppField(), saveApplications() | Save the student's updates locally |
| Calendar download | exportIcs() | Generate calendar events from entered tracked deadlines |
| Checklist | markChecklist(), toggleChecklist(), updateChecklistUI() | Persist automatic check completion and self-reported steps |

Do not request Aadhaar or bank numbers in this demo; document readiness uses yes/no confirmations rather than collecting identifiers.

### F. Notices, dates and app infrastructure

| Feature | Functions/modules | Scope |
|---|---|---|
| Scholarship dates | renderDeadlines(), schemeWindowText() | Sorted relevant windows and unknown/closed distinctions |
| Education notices | renderEducationNews() | Filterable maintained snapshot, not a general live news scraper |
| Exam dates | renderExamCalendar(), ExamCalendar.filter(), schedule(), today() | 42 organiser references, published/past/unconfirmed dates, IST countdowns |
| Dashboard | updateDashboard() | Shared ranked suggestions, benefit state and next-step indicators |
| Navigation | goApp(), goPanel(), setPage() | Switch visible pages/panels and preserve view preference |
| Offline reload | offline.js registration; sw.js install/activate/fetch | Cache 40 public resources; do not cache API/account responses |
| Catalogue maintenance | scrape-nsp.cjs, import-nsp.cjs, build-catalog.cjs | Snapshot → selected import → validation/versioned bundle |
| Ingestion review | officialFetch, fetchHtml/fetchPdf, structureViaLLM, runDailyIngestion(), reviewProposal() | Bounded official-source fetch → proposal → restricted decision |

## 5. How to describe what we did technically

1. Built a static responsive student workspace with onboarding, dashboard, assistant and forms.
2. Structured programme records with stable IDs, official links, audience metadata, windows and review scope.
3. Built a public NSP parser that separates student deadlines from verification dates and stores evidence snapshots.
4. Built bounded HTML/PDF extraction and pending review proposals; did not blindly trust model confidence.
5. Added a versioned catalogue and shared rule modules for browser/backend parity.
6. Added contextual screening, input validation and fail-closed unknown/unsupported branches.
7. Separated relevance ranking, strict screening and source-recorded rate calculations.
8. Added programme/route-specific document checklists and one-document-at-a-time guidance.
9. Added account/profile persistence, local tracking, save queues and delayed-response protection.
10. Added multilingual input/provider handling and public-resource offline caching.
11. Added automated regression tests; today's rerun passed 150.

## 6. Likely questions and short answers

**Is the matching score AI-generated?** No. It is a deterministic weighted calculation from saved facts and programme metadata. AI assists parsing and wording.

**Does 90% match mean a 90% chance of receiving money?** No. It measures relevance. Screening checks and authority selection are separate.

**Why only seven enabled records?** They have the implemented reviewed screening/rate logic. The remaining catalogue is useful for discovery but should not inherit unsupported eligibility guarantees.

**What does ₹50,000 mean?** In the supported Pragati implementation it is a recorded annual programme rate if selected, not an award issued by our platform. Incomplete checks retain uncertainty.

**Are you combining every scholarship?** No. The current reviewed path does not assume coexistence permission and shows one annual rate. A legacy graph engine exists, but broader compatibility review remains necessary.

**Where is the AI?** Backend OpenRouter calls assist parsing, explanations and proposed source structuring. Many catalogue chat actions and all relevance/rule calculations are local/deterministic.

**Why both local and server checks?** The local path remains useful during API failure; shared modules reduce drift, and catalogue version checks reject stale responses.

**What happens offline?** After successful caching, the core public app and local saved profile/checks/guidance work. External portals, account sync and online providers require reconnection.

**Does the green tick prove a document is valid?** No. It means Confirmed by you. The administering authority verifies documents.

**What does MongoDB store?** Users/profiles/saved scheme IDs and ingestion proposals, plus a legacy Scheme model. The active directory comes from the generated shared catalogue; tracker stages remain local.

**How do you update data?** Public scrape evidence and known-source ingestion support research; reviewed imports/builds maintain the catalogue. Model output alone does not publish rules.

**What do 150 tests prove?** Those regression fixtures pass, including rule boundaries, rankings, account-save races and fallback behavior. They do not prove every scheme is current, all languages are accurate or every live integration works.

## 7. Two-minute backup pitch

“SchemeMatch helps students navigate scattered scholarship information. A student enters a profile and sees relevant official programmes. Here, Find my schemes produces ranked recommendations from saved details. These percentages measure relevance, not selection probability. For reviewed programmes, Check eligibility asks the necessary questions and evaluates deterministic rules. Guide me then helps prepare one document at a time, while the tracker records the student's progress. Both browser and backend use a shared versioned catalogue. Scraping gathers source evidence, and model extraction stays pending review. Our current catalogue has 120 listings, with seven central programme records enabled for screening and annual-rate logic. After an online visit, cached core features can work offline. Today's local run passed 150 tests. Next we will expand source-backed rule coverage and evaluate whether students find the correct official programme and next step more easily.”

## 8. Claims to use and avoid

Use: “prototype”, “official-reference listing”, “saved-profile relevance”, “published checks met on your answers”, “rate if selected”, “self-reported preparation”, “cached core works offline”.

Avoid: “government endorsed”, “guaranteed money”, “zero rejection”, “AI verifies documents”, “every scheme fully reviewed”, “fully offline first visit”, “live payment tracking”, “we submit the application”, and unmeasured accuracy/performance claims.
