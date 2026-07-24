> **Implementation update (July 2026):** The decisions below supersede conflicting requirements in this original brief. Eaterloop has exactly five equal members and no admin role. Members are pre-provisioned by email and authenticate with Supabase magic links. Answers stay private from everyone else until automatic publication. Each issue has one release date; writing opens 14 days beforehand, reminders go out by Resend email at seven days and one day to members not marked ready, and publication happens on the release date (normally the first Monday). The implemented lifecycle is scheduled → open → published; there is no closed or preview state.

Build a complete, functional full-stack web app for a private monthly friend-group newsletter. The concept is similar to Letterloop: once a month, members answer 6–7 questions about their lives, then the responses are compiled into a private issue that everyone can read.

This is a small personal project for one friend group, not a public SaaS product. Prioritize a working end-to-end flow, privacy, mobile responsiveness, and a warm editorial experience over excessive features.

TECH STACK

- Next.js App Router with TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase for PostgreSQL, authentication, and image storage
- Supabase email magic-link authentication
- Resend for invitation, reminder, and publication emails
- Use server actions or route handlers for mutations
- Structure the project for Vercel deployment
- Include SQL migrations and Row Level Security policies
- Use environment variables and provide an `.env.example`
- Do not use mock data as the final implementation, but include an optional seed file for development

PRODUCT MODEL

There is initially one private friend group, although the database should support multiple groups later.

Users may join only if their email has been invited. A forwarded login or invitation link must not grant an uninvited email access.

Each monthly issue moves through four states:

1. Draft: only the admin can see and edit it
2. Open: members can write and submit responses
3. Closed: responses can no longer be edited, and the admin can preview the issue
4. Published: group members can read the compiled issue in the private archive

Members must not be able to see anyone else’s answers before the issue is published.

ROLES

Admin:
- Create and edit monthly issues
- Set the title, introduction, opening date, deadline, and optional publication date
- Add, remove, and reorder 6–7 questions
- See which members have not started, started, or submitted
- Send reminder emails
- Close or reopen submissions
- Preview the compiled issue
- Manually publish the issue
- Invite, resend invitations to, and remove members
- Admin must not be able to silently edit another member’s answers

Member:
- Sign in using an email magic link
- Edit their display name and optional profile image
- Answer any number of questions
- Skip questions without being blocked
- Save answers automatically while writing
- Submit when ready
- Continue editing a submitted response until the issue closes
- Read published issues belonging to their group
- Never see participation details or other people’s drafts

CORE PAGES

1. Sign-in page

Create a welcoming, minimal sign-in page explaining:
“A private monthly letter shared between friends.”

Use email magic-link authentication. Do not include passwords or public account registration.

2. Invitation page: `/join/[token]`

- Explain who invited the user and which group they are joining
- Verify that the signed-in email matches the invited email
- Allow the user to accept the invitation
- Show a helpful error when the link is expired, invalid, or belongs to another email

3. Member home: `/home`

Show:
- Current month’s issue
- Issue status
- Submission deadline
- “4 of 7 questions answered”
- Continue writing or view submission button
- Most recent published issue
- A small archive of earlier issues
- A friendly state when there is no open issue

Do not show a social feed, likes, public activity, or who has not responded.

4. Response editor: `/issues/[issueId]/respond`

- Display one question per spacious card
- Multiline text area for each answer
- Questions are optional
- Include “Skip for now”
- Autosave approximately 800 milliseconds after typing stops
- Clearly display “Saving…”, “Saved”, and save-error states
- Preserve line breaks
- Support an optional image and caption for the monthly photo question
- Show progress such as “4 of 7 answered”
- Include a “Submit my responses” button
- Explain that responses can still be edited until the deadline
- Warn before navigating away if an unsaved change remains
- Work especially well on mobile

5. Published issue: `/issues/[issueId]`

Render the issue as a polished private digital magazine.

At the top show:
- Issue title
- Month and year
- Admin introduction
- Optional cover emoji and accent color
- A collage of submitted monthly photos

Organize the main issue by person, not by question:
- Profile image or initials
- Display name
- Each answered question and response
- Optional photo and caption
- Completely omit unanswered questions

Add a small toggle allowing members to view the issue:
- By person
- By question

Do not include likes, follower counts, engagement metrics, or public sharing.

6. Archive: `/archive`

- Show published issues in a responsive card grid
- Include month, title, cover emoji, color, and contributor count
- Allow access only to current group members
- Sort newest first

7. Settings: `/settings`

- Edit display name
- Upload/remove profile image
- Enable or disable reminder emails
- Sign out

8. Admin dashboard: `/admin`

Show:
- Current issue and its status
- Opening and closing dates
- Counts for not started, started, and submitted
- A member status table visible only to the admin
- Buttons for edit, send reminder, close, reopen, preview, and publish
- Confirmation dialogs for meaningful state changes
- Prevent publishing an issue that is still open
- If nobody submitted, warn the admin and do not publish automatically

9. Issue editor: `/admin/issues/new` and `/admin/issues/[issueId]/edit`

Fields:
- Issue title
- Short introduction
- Cover emoji
- Accent color selected from a small tasteful palette
- Opening date
- Submission deadline
- Optional planned publication date
- Six or seven questions
- Drag-and-drop question ordering
- Add and remove question controls
- Preview action

Support these question types:
- Standard text
- Photo with caption
- Next-month prediction

Seed a default set of questions:

1. What has been taking up most of your time lately?
2. What is one moment from this month you want to remember?
3. What has been on your mind?
4. What are you looking forward to next month?
5. What have you watched, read, played, or listened to recently?
6. Share a photo from your month and tell us about it.
7. If this month had a title, what would it be?

10. Admin members page: `/admin/members`

- Invite by email
- Show invited, joined, and removed states
- Resend invitations
- Remove a member with confirmation
- Display current-issue response status
- Never expose members outside the admin area

FUN EXTENSIONS TO INCLUDE

1. Monthly photo collage

Each member may upload one photo with a caption. Display submitted photos in a responsive collage at the beginning of the published issue. Use Supabase Storage and enforce private access.

2. Last-month callback

A “next-month prediction” question stores a response that can appear in the following issue’s response form:

“Last month you said: [previous response]”
“How did that go?”

The admin should be able to include or exclude this callback question in each issue.

3. Question suggestions

Members can privately suggest a wildcard question for a future issue. Create a simple form accessible from the home page. The admin can view suggestions, mark them used, and add one to an issue. Other members cannot see who suggested what.

DATABASE

Create proper migrations for approximately these tables:

- profiles
- groups
- memberships
- invitations
- issues
- questions
- submissions
- answers
- question_suggestions
- email_events

Suggested requirements:

profiles:
- id references auth.users
- display_name
- avatar_path
- reminder_emails_enabled
- created_at
- updated_at

groups:
- id
- name
- owner_id
- created_at

memberships:
- id
- group_id
- user_id
- invited_email
- role: owner or member
- status: invited, active, or removed
- joined_at
- unique membership per group and user

invitations:
- id
- group_id
- email
- token hash, not the raw token
- expires_at
- accepted_at
- created_by

issues:
- id
- group_id
- title
- introduction
- cover_emoji
- accent_color
- status: draft, open, closed, published
- opens_at
- closes_at
- planned_publish_at
- published_at
- created_at
- updated_at

questions:
- id
- issue_id
- prompt
- type: text, photo, or prediction
- position
- callback_to_question_id, nullable

submissions:
- id
- issue_id
- user_id
- status: draft or submitted
- submitted_at
- created_at
- updated_at
- unique issue and user pair

answers:
- id
- submission_id
- question_id
- body
- image_path
- image_caption
- created_at
- updated_at
- unique submission and question pair

question_suggestions:
- id
- group_id
- suggested_by
- prompt
- status: pending, used, or dismissed
- created_at

email_events:
- id
- group_id
- issue_id, nullable
- user_id, nullable
- recipient_email
- type
- provider_message_id
- status
- sent_at

SECURITY

Implement Supabase Row Level Security carefully:

- Users can read only groups where they have an active membership
- Members can update only their own profile
- Members can read only issues in their own group
- Draft issues are visible only to the owner
- Members can create and edit only their own submissions and answers
- Answers may be edited only while the issue is open
- Members cannot select another user’s answers until the issue is published
- Published answers are readable only by active members of that group
- Only the group owner can manage issues, questions, invitations, and memberships
- Photo storage must follow the same group membership and publication rules
- Removed members immediately lose access to the group and archive
- Validate authorization on the server as well as through RLS
- Never rely only on hidden client-side controls

EMAILS

Create reusable React Email templates for:

1. Group invitation
2. Issue opened
3. Submission reminder
4. Issue published

The published email should contain:
- Issue title
- Short introduction
- Contributor names
- A clear button linking to the authenticated web issue

Do not place everyone’s private answers directly into the email yet.

For development, provide a safe mode that logs the intended email rather than sending it when Resend is not configured.

DESIGN DIRECTION

Make this feel warm, intimate, nostalgic, and editorial—not like a corporate SaaS dashboard.

Visual style:
- Warm off-white paper background
- Near-black text
- Muted seasonal accent colors
- Serif display typography for issue titles
- Clean sans-serif typography for controls and body UI
- Subtle paper texture or grain using CSS only
- Generous spacing
- Thin borders
- Soft, restrained shadows
- Occasional handwritten-style accent only where legible
- Editorial layouts inspired by personal letters, small magazines, and photo journals
- Avoid excessive gradients, glassmorphism, glowing elements, and generic purple startup styling

The admin area can be more utilitarian, but it should share the same typography and color system.

Make every page responsive. The response editor and published issue should feel excellent on a phone.

QUALITY REQUIREMENTS

- Use real Supabase integration rather than only local React state
- Provide useful loading, empty, error, and success states
- Use accessible semantic HTML and keyboard-friendly controls
- Validate all inputs with Zod
- Add toast feedback for mutations
- Handle expired invitations and magic links
- Prevent duplicate submissions and duplicate memberships
- Handle image upload errors and file-size limits
- Use server-side authorization
- Use deterministic sorting for questions and contributors
- Avoid hydration errors
- Do not expose service-role credentials to the browser
- Include a concise README with setup instructions, Supabase migration steps, storage bucket setup, Resend configuration, seeding, local development, and Vercel deployment
- Include a development seed script with one owner, several sample members, one open issue, and two published issues
- Clearly mark any step that still requires manual configuration

Build the full application structure and core functionality. If an external service cannot be connected inside the preview, implement its production-ready integration and provide a realistic local fallback. Do not replace important backend functionality with decorative mockups.
