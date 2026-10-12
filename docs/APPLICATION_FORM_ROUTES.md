# Application forms — 10 October 2026

Application buttons use explicit public form, registration, applicant-login or downloadable-form routes. Programme information stays in the source details. Missing forms no longer send applicants to a default NSP page or a department homepage.

The shared route policy drives All Schemes, the Assistant, guided preparation, tracked applications and backend catalogue/AI facts. Saved tracker items resolve the current route by stable scheme ID without resetting progress. Unidentified old tracker items do not reuse unverified stored portal links.

The complete per-programme audit is [application-routes.snapshot.json](evidence/application-routes.snapshot.json). All 120 listings have an access status and explanation. The audit distinguishes available public routes from closed registrations, institution/CSC enrolment and unconfirmed forms. A source check does not prove applicant authentication or successful submission.

NSP's current OTR application mounts registration at `https://scholarships.gov.in/otrapplication/`. The entry `https://scholarships.gov.in/ApplicationForm/` loads applicant login and is now the primary button. OTR registration is the secondary button for new applicants. Individual scholarship forms, including Pragati, require applicant sign-in and scheme selection. Do not invent per-scheme query strings, copy session tokens or publish `/ApplicationForm/login` and `/otrapplication/registration-page`: those server paths returned 404 during this audit. The root entries load the supported client components.

Corrections include Telangana's fresh/renewal post-matric and category-specific overseas forms; Bihar's distinct post-matric/matric/inter forms; Gujarat's citizen registration/login; Kerala's eGrantz and published DCE forms; Jharkhand's e-Kalyan and Savitribai forms; Chhattisgarh's student and construction-worker forms; West Bengal's SVMCM and domestic/foreign credit-card registration; Haryana's student login; Rajasthan SSO; and Maharashtra's citizen authentication rather than department login. Central benefits include farmer registration, housing application, LPG provider options and bank enrolment downloads.

The follow-up research resolved eight of the previous 15 unconfirmed entries. There are now **100 records with a form, registration, applicant-login or download route**, **five unconfirmed**, **11 handled through institutions/CSC**, and **four reporting closed registrations**. See the [research evidence](evidence/application-form-research-2026-10-10.md).

| Newly confirmed programme | Application entry |
|---|---|
| Telangana pre-matric | [Fresh student form](https://tgepass.cgg.gov.in/homeServicesprematricFreshRegistration), with a separate renewal option |
| UP scholarship and fee reimbursement | [Student registration chooser](https://scholarship.up.gov.in/RegistrationNew.aspx) |
| UP Kanya Sumangala | [Citizen registration/login](https://mksy.up.gov.in/women_welfare/citizen/guest_login.php) |
| UP Sant Ravidas education assistance | [Programme application route](https://labour.upbocw.in/worker/scheme/sant-ravidas-shiksha), requiring worker sign-in |
| Chhattisgarh Gyan Protsahan | [Student application](https://schoolscholarship.cg.nic.in/CMGyaanProtsaahanRegistration.aspx) |
| Odisha Kalinga Sikhya Sathi | [State student registration](https://scholarship.odisha.gov.in/student-registration?state=1); select the interest-subsidy programme after an eligible education loan |
| Tamil Nadu BC/MBC college post-matric | [UMIS applicant login](https://umisdashboard.tnega.org/auth/login) |
| PM Mudra | [Loan application PDF](https://www.mudra.org.in/Default/DownloadFile/Common_loan_Application_form.pdf), with a separate Shishu download |

Tamil Nadu's central-institution scholarship also now offers the department's 2026–27 fresh and renewal application PDFs. Jharkhand Marang Gomke overseas applications are closed for 2026–27; the SC coaching grant route is for institutions, so neither is presented as an open student form.

The five unconfirmed entries are **Assam Combined Merit, Assam PG Research, West Bengal Hindi Scholarship, Andhra Pradesh Ambedkar Overseas Vidya Nidhi, and UP Abhyudaya**. Assam's linked AMTRON service has an expired certificate; WB's download is an old notice; a current working public form could not be confirmed for AP overseas or UP Abhyudaya. Their cards, Assistant guidance and saved tracker items offer a separately labelled **Search official application forms** button. It searches the public scheme name and state, focusing on government websites, and uses no saved profile details. A search result is not represented as a confirmed application link. Closed or institution-only schemes do not offer this fallback.

Other external limitations remain visible in card text: Haryana's new registration returns an invalid page; Kerala DCE login lists years only through 2024–25; UP student registration responded intermittently. Programme sources and preparation guidance remain available. Applicant authentication and submissions were not performed.

Maintain routes in `scripts/update-application-routes.cjs` using evidence from official pages, then run `node scripts/update-application-routes.cjs`, `npm run catalog:build` and `npm run offline:build`. Validation rejects homepages as application routes and requires access metadata and evidence. NSP import preserves explicit state overrides and supplies separate registration/login metadata.

Regression checks cover all 120 statuses, browsing/Assistant actions for every student record, guided-form completion, old tracker repair, unavailable forms, source fallback removal and approved provider paths. Offline caching includes corrected routes; external government forms require internet.
