# Saved-profile matches and guidance confirmations

Updated 10 October 2026.

Every suggestion in Find My Schemes now displays a **profile match percentage**, including programmes whose full eligibility rules remain under review. Recommendations use the saved profile, not unsaved eligibility-form edits. Unknown applicant details are omitted from this relevance calculation. Known incompatible state, course, category, gender or reviewed conditions exclude a programme from recommendations.

This percentage is a deterministic recommendation heuristic. It is not supplied or endorsed by a government portal, and it does not establish eligibility, selection or payment. Source-backed programme audiences and the applicant's saved answers provide its inputs. The full eligibility engine and annual benefit calculations retain their stricter checks.

| Saved detail | Maximum weight | Relevance points |
|---|---:|---|
| State/domicile | 25 | 25 for a targeted state audience; 20 for a broad All-India programme |
| Education | 30 | 30 for a recorded course audience; 25 for an explicit school class, postgraduate level or pre/post-matric stage from the published title; 20 for a student listing without a recorded course audience |
| Category | 25 | 25 for an explicit category audience; 20 for a broad audience |
| Gender, when targeted | 5 | 5 if the saved gender matches |
| Additional saved, reviewed answers | 5 each | 5 for a passing check; unresolved manual branches receive 0; unanswered fields are excluded |

The percentage is `round(100 × relevance points / applicable maximum weight)`. A known exclusion produces 0%. There is no minimum-score clamp or random percentage. A field is counted once. Scores and the strongest-match order update when saved answers change. Broad programme metadata yields less relevance than specific audience information without inventing applicant conditions.

Guidance now confirms a ready document immediately with a green tick and **Confirmed by you**, then asks about the next document. Preparation instructions are expandable rather than a prominent redirect on every question. Official links remain available for missing-document help and the application portal at completion. The tick records the applicant's confirmation; it does not claim the document was independently checked.

Literal category names and girl-student audiences in programme titles also block incompatible saved profiles. Alternative beneficiary routes, such as EBC or PM CARES Children, are not inferred from caste alone.

Saved form edits now refresh the dashboard, results, personalised browsing and the latest Assistant match list immediately. Known conflicts are excluded in the backend response too. The results keep percentage bars and a best-match badge; extra eligibility questions, screening summaries and evidence are collapsed below the results. Profile editing opens the filled form. Account saves are serialised, and a delayed account response cannot overwrite newer local edits. Pending offline edits survive reload and are retried when connectivity returns.

The follow-up exclusion review applies the same filter to Assistant deadline queries, central/state scholarship queries, default All Schemes browsing, dashboard rows, results and benefit estimates. Zero profile matches are excluded from recommendations. An explicitly named information request may still explain an incompatible scheme, labelled **Outside your profile**. All Schemes has an unchecked **Show schemes outside my profile** option for deliberate catalogue browsing; it does not change saved profile facts. Online AI receives a separate filtered recommendation list and instructions to use only that list for personal suggestions or deadlines. Scores are never increased to hide incompatibility.

NSP application actions now put **Application login** first and **OTR registration form** second. Pragati's application is selected after NSP sign-in; a programme-specific public form cannot bypass applicant authentication. [NSP application login](https://scholarships.gov.in/ApplicationForm/) is the confirmed entry, and [NSP's student page](https://scholarships.gov.in/Students) explains OTR application login. No government applicant login or submission was performed.

Follow-up validation: **162 tests passed**. New tests cover four contrasting saved profiles across deadline lists, Assistant queries, dashboard, results and default/optional browsing; changing saved gender removes Pragati from deadlines; online AI facts contain only positive matches; incompatible annual-benefit metadata cannot become a potential estimate.

Validation: 150 automated tests passed, including six percentage badges, profile-field changes, shared ordering/counts, account-load races, queued saves, persisted offline edits, known exclusions, guidance ticks and unchanged eligibility/award gates. Desktop/mobile browser checks passed for category, education, income, gender, disability and state changes, the Edit Profile button, offline reload and the nearest deadline notice, with no page errors or horizontal overflow.
