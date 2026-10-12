# Gmail scholarship proposal emails

The backend uses Nodemailer to email up to six open, positive-match recommendations from the signed-in account's saved profile. Changing category, gender, course, state or income changes the recommendations. Email recipients come from the authenticated account; the browser cannot choose another recipient.

## Finish Gmail setup

1. Sign in to the Gmail account used as the sender.
2. Turn on [Google 2-Step Verification](https://myaccount.google.com/security).
3. Open [Google App Passwords](https://myaccount.google.com/apppasswords), create one called **SchemeMatch**, and copy it privately.
4. Run `rtk proxy npm run mail:configure` in your own Terminal. Press Enter to keep the sender address, then paste the Google-generated App Password at the hidden prompt. It verifies Gmail before updating both private environment files. You can also edit `SMTP_PASS` in `backend/.env` directly. Use the App Password, not your normal Google password. Do not share it in chat or commit it.
5. The other keys are already set in both local environment files:

   ```dotenv
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=your-gmail-address
   SMTP_FROM=your-gmail-address
   SMTP_PASS=your-app-password
   ```

6. From the project folder, run:

   ```sh
   rtk proxy npm run mail:verify
   ```

   This tests connection and authentication without sending an email. Restart the local backend after changing its environment.

## Enable the deployed app

Local `.env` files are excluded from Vercel uploads. In Vercel, open **schemematch-api → Settings → Environment Variables**. Add the six keys above to the **Production** environment, entering the App Password privately. Redeploy the backend after saving them. SMTP keys belong in the backend project.

Alternatively, with the Vercel CLI signed in, run `rtk proxy npm run mail:configure-vercel`. This verifies SMTP first, then reads the six settings privately from `backend/.env` and uploads them as Production secrets to the existing backend project. It prints key names only. Run `rtk proxy npm run deploy:backend` afterward.

Open the app, sign in with the account that should receive the email, then open **My Profile → Email proposals** and enable **Email my scheme proposal automatically after saving my profile**. Edit and save the profile. The backend sends after saving the account data. The Dashboard's **Email proposals → Preview proposal** also lets you inspect and send the current saved-profile proposal.

The Gmail sender account and recipient account may be the same. Each user receives recommendations at their own saved login email. No new MongoDB cluster is needed: preferences and send records use the existing database.

## Behavior and limits

- Automatic sending is opt-in per account. Turn it off in My Profile.
- Unchanged profiles do not generate repeated automatic emails. Sends are limited to one per minute and ten per UTC day per account; durable MongoDB records coordinate separate Vercel instances.
- A changed profile saved during the cooldown retries while the page is open and automatic emails remain enabled. There is no background queue after the page closes.
- Saving a profile still works when SMTP is missing or unavailable. The app shows the email status separately.
- No email is sent for incomplete profiles, zero-match results or invalid account email addresses. Closed programmes and expired confirmed deadlines are excluded.
- Email contains programme names, profile relevance percentages, published benefit descriptions and the same application routes as the app. It does not contain Aadhaar numbers, bank details or raw income/category profile values.
- SMTP acceptance means the provider accepted the message; check Inbox and Spam for actual arrival. SMTP and database writes are separate operations, so delivery cannot be guaranteed exactly once after infrastructure failures.
- Offline matching still works after the app has been cached. Email and account synchronization require internet access. Pending profile edits sync when connectivity returns.

Google's [App Password instructions](https://support.google.com/mail/answer/185833) explain account requirements. Nodemailer's [SMTP documentation](https://nodemailer.com/smtp) describes transport verification and TLS settings.
