# Interface restoration and offline validation

Implemented and checked on 9 October 2026 in response to the request to preserve the original interface while updating the programme data.

## Restored interface

- Landing: original “Find your … the smart way” headline, rotating scholarship/future/path/potential words and gradient colours. The animation pauses on translated pages and respects reduced motion. The three badges share an aligned footer inside the card and wrap on narrow screens.
- Spotlight: the original large amount and progress presentation now uses the [official CSSS guideline](https://scholarships.gov.in/public/schemeGuidelines/CSSS_GUIDLINES_07022024_updated.pdf) rate range of ₹12,000–₹20,000 by course/year and elapsed time in the published renewal window. Neither is a personal eligibility score or confirmed award. Explore Scholarship opens its working Assistant card.
- Dashboard: original compact statistics, day/month deadline tiles and clickable top-match rows restored. Counts use the current directory and calendar. Reviewed rates and completed screening answers now fill annual estimates; unknown benefits retain a compact dash and a Check eligibility action. The giant Unconfirmed and NTA substitutions are removed.
- Assistant: original chat layout, programme cards, official portal buttons, guided preparation, tracking, certificate help and profile-based queries restored. The catalogue handler no longer intercepts every request with a generic list. Named programme, girl-student, category, NSP post-matric and deadline queries select relevant references. UGC JRF uses the shared exam reference; PMRF links the Ministry reference with its historical scope stated.
- What-if changes remain simulations until applied. Applying income, education or state changes invalidates affected follow-up answers and synchronises the saved form. New self-descriptions update existing fields before subsequent queries.

The 120-record directory, 15-state coverage, seven Telangana listings, 42 exam references and source restrictions remain intact. Full eligibility remains pending for unreviewed programmes; restoring the layout does not restore fabricated award totals, scores or expired countdowns.

## Offline support

`offline.js` installs a versioned service worker. After one successful online visit, it caches 40 public HTML/CSS/JavaScript/JSON resources. Offline navigation falls back to the cached app shell. Same-origin known assets are served from the public cache. API, account and profile responses, external services and non-GET requests are excluded. Locally entered profiles and tracker entries continue to use existing local storage rather than the public cache.

Offline reload, all 15 state lists, all 42 exam references, deterministic Assistant replies, guided preparation, saved profile/tracker restoration and progressive local condition checks passed in a browser with network access disabled. First-time access without a previous successful cache installation requires internet. HTTPS or localhost is required for service workers.

External portal pages and government submissions, machine translation, network-backed speech recognition, model-generated answers and account synchronisation need their respective online services. MongoDB persistence passed a separate real account test after the credentials were repaired; offline testing alone does not validate it. Microphone accuracy has not been tested.

After any public frontend or JSON/bundle change, regenerate and verify the offline shell:

```sh
npm run catalog:build   # when scheme JSON changes
npm run exams:build     # when exam JSON changes
npm run offline:build
npm run offline:check
```

The root deployment build rejects a stale offline shell. Existing service-worker clients refresh once when an updated worker takes control. The local frontend serves the restored files without needing an API restart.

## Validation evidence

- 131 automated tests passed, including source-backed annual rates, renewal boundaries, documents and Education News filtering.
- Real browser checks passed with no JavaScript errors or desktop/mobile horizontal overflow.
- Real Kannada provider translation succeeded on the restored landing page, kept SchemeMatch branding, and reapplied the saved language after reload. This is one successful provider sample, not human-reviewed language quality or a guarantee for every language.
- Browser offline checks passed after disabling the network and reloading the page. Public cache inspection found 40 app resources and no API/account/profile responses.
- The running `localhost:3000` page was checked against the restored HTML. No production deployment was performed.

Useful official references: [UGC NET information bulletins](https://ugcnet.nta.nic.in/information-bulletin/) and the [Ministry of Education PMRF reference](https://www.education.gov.in/revised-guidelines-prime-ministers-research-fellows-pmrf-scheme). Current PMRF calls are not inferred from the historical Ministry document.

The source-reviewed rule and document implementation, MongoDB retest and combined deployment instructions are recorded in [Verified rules and deployment](VERIFIED_RULES_AND_DEPLOYMENT.md), updated 10 October 2026.
