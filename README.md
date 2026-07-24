# Eaterloop

A private monthly letter for five friends. Everyone has equal permissions, responses stay private until release, and a daily scheduler opens each issue two weeks before release, sends email reminders, and publishes it automatically.

## What is implemented

- Next.js 16 App Router, TypeScript, Tailwind CSS 4, and a responsive editorial UI
- Supabase email magic-link authentication with public signup disabled
- Five-member email bootstrap script; no admin role or invitation flow
- Scheduled → open → published lifecycle using one `release_at` value
- Autosaved optional answers, an editable “ready” marker, and unload protection
- Private Supabase Storage for avatars and monthly photos
- Published issues arranged by person or by question
- Automatic last-month callback for prediction questions
- Shared issue composer available to every active member
- Archive and member settings
- Resend email notifications with a safe log-only development mode
- Idempotent daily Vercel cron processing for:
  - submissions opening 14 days before release
  - seven-day reminders for members not marked ready
  - one-day reminders for members not marked ready
  - issue publication and release emails
- SQL migrations with RLS enforcing private pre-release answers
- A no-credentials preview mode for local UI development

## Local preview

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and choose **Enter the preview**. Run checks with:

```bash
npm run typecheck
npm run lint
npm run build
```

Node 22 or newer is required by the current Supabase JavaScript packages.

## Apply the email migration

The first database migration used phone identities. If it has already been pushed, apply the forward migration that adds member emails and a separate email notification preference:

```bash
npx supabase db push
```

The migration retains old phone fields and preferences as legacy data, so it can be deployed before the new application without breaking a still-running phone build. Existing user IDs, profiles, answers, and uploaded files are preserved.

## Environment

Copy `.env.example` to `.env.local` and set:

```text
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
RESEND_FROM_EMAIL
EMAIL_MODE
CRON_SECRET
GROUP_NAME
GROUP_TIMEZONE
MEMBER_EMAILS
MEMBER_NAMES
```

Keep `.env.local` private. The Supabase secret key and Resend API key must never use a `NEXT_PUBLIC_` prefix.

## Supabase magic-link setup

1. In **Authentication → Sign In / Providers**, enable Email and disable Phone. Keep new-user signup disabled; members are provisioned by the bootstrap script.
2. In **Authentication → URL Configuration**, set the production Site URL.
3. Add the following redirect URL, replacing the hostname:

   ```text
   https://your-domain.example/auth/callback
   ```

   Add localhost and any Vercel preview callback URLs that you plan to use.
4. The default Supabase Magic Link template works with `/auth/callback`. For a link that can be opened in a different browser from the one that requested it, use this Magic Link template URL:

   ```html
   <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/home">Open Eaterloop</a>
   ```

5. Configure custom SMTP with Resend as described below. Supabase’s built-in SMTP is intended only for limited testing and does not deliver to arbitrary addresses.

The client calls `signInWithOtp` with `shouldCreateUser: false`, so knowing an email address cannot create a new account.

## Resend setup

The same Resend account can deliver Supabase Auth links over SMTP and application notifications over the Resend API.

1. In Resend, add and verify a sending domain.
2. Create an API key for application notifications and set:

   ```text
   RESEND_API_KEY=re_...
   RESEND_FROM_EMAIL=Eaterloop <letters@your-verified-domain.example>
   EMAIL_MODE=log
   ```

3. In **Supabase → Authentication → Email → SMTP Settings**, enable custom SMTP and enter:

   ```text
   Host: smtp.resend.com
   Port: 465
   Username: resend
   Password: a Resend API key
   Sender email: an address on the verified domain
   Sender name: Eaterloop
   ```

4. Disable Resend click tracking for the auth sending domain so magic links are not rewritten.
5. Leave `EMAIL_MODE=log` while testing the scheduler. Change it to `EMAIL_MODE=send` locally and in Vercel when the sender is verified.

Notification emails contain links, never private answers. Members can disable notifications from Settings. `notification_events` records provider acceptance and prevents duplicate sends; delivery webhooks are not currently tracked.

## Bootstrap the five members

Set exactly five comma-separated addresses and matching names in `.env.local`:

```text
MEMBER_EMAILS=one@example.com,two@example.com,three@example.com,four@example.com,five@example.com
MEMBER_NAMES=One,Two,Three,Four,Five
```

Then run:

```bash
npm run bootstrap:members
```

The script creates or reuses five confirmed Supabase Auth email users, profiles, and active memberships. If the old phone bootstrap was already run, it matches existing members by display name and changes those Auth users to the corresponding email, preserving their IDs and data. The script is safe to rerun.

For fully local Supabase development, Docker must be running:

```bash
npx supabase start
npx supabase db reset
npm run bootstrap:members
```

Local Auth emails are captured by the Supabase Mailpit/Inbucket service instead of being sent externally.

## Vercel deployment

1. Import `https://github.com/joasheng/eaterloop` into Vercel.
2. Add all values from `.env.example` to Development, Preview, and Production.
3. Generate a random `CRON_SECRET` of at least 16 characters.
4. Set `NEXT_PUBLIC_SITE_URL` to the production HTTPS origin.
5. Deploy. `vercel.json` installs a daily cron at 17:00 UTC; the handler evaluates each group’s local calendar date.

Vercel sends `Authorization: Bearer $CRON_SECRET` to the cron route. The service-role configuration is also required for the scheduler.

## Release behavior

- A scheduled issue becomes open when its local release date is 14 or fewer calendar days away.
- Members may edit until `release_at`, even after marking ready.
- “Ready” suppresses seven-day and one-day reminder emails.
- On release day, the scheduler marks the issue published before sending release emails.
- Only non-empty answers appear in the published issue.
- RLS prevents members from selecting another person’s submission or answer before publication.
- Notification uniqueness is enforced by `(issue_id, user_id, type)`.

## Remaining account-level work

- Push the email migration to the linked Supabase project
- Enable Supabase Email Auth and configure callback URLs
- Verify a Resend domain and connect its SMTP credentials to Supabase
- Put the five real emails in `.env.local` and rerun the bootstrap
- Add Resend and Supabase secrets to Vercel
- Run live magic-link, RLS, Storage, cron, and notification tests
