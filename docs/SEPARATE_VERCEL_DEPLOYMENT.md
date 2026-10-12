# Deploy SchemeMatch as two Vercel projects

Deployed and checked 10 October 2026 in the Vercel account **arya119**, team **arya119s-projects**. The updated working code is live in two independent projects:

| Project | Production address | Vercel settings |
|---|---|---|
| Frontend: `schemematch` | https://schemematch-rosy.vercel.app | https://vercel.com/arya119s-projects/schemematch |
| Backend: `schemematch-api` | https://schemematch-api.vercel.app | https://vercel.com/arya119s-projects/schemematch-api |

These are CLI deployments of the current local code. Git push automation has not been connected. The Vercel plugin was suggested; deployment used the already authenticated Vercel CLI.

### Deploy future updates to the same projects

From this repository, with the Vercel CLI signed in to the same account, run `npm run deploy:backend` and then `npm run deploy:frontend`. The scripts create allowlisted upload folders, keep local `.env` files and reports out, and select each project's own configuration explicitly. They use the saved project identities in `docs/vercel-projects.json`; this file contains public project metadata and no credentials. To inspect an upload without publishing, append `-- --dry` to either command.

Do not run a bare `vercel` command from the repository root: its legacy combined configuration is for a different deployment layout. The separate deployment scripts preserve the project's configured environment values. Changes to those values require a new deployment of the affected project.

### Hosted checks completed

- Both production sites respond publicly; the browser configuration points to the backend's stable URL.
- Backend health and all **120 catalogue records** match the local catalogue version. Hosted matching agrees with the shared rules. CORS permits the exact frontend origin and denies an unlisted origin.
- Temporary account registration, login, profile edits and saved scholarships persisted through a fresh login in MongoDB Atlas. Only the temporary test account was removed afterward.
- Both hosted browser checks passed: six AI match scores **89, 88, 88, 88, 81, 81** for the test profile; category/course/income/gender/disability/state edits update the dashboard, results, browsing and assistant together; document confirmation ticks; nearest GATE deadline; mobile layout; offline reload and local edits; no page errors. These are profile relevance scores, not a promise of eligibility or funding.
- **150 regression tests passed** after compatible dependency patches; the backend installation reports **zero known npm vulnerabilities**. Node.js is pinned to **24.x** for the backend.

Online translation and actual microphone recognition were not tested with live speech during deployment. Account sync and government application portals require internet; the public catalogue and local matching work offline after a successful online visit.

### Application-form update — 10 October 2026

Redeployed the backend as `dpl_3uZXY9mELaYAvCtX9gWsJrMNL2Mn` and frontend as `dpl_J3htpz3J59pfzFdhd5oRZuq2EPX6`. Both production aliases are ready. Public HTTP verification confirms all 120 backend application actions, the frontend catalogue and action renderers, backend configuration and production offline worker match the local source. Catalogue version: `14c9c97458b5fc5b00181994d1d6e341cb3e03fa9e79a914ce7deb3ab4733b1a`.

All **156 regression tests passed**, followed by **29 targeted application/Assistant tests** after final text cleanup. There are **91 records with public form, registration, login or download routes**, **11 with institution/CSC handling**, **3 reporting closed registrations**, and **15 without a confirmed working public form**. Those unavailable records no longer render a misleading application link. See [APPLICATION_FORM_ROUTES.md](APPLICATION_FORM_ROUTES.md) and the [complete audit](evidence/application-routes.snapshot.json). Applicant authentication and external form submissions were not performed in this route audit.

### Follow-up form research and search fallback — 10 October 2026

Latest backend deployment: `dpl_F3DFZjAdBfGyauhLbw8ZuapheUQp`. Latest frontend deployment: `dpl_9pEoHqcu2h2vVMZNAwBjUJvKETTT`. Both are READY and assigned to the same separate production aliases above. Catalogue version: `90df007ca07c8a74ec513b7d2bb5ff471aad7483096f73def1218d149e8a6bc8`.

Eight of the earlier 15 unconfirmed entries now have confirmed form, registration, login or download routes. The Tamil Nadu central-institution entry additionally provides current fresh/renewal PDFs. The Jharkhand overseas entry is closed and the SC coaching entry is institutional. Current totals are **100 available routes, five unconfirmed, 11 institutional and four closed**. Unconfirmed entries have a separate **Search official application forms** action in browsing, Assistant guidance and tracked items. It uses only public scheme name/state and is not labelled as a verified form. See the [research evidence](evidence/application-form-research-2026-10-10.md).

All **158 tests passed**, and catalogue/offline generation checks passed. Public production verification checked backend health, all 120 application URLs/actions against local policy, matching catalogue versions, deployed frontend action renderers, backend API configuration and the refreshed production service worker. These checks did not log in to government sites or submit applications. Existing Atlas configuration was retained; no new MongoDB database is required for these link changes.

### Zero-match exclusion and NSP button order — 10 October 2026

Latest backend deployment: `dpl_CrYpt7Z6uRgrr9vFuULwWhpS9y1f`. Latest frontend deployment: `dpl_6bo21vPN4uQESMSrCkfaRvtd6d9K`. Both are READY on the existing production aliases. Catalogue version: `2313d4aeb450f0a48d9eeb9b4dc9d3c2f9cfa0aa42d9f00569dbba8b9a94398b`.

Assistant deadlines and general scheme queries now exclude known profile conflicts. Default catalogue browsing hides incompatible schemes, with an explicit option to include them. Dashboard/results/deadlines and potential estimates share the exclusion policy; online AI receives filtered personal recommendation facts. NSP application login is the primary action, followed by OTR registration for new applicants. Pragati's individual form requires government sign-in and scheme selection.

All **162 tests passed**. Live verification checked both catalogue versions, all 120 application actions, the new browser filters/renderers, shared profile rules, API configuration and offline worker. Two synthetic public match-API requests returned only positive profile matches: changing saved gender added/removed Pragati and a known disability conflict excluded Saksham. No account, credential or government form submission was used. Route totals remain 100 available, five unconfirmed, 11 institutional and four closed.

The frontend is the website people open. The backend handles accounts, profile saving and online services. MongoDB Atlas stores account data; the existing working cluster can be reused. Local matching and the public catalogue also work without the backend.

## Project settings

Import the same repository twice. Choose a different Root Directory for each project. The configuration files already specify the build commands.

| Setting | Backend project | Frontend project |
|---|---|---|
| Suggested project name | `schemematch-api` (if available) | `schemematch` (if available) |
| Root Directory | `backend` | `frontend` |
| Framework Preset | Other | Other |
| Build Command | `node scripts/prepare-vercel.cjs` | `node scripts/build-vercel.cjs` |
| Install Command | `npm ci && node scripts/prepare-vercel.cjs` | Use the configured static install command |
| Output Directory | `public` | `dist` |
| Include source files outside Root Directory in the Build Step | Enabled | Not required |

The backend install/build copies four public catalogue/rule modules into its function package and creates a small public API landing artifact required by the static output check. This keeps frontend and backend screening identical. Only `public` is the backend's static output; backend source files and credentials are not static assets. The frontend build writes only the public backend address into `dist/js/config.js`. A missing backend address causes the hosted frontend build to stop with an explicit message.

Vercel documents separate projects per repository directory in [Monorepos](https://vercel.com/docs/monorepos), and the source-sharing setting in its [Monorepos FAQ](https://vercel.com/docs/monorepos/monorepo-faq).

## 1. Create and test the backend

1. Review the updated website locally first. When ready to deploy, import the repository in Vercel and select Root Directory **backend**.
2. Confirm the settings in the table, including source files outside the Root Directory.
3. Add the environment variables below in this **backend** project. Enter credentials directly in Vercel settings. Local `.env` files are not uploaded as deployment settings.
4. Deploy the backend and note its stable public HTTPS address, for example `https://schemematch-api.vercel.app`.
5. Check `<backend address>/health` and `<backend address>/api/v1/schemes`. The catalogue response should contain 120 records. Those public checks do not need the database.

| Backend variable | Value |
|---|---|
| `MONGODB_URI` | Your working Atlas connection string, including the application database name |
| `JWT_SECRET` | A strong private secret of at least 32 characters |
| `NODE_ENV` | `production` |
| `ALLOWED_ORIGIN` | The exact frontend HTTPS address; set or update it in step 3 below |
| `INGESTION_ENABLED` | `false` |
| `OPEN_ROUTER` | Optional private key for online model-assisted wording/translation; local eligibility does not depend on it |
| `OPENROUTER_MODEL` | Optional model override if using OpenRouter |
| `SCHEME_REVIEWER_EMAILS` | Optional reviewer allowlist; leaving it empty disables reviewer access |

Atlas network access must permit connections from the hosting runtime. Keep database permissions appropriate to the application. A successful public health check does not prove account persistence works; registration/login testing is required after connecting both projects.

## 2. Create the frontend

1. Import the same repository again and choose Root Directory **frontend**.
2. Confirm Framework **Other**, the configured build command, and Output Directory **dist**.
3. Add `SCHEMEMATCH_API_BASE` with the backend's stable public HTTPS address from step 1. Both a bare origin and a URL ending `/api/v1` are accepted. Example: `https://schemematch-api.vercel.app`.
4. Deploy the frontend and note its stable HTTPS address.

Do not place MongoDB credentials, JWT secrets or model keys in this frontend project. The generated browser configuration is public.

## 3. Connect the two projects

1. In the **backend** project's Environment Variables, set `ALLOWED_ORIGIN` to the frontend's exact origin, for example `https://schemematch.vercel.app`. Omit a trailing slash or path.
2. Redeploy the backend to apply this setting. For a deliberate preview test, another exact preview origin can be added after a comma. Unlisted browser origins receive no CORS permission.
3. If either public address changes, update the corresponding variable and redeploy the affected project.

Environment variables are applied to new deployments; see [Vercel environment variables](https://vercel.com/docs/environment-variables). Shared catalogue files are included in the serverless API package; see [Node.js function bundling](https://vercel.com/docs/functions/runtimes/node-js).

## 4. Check the hosted app before publishing it for users

- Open the frontend, complete a profile and verify the highest match appears first. Percentages use saved details; unanswered applicant details are excluded. A known incompatible condition should not appear in recommendations. Change category, course, income, gender, disability and state, then confirm all personalised views refresh and the edited values survive reload.
- Register a test account, sign out, sign in, reload and confirm the profile and tracked scheme survive. Remove the temporary test account afterward.
- Check the 15 state filters, Telangana listings, official links, nearest exam/deadline order, document guidance and mobile card alignment.
- Visit online once, then disable network and reload. The public catalogue and local matching should work. Account synchronisation and external government portals need internet.
- Check translation and microphone input on the target browsers with network access and permissions enabled.

The checks recorded above establish the hosted routing, environment connection, Atlas access and account persistence for these production deployments. Repeat the relevant checks when changing the implementation or deployment settings.
