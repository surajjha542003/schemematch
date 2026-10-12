# Proposal email implementation and verification

The frontend and backend code are deployed independently:

- Frontend: https://schemematch-rosy.vercel.app — `dpl_8Y2b1q1uTSRwQQxoKgv3SumX7Rcb`
- Backend: https://schemematch-api.vercel.app — `dpl_FQRzNF722Pggb4DnKJwC5pJcb1dv`

Validation:

- Full regression suite: **177 passed**, including profile-dependent proposal ranking, zero-match exclusion, recipient isolation, HTML escaping, duplicate/cooldown/daily guards, concurrent claims, SMTP rejection and profile-save failure handling.
- Live public API and frontend assets match the working source. All three email endpoints reject unauthenticated requests with HTTP 401.
- All 120 application routes retain frontend/backend parity; changing gender adds/removes Pragati as expected.
- Live headless-browser check, with a mock account and mocked email responses: six preview cards, disabled send button when SMTP is unconfigured, checked account preference, no mobile overflow, no page errors, and the new email script available from the offline cache. No real account was modified and no email was sent during this browser check.
- Database setup regression tests and focused email tests passed after adding the private Gmail setup command.

**Live SMTP sending verified:** after the owner completed the private Gmail setup, authentication succeeded. Six SMTP settings were uploaded as secrets to the backend Production environment, then the backend was redeployed. An authenticated live preview returned a complete profile and six positive matches with SMTP configured. The owner's automatic-email preference was enabled, and saving the existing profile triggered a six-scheme proposal accepted by Gmail (`state: sent`). An immediate repeat automatic request returned `state: unchanged`, confirming durable duplicate suppression. Existing saved profile facts were preserved.

The code deployments exclude local `.env` files. Passwords and tokens were not displayed. Gmail acceptance verifies sending; actual arrival in Inbox or Spam remains for the recipient to confirm.

See [SMTP setup](../SMTP_PROPOSAL_EMAILS.md) for the hidden-input command, secure Vercel configuration command and account preference.
