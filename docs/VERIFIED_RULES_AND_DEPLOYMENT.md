# Scholarship checks, interface fixes and deployment

Updated 10 October 2026. SchemeMatch is an independent prototype. An official source link establishes the information source; it does not establish government endorsement or approval of a student's application.

## What now works

| Feature | Implemented behavior |
|---|---|
| Catalogue | 120 official-reference listings: 77 state student programmes, 31 central scholarships and 12 other-sector schemes. Each of the approved 15 states has at least four listings; Telangana has seven. |
| Annual benefit | Seven central programme records have reviewed screening rules and annual rates. The dashboard shows a personal estimate only when the required answers pass those checks. A published rate can be displayed separately while answers are incomplete. |
| Assistant | Programme cards, eligibility questions, official links and tracking retain the existing chat layout. Reviewed checklists ask about one document at a time, with help for missing documents and a final readiness list. Identity and bank numbers are not requested or stored in the chat. |
| Match ranking | Assistant recommendations, dashboard rows, relevant scheme browsing, eligibility results and backend relevant listings share one ranking/filter. Saving a profile edit immediately refreshes personalised views. Percentage bars and the best-match badge remain; extra questions, summaries and sources are expandable below the results. Unanswered applicant details do not lower the relevance score. Full eligibility remains separate. Known incompatible conditions are excluded. |
| Landing | The rotating English headline remains. The three badges share an aligned footer inside the scholarship card and wrap on narrow screens. SchemeMatch branding is preserved during translation. |
| Schemes and deadlines | Compact actions and date tiles remain; detailed evidence is expandable. Relevant upcoming deadlines are sorted first. The alert compares published exam-registration and scholarship closing dates, expires passed dates and shows the nearest notice. GATE's extended late-fee registration closes 12 October 2026, rechecked on the official schedule on 10 October. Closed and undated windows are separate. Mobile deadline cards wrap without narrow text columns. |
| Education News | Working announcement cards with state/search filters and official links. This is a maintained snapshot of reviewed notices, not a live general news feed. Unknown publication dates are labelled. |
| Exams | 42 organiser references across the selected states and central organisers. The default shows nearest verified upcoming examinations first; undated and past references remain available in filters. |
| Account persistence | MongoDB connection, registration, login, profile reload and saved-scheme persistence passed a prior real temporary-account test; the account was removed. New regression checks cover serialised saves, delayed-account response races and pending offline edits. Account hydration clears absent optional facts and updates the filled form; Edit Profile opens that form. |
| Offline | A successful online visit caches 40 public app resources. Saved local profiles, the catalogue, local screening, document guidance and announcement cards work after network-disabled reload. Account synchronisation and government portal access require internet. |

## Reviewed programme scope

| Records | Published rate | Important conditions and limits |
|---|---|---|
| PM-USP CSSS | ₹12,000 for supported undergraduate years 1–3; ₹20,000 for supported later professional/technical years and postgraduate years | Course branch and year, income, regular recognised course, other assistance, fresh/renewal route and tenure matter. Renewal requires an earlier CSSS award and academic/attendance/conduct conditions. The current captured 2026–27 window establishes renewal only. |
| AICTE Pragati: degree and diploma | ₹50,000 per year within supported duration | Girl students; at most two girls per family; income boundary; AICTE approval; admission route, year and gap; renewal award/promotion; other-assistance exclusions. |
| AICTE Saksham: degree and diploma | ₹50,000 per year within supported duration | Recognised disability of at least 40%; income boundary; AICTE approval; admission route, year and gap; renewal award/promotion; other-assistance exclusions. |
| AICTE Swanath: degree and diploma | ₹50,000 per year within supported duration | Specified family circumstance; regular AICTE course, income, duration, other-assistance and renewal checks. The medical/accident branch added by the May 2025 guideline remains deferred to the institution for current evidence requirements. |
| Four Telangana overseas programme records | Published cap up to ₹20 lakh; not an annual award | Portal headline income, country, graduation and family conditions are checked. Full GO, age, tests, admission and selection review remains incomplete. These caps never enter annual totals. |
| Telangana post-matric | Course-specific fees and maintenance | The current ePASS registration and preparation routes are recorded. Current sanctioned fee/maintenance tables are not inferred from older notices. |

The remaining 113 records are information listings or have partial reviewed conditions. Their presence in the catalogue is not a confirmed eligibility decision. Final selection, certificate validation and payment belong to the administering authority. Potential benefits are not added together when coexistence permission is unconfirmed.

Sources checked on 9 October 2026:

- [NSP programme catalogue and application windows](https://scholarships.gov.in/All-Scholarships), [current announcements](https://scholarships.gov.in/home), and [student announcements](https://scholarships.gov.in/iver/student-announcements).
- [CSSS guideline](https://scholarships.gov.in/public/schemeGuidelines/CSSS_GUIDLINES_07022024_updated.pdf) and [FAQ linked by NSP](https://scholarships.gov.in/public/schemeGuidelines/FAQ_DOHE_CSSS.pdf). The FAQ contains 2025–26 context; its old dates are not reused as 2026–27 dates.
- [Pragati degree guideline](https://scholarships.gov.in/public/schemeGuidelines/AICTE/AICTE_2010_G.pdf), [Pragati diploma](https://scholarships.gov.in/public/schemeGuidelines/AICTE/AICTE_2011_G.pdf), [Saksham degree](https://scholarships.gov.in/public/schemeGuidelines/AICTE/AICTE_2012_G.pdf), and [Saksham diploma](https://scholarships.gov.in/public/schemeGuidelines/AICTE/AICTE_2013_G.pdf). These are July 2020 guidelines linked by current NSP. The guideline's inclusive ₹8 lakh boundary takes precedence over inconsistent wording in older FAQs.
- [Swanath degree guideline](https://scholarships.gov.in/public/schemeGuidelines/AICTE/AICTE_3039_G.pdf) and [Swanath diploma guideline](https://scholarships.gov.in/public/schemeGuidelines/AICTE/AICTE_3038_G.pdf), updated May 2025. Older linked FAQs do not cover the new medical branch.
- [Telangana ePASS registration directory](https://telanganaepass.cgg.gov.in/epassonlinelinks.jsp), [overseas programmes](https://telanganaepass.cgg.gov.in/OverseasLinks.do), and [Corporate Admissions notice](https://telanganaepass.cgg.gov.in/CorporateApplicationForm.do).

## Data structure and updates

Existing JSON records retain their IDs, programme identity, scope, official source, application URL and dates. Reviewed records additionally carry:

| Field | Purpose |
|---|---|
| `reviewedConditions` | Source/date, supported categories and courses, required checks, conditional routes and completeness flag |
| `benefit`, `benefitVerified` | Typed annual rate, course/year rule or nonannual cap, with source and check date |
| `documentChecklist`, `checklistContext` | Source-linked preparation documents and applicability conditions |
| `ruleSourceVersion` | Version context of the guideline/FAQ, separate from the date it was checked |
| `matchingEnabled` | Enables reviewed screening only; unsupported branches still fail closed |

Canonical `amtNum` remains zero. `programme-rules.js` calculates the applicable annual amount from the answers at runtime and is shared by browser and backend. A missing answer or unknown benefit stays unknown.

Displayed percentages now measure saved-profile relevance, using weighted audience compatibility and known reviewed answers. They are independent of the strict eligibility checks and do not establish an award. Missing applicant facts are excluded; known exclusions remain blocked. See [the scoring and guidance notes](PROFILE_MATCH_AND_GUIDANCE.md) for the formula and scope.

The NSP scraper refreshes public evidence. Scraping does not approve rules, change an award or automatically publish extracted facts. Imports need inspection, review of guideline versions and regeneration of the catalogue and offline cache. The student does not need to edit code or enter programme rates manually. Catalogue maintenance is separate from answering personal eligibility questions.

## Deployment: two projects selected

The selected setup is **one frontend project and one backend project**, created after reviewing these updates. Follow [the separate Vercel deployment guide](SEPARATE_VERCEL_DEPLOYMENT.md). Its frontend build generates the public API address from `SCHEMEMATCH_API_BASE`; its backend build packages the shared catalogue/rule modules. CORS permits the configured frontend origin. The existing Atlas cluster can be reused. No hosted deployment has been performed.

### Alternative combined configuration

Both frontend and backend must be hosted for the complete app. This repository already has a combined Vercel configuration:

- Repository root `vercel.json` serves `frontend/src` and routes `/api/v1/*` to `api/index.js`.
- That API entry loads Express and includes the shared rule/catalogue modules.
- The production browser uses same-origin `/api/v1`; a separate backend address is unnecessary for this setup.
- MongoDB Atlas remains the separate database service. The existing working cluster can be used; these UI/data changes do not require another cluster.

For a future deployment through the Vercel dashboard:

1. Import the project repository and keep **Root Directory** at the repository root, rather than `frontend` or `backend`.
2. Keep the root configuration's install/build/output settings. Its build verifies generated catalogue, calendar and offline assets.
3. In Vercel **Settings → Environment Variables**, add `MONGODB_URI`, a strong `JWT_SECRET`, `NODE_ENV=production`, and `ALLOWED_ORIGIN` equal to the intended HTTPS app origin. Add `OPEN_ROUTER` only if online model-assisted wording/extraction is wanted; deterministic screening remains independent of it. Keep `INGESTION_ENABLED=false` unless a separately reviewed scheduling setup is provided.
4. Enter secrets directly in the hosting settings. Local `.env` changes do not populate hosting settings. Do not put credentials in frontend JavaScript or commit them.
5. Ensure Atlas network access permits the chosen hosting runtime and the database user has the required application permissions.
6. Deploy a preview, then check the landing page, `/health`, catalogue version, registration/login/profile reload, matching parity, official links and offline reload over HTTPS. Configure the preview origin if testing cross-origin requests.
7. Publish after those hosted checks. No production deployment has been performed in this session.

[Vercel Node.js function documentation](https://vercel.com/docs/functions/runtimes/node-js) and [environment-variable documentation](https://vercel.com/docs/environment-variables) describe the hosting behavior. Background ingestion cron does not run inside the current serverless entry.

## Validation and remaining limits

- 150 automated tests passed, including income/disability boundaries, course/year rates, renewal facts, conditional documents, announcement filtering, saved-profile edits, account-load races, queued saves, pending offline edits, match percentages/ranking, isolated backend packaging, frontend build configuration, CORS, API parity and strict profile schema handling.
- Real browser checks passed for all 15 state filters, seven Telangana cards, aligned desktop badges, mobile overflow, original dashboard structure, nearest verified exams/deadlines, chat questions, document readiness and offline matching. No JavaScript errors were reported.
- Live browser Find My Schemes showed six saved-profile scores: 89%, 88%, 88%, 88%, 81% and 81%, strongest first. An unsaved state edit did not change the saved Telangana results. Green document confirmations, mobile overflow and network-disabled reload passed; the offline scores were identical, with no page errors.
- Latest browser checks changed category, course, income, gender, disability and state through actual form events. Dashboard counts/order, compact results, personalised browsing and the latest Assistant list agreed after every edit. The Edit Profile button opened the filled, unlocked form. Offline reload retained the edited values; further offline category edits changed the recommendations. Extra condition questions started collapsed below the results, and the GATE registration alert showed the nearest verified closing date. Desktop/mobile checks reported no page errors or horizontal overflow.
- Real Kannada translation passed on desktop/mobile and the saved selection reapplied after reload. This does not establish human-reviewed translation quality for every language.
- The 11 existing voice locale options passed simulated recognition-event tests. Actual microphone accuracy for each language is still untested and depends on the browser/provider.
- Remaining work includes full programme-by-programme review outside the seven enabled records, current course-specific state benefit tables, additional verified notices, an independently labelled accuracy evaluation and hosted deployment checks. No applicant portal login, submission or independent beneficiary review was performed.
