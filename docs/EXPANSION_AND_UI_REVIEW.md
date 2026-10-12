> Update 10 October 2026: [Verified rules and deployment](VERIFIED_RULES_AND_DEPLOYMENT.md) records the latest annual rates, document guidance, working MongoDB connection and final validation. Earlier pending-status notes below describe the previous review stage.

# SchemeMatch expansion and interface review

Checked 9 October 2026 against official public references. This documents the implemented change, including its limits.

## Programme coverage

| State | Student listings |
|---|---:|
| Tamil Nadu | 4 |
| Maharashtra | 5 |
| West Bengal | 7 |
| Rajasthan | 4 |
| Gujarat | 4 |
| Odisha | 4 |
| Kerala | 4 |
| Telangana | 7 |
| Andhra Pradesh | 4 |
| Bihar | 4 |
| Haryana | 4 |
| Jharkhand | 4 |
| Chhattisgarh | 7 |
| Uttar Pradesh | 4 |
| Assam | 11 |
| **State student total** | **77** |
| **Central student total** | **31** |
| **Other sectors** | **12** |
| **Active directory total** | **120** |

These are official-reference listings, not 120 open applications or confirmed awards. Some state sources describe older cycles; those cards explicitly leave the current application window unconfirmed. Scholarship, fee assistance, education loan, incentive and coaching listings retain their distinct types.

Telangana includes post-matric assistance, pre-matric assistance, separate SC/ST/minority/BC-EBC overseas programmes and corporate junior-college admissions. [Telangana ePASS](https://telanganaepass.cgg.gov.in/) and its [overseas programme page](https://telanganaepass.cgg.gov.in/OverseasLinks.do) are the source routes. BC/EBC's published 15 October 2026 deadline is stored; other programmes retain closed or unconfirmed status as observed. Applicant login, submission and public endorsement have not been tested.

## JSON structure used in the frontend

The import uses the existing flat record format. Main field groups:

| Purpose | Fields |
|---|---|
| Identity and display | `id`, `name`, `publishedName`, `state`, `by`, `department`, `sector`, `type`, `col`, `ico`, `tags` |
| Benefit | `amt`, `amtNum:0` until award rates are reviewed |
| Evidence | `source`, `sourceChecked`, `sourceVerification`, `verificationScope`, `evidenceSummary`, `guidelineUrl`, `faqUrl`, `nspId`, `nspClassification` |
| Application | `portal`, `applicationUrl`, `academicYear`, `applicationRoute`, `opensOn`, `deadline`, `deadlineVerified`, `deadlineSource`, `deadlineChecked`, `status` |
| Separate officer dates | `verificationWindows` containing a published label and date |
| Decision boundaries | `matchingEnabled:false`, `eligibilityVerification:pending`, optional `audience`/`reviewedConditions` |
| Portal/user evidence | `accessNote`, `beneficiaryVerification:not-independently-verified`, `documentsNote` |

The public [NSP All Scholarships catalogue](https://scholarships.gov.in/All-Scholarships) yielded 176 distinct records. The evidence snapshot includes every public classification and advertised state/UT filter: 28 fetched pages, no failed filters. The active import retains the approved 15-state scope, merges existing central aliases and avoids overlapping state umbrella records. It stores PDF links rather than claiming that all linked guidelines have been read. The importer requires a complete snapshot. It does not visit applicant accounts, bypass CAPTCHA or submit applications.

## Interface fixes

SchemeMatch branding remains unchanged by machine translation. A single language selector moves into the active header and participates in its layout. The Google callback is registered before loading the provider, saved language selections are reapplied, retries are bounded and stale selections cannot overwrite a newer request. Confirmation requires translated heading text; provider-option acceptance alone is insufficient. Failure is shown visibly. The hero restores the original rotating scholarship/future/path/potential text and gradient styling, with fluid card heights, wrapping actions and Indic-script line spacing. English word cycling pauses for translated pages. The old eligibility percentage is replaced by elapsed time in the published renewal window; CSSS's published course/year rate range replaces the demo award. Floating badges align at the card edges, becoming normal grid items on narrow screens. Landing scroll space adjusts to the header height.

The language selector remains English plus ten Indian languages. Page translation and voice recognition are separate. Actual recognition accuracy for all 11 options still requires microphone samples; browser locale support alone is not evidence of accuracy.

## Exam calendar

42 organiser references cover central/national examinations and every approved state. Filters select state, entrance/recruitment type, upcoming/unconfirmed/past status and search terms. Published UPSC and GATE 2027 dates receive date-based countdowns; 2026 TANCET/CEETA dates appear in the past filter. Other next-cycle dates stay unconfirmed. Scholarship deadlines are in the separate Deadlines panel. Telangana PGECET, EdCET and PECET counselling references do not turn reporting dates into exam dates. Some government portals timed out or rejected public fetching; access notes distinguish that from official source identity.

Calendar academic-host exceptions are exact reviewed organiser hosts, not a wildcard for all educational domains. [UPSC's published 2027 calendar](https://www.upsc.gov.in/sites/default/files/Calendar-Year-2027-Engl-200526.pdf), [GATE 2027 important dates](https://gate2027.iitm.ac.in/important_dates) and [Anna University's 2026 schedule](https://tancet.annauniv.edu/tancet/sdt.html) support the dated entries. Organisers may revise schedules.

## Validation and remaining dependencies

122 automated tests pass. They include NSP parsing, renewal/unknown/closed windows, duplicate-free JSON bundles, unsafe URLs, all-state minimum coverage, saved language selections, delayed language options, provider failures, Indian midnight, multiple exam days, past dates, filters and restored Assistant interactions. Headless checks cover all 15 scholarship and calendar state filters, 31 central scholarship cards, 12 other-sector cards, conditional follow-ups with a backend outage and mobile overflow. Additional checks cover the restored dashboard rows, animated headline, aligned badges, guided preparation, tracker actions, profile changes and a complete offline reload with cached public assets. See [UI restoration and offline validation](UI_RESTORATION_AND_OFFLINE.md).

A separate live provider check successfully translated the Kannada landing page on desktop/mobile, preserved branding and restored the selection after reload. Other live attempts failed or timed out. This demonstrates a successful sample and visible failure handling, not guaranteed provider availability or human-reviewed translation quality.

The restarted API serves 120 records with the current content hash. MongoDB remains unavailable; account saving and persisted review operations need valid credentials configured locally with `npm run db:configure`. Full current eligibility rules and amounts remain pending review, so an official reference never becomes a fabricated eligible match. No production deployment was performed.
