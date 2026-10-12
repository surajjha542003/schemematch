# SchemeMatch implementation review — 9 October 2026

> Current implementation: see [Data flow and remaining work](DATA_FLOW_AND_REMAINING_WORK.md). The directory now has 48 records (22 state, 14 central scholarships, 12 other-sector). Active views use one shared bundle, legacy unreviewed scoring is withheld, source reviews are protected and manual, and unsupported totals/deadlines/guides were removed. The detailed stages below describe the earlier implementation and are retained as review history. The configured database currently rejects authentication; credential setup and restart instructions are in the current document.

## Implemented scope

The user approved the 15-state shortlist and retaining the existing 11 voice options (10 Indian languages plus English). This change extends the current vanilla JavaScript/Express app; it does not migrate frameworks or deploy the app. Existing unrelated workspace changes were preserved.

The shared JSON directory contains 22 student scholarship/programme-family listings across the 15 approved states. Frontend browsing works from the bundled directory without the backend. Backend catalogue reads include these listings even when a database has an older seed. State and central filters, search, source links and local chat information are available. These are directory listings, not 22 fully validated eligibility implementations.

Every directory record has `matchingEnabled: false`, `eligibilityVerification: pending`, a source-check date and a precise verification scope. One overlapping Tamil Nadu college listing replaces its old catalogue entry by ID; that listing is withheld from matching pending a complete rule review. Other legacy matching rules have not been comprehensively re-audited.

## Verification policy

An official-reference check establishes programme identity and a government source route. It does not establish complete current-cycle eligibility, an open application window, successful login/submission, accurate payments, or independent applicant endorsement. No citizen accounts were accessed or applications submitted. Government technical-operator references are used where department/application portals could not be read. Third-party scholarship sites and public reviews are not eligibility authorities.

## State evidence directory

| State | Listings included | Official reference | Access finding |
|---|---|---|---|
| Tamil Nadu | Post-Matric Scholarship — College (BC/MBC/DNC) | [Official reference](https://bcw.tn.gov.in/sub_page/8) | Department rules readable; USSP login and submission not tested. |
| Maharashtra | Government of India Post-Matric Scholarship (SC) — Maharashtra; Post-Matric Scholarship (ST) — Maharashtra; Post-Matric Scholarship to OBC Students — Maharashtra; State Government Open Merit Scholarship — Maharashtra | [Official reference](https://mahadbt.maharashtra.gov.in/) | MahaDBT 1.0 information readable; its notice directs 2026–27 applications to MahaDBT 2.0. The 2.0 portal could not be read by this checker; login and submission not tested. |
| West Bengal | Swami Vivekananda Merit-cum-Means Scholarship | [Official reference](https://svmcm.wb.gov.in/page/about.php) | Scheme information readable; login and submission not tested. |
| Rajasthan | Post-Matric Scholarships — Rajasthan | [Official reference](https://scholarship.rajasthan.gov.in/) | Portal information readable; login and submission not tested. |
| Gujarat | Post-Matric Scholarship for SC Students (BCK-6.1) | [Official reference](https://sje.gujarat.gov.in/DSCW/schemes/1521?lang=English) | Scheme information readable; Digital Gujarat application access not confirmed. |
| Odisha | e-Medhabruti — MMCPY; Gopabandhu Sikhya Sahayata Yojana | [Official reference](https://dhe.odisha.gov.in/en) | Department information readable; application portal requires JavaScript and a browser check. |
| Kerala | Pre- and Post-Matric Educational Assistance — eGrantz | [Official reference](https://egrantz.kerala.gov.in/) | Portal information readable; individual notice, login and submission not tested. |
| Telangana | Post-Matric Scholarships — TG ePASS | [Official reference](https://tgepass.cgg.gov.in/homeServicePMSPreReg) | 2026–27 fresh pre-registration page readable; completed application not tested. |
| Andhra Pradesh | Post-Matric Fee Reimbursement and Maintenance Assistance | [Official reference](https://westgodavari.ap.gov.in/social-welfare/) | Government reference readable; JnanaBhumi requires JavaScript and a browser check. |
| Bihar | Post-Matric Scholarship (BC/EBC) — Bihar | [Official reference](https://pmsonline.bihar.gov.in/2026-27/pms/pms_online/Default.aspx) | Portal information readable; published student window ended 30 September 2026; extension not verified. |
| Haryana | Post-Matric Scholarships (SC/BC) — Haryana; State Merit Scholarship to UG/PG Students — Haryana; State Merit Scholarship to UG Girls — Haryana | [Official reference](https://harchhatravratti.highereduhry.ac.in/Eligibility) | Eligibility page readable; login and submission not tested. |
| Jharkhand | Post-Matric Scholarships — e-Kalyan | [Official reference](https://www.cgg.gov.in/it_project/e-kalyan-government-of-jharkhand/) | Official technical-operator reference readable; application portal timed out during checking. |
| Chhattisgarh | Post-Matric Scholarships (SC/ST/OBC) — Chhattisgarh | [Official reference](https://postmatric-scholarship.cg.nic.in/) | Portal readable in an earlier check on 9 October 2026; later fetch attempts failed. Login and submission not tested. |
| Uttar Pradesh | Scholarships and Fee Reimbursement — Uttar Pradesh | [Official reference](https://lalitpur.nic.in/en/key-e-governance-projects/) | Government reference readable; application portal availability not confirmed. |
| Assam | Combined Merit Scholarship — Assam; PG Research Scholarship — Assam | [Official reference](https://directorateofhighereducation.assam.gov.in/portlets/scholarships) | Scholarship information readable; current application window and submission not verified. |

The Chhattisgarh portal was readable in the earlier review on 9 October, but subsequent fetches failed. This is recorded as intermittent access, not current confirmed availability. Bihar’s listing records the published window ending 30 September 2026; an extension has not been verified. Other application windows remain unknown unless a specific current notification is reviewed.

## Reliability fixes

| Confirmed issue | Implemented behaviour |
|---|---|
| Voice startup failure left the app recording internally | Resets session/UI and permits a new attempt |
| Network errors restarted recognition indefinitely | Explicit error handling; three bounded restarts for normal pauses, no automatic restart on network/permission/language failures |
| Language changed during recognition but translation used the old locale | One fixed locale per session; language controls disabled during recording/processing |
| Failed translation silently returned untranslated input | Explicit failure, retained transcript and manual-entry fallback; bounded requests |
| A silent recording could parse old textarea content | Only the current speech session is submitted |
| Voice completion could translate the same transcript twice | One translation step followed by awaited parsing |
| Negation and corrected income were misread | Explicit negative flags and latest-income corrections tested in frontend/backend; uncertain ranges stay blank |
| English with ₹ required translation unnecessarily | Currency/punctuation alone does not trigger translation |
| Ambiguous updated income retained old profile data | Clears the income bracket and persists the cleared field |
| Clearing all fields could retain old saved values | Saves cleared values as well as populated ones |
| Student course words inferred a parent occupation | Requires a parent mention before extracting parent occupation |
| Ordinary “as”, “up” and “it” inferred state/stream | Removes those ambiguous aliases |
| Missing income passed bracket checks via index -1 | Missing/invalid income and invalid limits return false in helper copies |
| Missing state passed the TN domicile gate | Requires confirmation instead of treating unknown domicile as a match |
| Special eligibility fields were dropped by account schema | Schema retains disability, firstGrad, parentDisabled and parentOcc; frontend sync includes them |
| Microphone denied by deployment configuration | Same-origin microphone permitted; browser still requires user permission |
| Chat document questions were swallowed by scheme routing | Income-document intent precedes generic scheme intent |
| General NSP information forced eligibility onboarding | Information questions return portal information without requiring a profile |
| State listings could be mistaken for verified eligibility or registration | Pending-rule label, precise access note, unknown/closed window and official-information links |

## Verification performed

Step 1 regression result: **70 tests passed, zero failed**. The current conditional-question regression result is recorded below. The headless Chrome check completed all 15 state filters and the simulated speech-to-profile-to-matching flow with zero page errors and no document overflow at a 390px viewport.

Automated regression tests cover the real frontend source in jsdom, backend parsing, translation errors, account schema fields, all 15 catalogue filters, repeat-load deduplication, HTML/link safety and Express HTTP catalogue/matching routes. A stale database read was simulated; real MongoDB account persistence was not tested.

A headless Chrome check loads all actual page scripts and the Express app locally. It verifies the 15 state filters, Bihar’s closed-window message, speech-event-to-profile integration with simulated recognizer events, a matching request, and desktop/mobile layouts. Speech events are simulated; this is not a microphone/transcription-accuracy test. External requests are blocked in this browser check, so it also does not validate third-party service uptime or official portal submissions.

The existing eleven options are English, Tamil, Hindi, Telugu, Marathi, Kannada, Malayalam, Bengali, Gujarati, Punjabi and Urdu. Real speech-service availability and accuracy must be tested for each locale on the supported browsers. No all-language support claim is justified.

Screenshots from the local browser check: `/private/tmp/schemematch-15-states-desktop.png` and `/private/tmp/schemematch-15-states-mobile.png`.

## Remaining issues after the conditional-question implementation

| Remaining issue | Next implementation to review |
|---|---|
| Full current-cycle rules not yet validated for new listings | Read each programme guideline/GO and prepare a field-by-field evidence table before enabling matching |
| Broad income brackets cannot represent every exact threshold | Exact annual rupees now resolve ambiguous ranges in the reviewed checks; income-period rules and integration into legacy programme thresholds remain pending |
| State residence, study location and certified domicile are conflated | Reviewed checks now ask declared official domicile separately; certificate verification and institution-state rules remain pending |
| Course/institution/attendance/percentile requirements are absent or incomplete | Add only fields required by verified rules; use eligible/ineligible/more-information-needed outcomes |
| Legacy frontend/backend catalogue rules differ | Reconcile legacy records and rule versions against official evidence after the state directory is reviewed |
| Existing generic benefit totals and compatibility assumptions need an audit | Separate cash, tuition reimbursement and conditional benefits; show unknown compatibility without a guaranteed combined total |
| Existing dates, document guides and marketing claims include unverified assumptions | Replace them only with dated, scheme-specific official facts; remove unsupported performance/accuracy claims |
| Ingestion review endpoints have no admin protection | Design restricted reviewer access and an audited manual approval process before production use |
| Automatic ingestion can promote high-confidence AI extractions | Keep proposed rule changes pending until evidence and human review are complete; never use AI confidence as verification |
| No real MongoDB/deployed microphone/real-language audio check | Test those integrations separately before production claims or deployment |

The concrete source-evidence table and proposed profile fields for the next step are in [NEXT_RULE_REVIEW.md](NEXT_RULE_REVIEW.md).

Proposed next rule-review batch: Tamil Nadu BC/MBC/DNC college assistance, West Bengal SVMCM, Gujarat BCK-6.1, Haryana SC/BC post-matric and Maharashtra post-matric programmes. No exact amounts or automatic matching will be added for that batch until the current source documents and required profile fields are reviewable.

The requested other-sector coverage remains a later batch of 10–15 schemes total, primarily agriculture, health, livelihood and social assistance. It has not been added or represented as verified in this change.

## Shared directory field structure

| Field group | Fields |
|---|---|
| Identity | id, state, name, by, department, type |
| Official evidence | source, evidenceSummary, sourceChecked, sourceVerification, verificationScope |
| Application route | applicationUrl, portal, accessNote |
| Current cycle | academicYear (nullable), status, deadline (nullable) |
| Matching controls | matchingEnabled, eligibilityVerification |
| Benefits/documents | amt (source-safe descriptive text), amtNum (0 while unreviewed), documentsNote |
| Independent usage | beneficiaryVerification (not independently verified) |

Programme identity/source verification and eligibility verification remain separate fields. The source directory is shared by frontend and backend; the legacy executable rule catalogues are not yet unified.


## Step 2 — conditional additional questions (9 October 2026)

User authorisation: ask additional applicant questions only when important for accurate matching. The existing UI and vanilla JavaScript architecture are retained. No service, language, dependency, deployment or database migration was added.

### Implemented behaviour

The shared `reviewed-conditions.js` evaluator reads source-backed necessary checks from the same state directory used by both frontend and backend. The match API exposes `reviewedConditions` separately from eligible awards and recommended totals. The browser uses the same evaluator even when the backend is unavailable. Every added record still has `matchingEnabled: false` and `eligibilityVerification: pending`.

- Only relevant state/category/education candidates can generate questions. Haryana BC is not inferred from OBC.
- Ask one unresolved check per candidate, then reassess. Known failures suppress unnecessary questions.
- Reuse valid answers, permit unknown answers, and provide an editable summary. Missing or invalid facts remain unresolved.
- Ask exact income only where a bracket straddles the published ceiling. Inclusive ₹2.5 lakh boundaries are tested. Exact income is explicitly annual rupees; no monthly amount is guessed.
- A changed income bracket clears the old exact amount; changed state clears domicile; changed course/stream clears institution, course and attendance facts. Editing the main form hides stale results. Responses arriving after profile edits are ignored.
- A stalled matching request is aborted after eight seconds so local checks remain available.
- Account sync retains the additional facts, strips unsupported/invalid additional values, and does not collect certificate identifiers or uploads. Local persistence and Mongoose schema/controller behaviour are tested; real MongoDB round trips remain untested.
- The UI distinguishes more information needed, a failed reviewed condition, meets reviewed conditions, and further source review needed. None is a final eligibility/selection guarantee.
- The browser check exposed legacy matching that promoted mandatory confirmation warnings (parent disability, parent occupation, first-graduate/disability status, exact income or institute confirmation) into fully eligible awards. A shared transitional guard now keeps these unresolved checks out of awards. Legacy rule reconciliation remains outstanding; the guard does not verify all legacy rules.
- Recommendation wording no longer guarantees that different benefit types can legally be combined. Catalogue estimates and current-rule/combination review are labelled explicitly.

### Conditional field structure

| Stored field | Type / accepted values | Asked only when |
|---|---|---|
| eligibilityDetails.domicileState | State/UT name | A reviewed residence/domicile condition needs confirmation; the browsing state is not proof |
| eligibilityDetails.annualIncomeRupees | Nonnegative integer rupees | The current bracket crosses the reviewed income ceiling |
| eligibilityDetails.institutionType | government / aided / self-financed / other | A relevant TN or Haryana institution condition is unresolved |
| eligibilityDetails.attendancePercent | 0–100, decimals permitted | Relevant Haryana checks need institution-reported attendance |
| eligibilityDetails.tnCourseRoute | general-3 / polytechnic-3 / professional-4 / other | A supported TN education level needs a published branch identified |
| eligibilityDetails.governmentQuota | Yes / No | TN four-year professional branch at a self-financing institution |
| eligibilityDetails.firstDiploma | Yes / No | TN three-year polytechnic first graduate/diploma condition |
| eligibilityDetails.matricPassed | Yes / No | Relevant Maharashtra SC check needs SSC/equivalent confirmation |
| Existing profile.firstGrad | Yes / No | TN professional first-graduate condition is unresolved |

These are self-declared facts, not independently validated certificates. Course branches inconsistent with the selected education level request review rather than a match.

### Source-backed checks and remaining evidence

| State / listing | Necessary checks implemented | Full-rule limitations / primary evidence |
|---|---|---|
| Tamil Nadu BC/MBC/DNC college | Three-year general degree: government/aided, no income or first-graduate gate. Three-year polytechnic: government/aided, income ≤₹2.5 lakh, first graduate/diploma. Four-year professional: income ≤₹2.5 lakh, first graduate, government quota when self-financed. | Only these table branches are screened. Other courses, recognition, domicile and current notification remain pending. [Department table](https://bcw.tn.gov.in/sub_page/8) |
| Maharashtra SC | Declared Maharashtra residence, income ≤₹2.5 lakh and passed SSC/equivalent; SC only in this partial screen | Navbouddha, failure history, professional-course limits, current institution/GO rules and current application availability require review. [MahaDBT scheme page](https://mahadbt.maharashtra.gov.in/SchemeData/SchemeData?str=E9DDFA703C38E51ACE99921E698B1EE85995B38445F14746E1B0DD7E66FFF88B) |
| Gujarat SC | Domicile routing, SC and department income ceiling ≤₹2.5 lakh | Linked guideline explicitly covers 2020–21 to 2025–26; 2026–27 continuation/replacement is not verified. Admission, institutions, concurrent support and renewal still require review. [Department](https://sje.gujarat.gov.in/DSCW/schemes/1521?lang=English), [linked guideline](https://sje.gujarat.gov.in/dscw/assets/downloads/gr6_dscw_sje_02092022.pdf) |
| Haryana SC/BC directory | Haryana domicile, SC or state-specific BC, income ≤₹2.5 lakh, government/aided/SFC and attendance ≥75% | This remains a directory entry, not one combined award. Separate SC/BC programme documents, attendance period, course and renewal/cycle rules need full review. [Official table](https://harchhatravratti.highereduhry.ac.in/Eligibility) |
| West Bengal | No new questions or executable checks | Older qualifying-year references and exceptions require current-cycle confirmation before requesting more applicant facts. [Official guidelines](https://svmcm.wb.gov.in/page/about.php) |

The Haryana BC document includes older income figures plus a later amendment. The live department eligibility table and appended 17 July 2020 amendment state ₹2.5 lakh. It is not correct to use the older ₹1 lakh figure without the amendment. [Linked official document](https://harchhatravratti.highereduhry.ac.in/Notices/PMS%20OBC%20Guidelines%20March2021.pdf).

### Step 2 verification

Final suite result: **88 tests passed, zero failed** (updated after the final run). Tests cover relevance, progressive questions, exact-income boundaries, negative/unknown facts, course-branch consistency, editable/cleared answers, profile-change invalidation, source/link safety, persistence sanitisation, legacy unresolved gates, timeout fallback and browser/backend parity.

The full Chrome check passed all 15 state filters and the existing simulated voice flow, then exercised actual API-backed Haryana follow-ups (domicile → institution → attendance), invalid attendance refusal, a known attendance failure, and the TN general-degree branch with the backend unavailable. Zero page errors and no 390px document overflow. Screenshots: `/private/tmp/schemematch-followups-desktop.png` and `/private/tmp/schemematch-followups-mobile.png`.

Real microphone/language accuracy, official logins/submissions, MongoDB persistence and deployment remain untested. No claim of beneficiary/public endorsement is made.
