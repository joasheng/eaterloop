-- Eaterloop: five equal members, private drafts, monthly publication.
create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.membership_status as enum ('active', 'removed');
create type public.issue_status as enum ('scheduled', 'open', 'published');
create type public.question_type as enum ('text', 'photo', 'prediction');
create type public.suggestion_status as enum ('pending', 'used', 'dismissed');
create type public.sms_event_type as enum ('submission_open', 'week_reminder', 'day_reminder', 'issue_release');
create type public.sms_event_status as enum ('pending', 'sent', 'failed', 'skipped');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  avatar_path text,
  sms_notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  timezone text not null default 'America/Los_Angeles',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  phone_e164 text not null check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  status public.membership_status not null default 'active',
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, user_id),
  unique (group_id, phone_e164)
);

create table public.issues (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  introduction text not null default '' check (char_length(introduction) <= 1000),
  cover_emoji text not null default '✉️' check (char_length(cover_emoji) between 1 and 12),
  accent_color text not null default '#C86B4A' check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  status public.issue_status not null default 'scheduled',
  release_at timestamptz not null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, release_at),
  constraint published_time_matches_status check (
    (status = 'published' and published_at is not null) or
    (status <> 'published' and published_at is null)
  )
);

create unique index one_open_issue_per_group on public.issues(group_id) where status = 'open';
create index issues_group_release_idx on public.issues(group_id, release_at desc);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues(id) on delete cascade,
  prompt text not null check (char_length(prompt) between 1 and 300),
  type public.question_type not null default 'text',
  position smallint not null check (position between 1 and 10),
  callback_to_question_id uuid references public.questions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (issue_id, position),
  unique (issue_id, id)
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  ready_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (issue_id, user_id)
);

create index submissions_issue_idx on public.submissions(issue_id);
create index submissions_user_idx on public.submissions(user_id);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  body text not null default '' check (char_length(body) <= 10000),
  image_path text,
  image_caption text not null default '' check (char_length(image_caption) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (submission_id, question_id)
);

create table public.question_suggestions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  suggested_by uuid not null references public.profiles(id) on delete cascade,
  prompt text not null check (char_length(prompt) between 1 and 300),
  status public.suggestion_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notification_events (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.sms_event_type not null,
  status public.sms_event_status not null default 'pending',
  provider_message_id text,
  error_message text,
  attempt_count integer not null default 0,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (issue_id, user_id, type)
);

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at before update on public.profiles for each row execute function private.touch_updated_at();
create trigger groups_touch_updated_at before update on public.groups for each row execute function private.touch_updated_at();
create trigger memberships_touch_updated_at before update on public.memberships for each row execute function private.touch_updated_at();
create trigger issues_touch_updated_at before update on public.issues for each row execute function private.touch_updated_at();
create trigger questions_touch_updated_at before update on public.questions for each row execute function private.touch_updated_at();
create trigger submissions_touch_updated_at before update on public.submissions for each row execute function private.touch_updated_at();
create trigger answers_touch_updated_at before update on public.answers for each row execute function private.touch_updated_at();
create trigger suggestions_touch_updated_at before update on public.question_suggestions for each row execute function private.touch_updated_at();
create trigger notifications_touch_updated_at before update on public.notification_events for each row execute function private.touch_updated_at();

create or replace function private.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), 'Friend'))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger auth_user_created_profile
after insert on auth.users
for each row execute function private.create_profile_for_auth_user();

create or replace function private.is_active_member(target_group uuid, target_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships
    where group_id = target_group and user_id = target_user and status = 'active'
  );
$$;

create or replace function private.shares_active_group(other_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships mine
    join public.memberships theirs on theirs.group_id = mine.group_id
    where mine.user_id = auth.uid() and mine.status = 'active'
      and theirs.user_id = other_user and theirs.status = 'active'
  );
$$;

create or replace function private.can_access_issue(target_issue uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.issues i
    where i.id = target_issue and private.is_active_member(i.group_id)
  );
$$;

create or replace function private.can_edit_issue(target_issue uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.issues i
    where i.id = target_issue and i.status = 'scheduled' and private.is_active_member(i.group_id)
  );
$$;

create or replace function private.can_write_issue(target_issue uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.issues i
    where i.id = target_issue and i.status = 'open' and now() < i.release_at
      and private.is_active_member(i.group_id)
  );
$$;

create or replace function private.issue_is_published(target_issue uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.issues i
    where i.id = target_issue and i.status = 'published' and private.is_active_member(i.group_id)
  );
$$;

create or replace function private.owns_submission(target_submission uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.submissions where id = target_submission and user_id = auth.uid());
$$;

create or replace function private.submission_issue(target_submission uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select issue_id from public.submissions where id = target_submission;
$$;

grant usage on schema private to authenticated;
grant execute on all functions in schema private to authenticated;
revoke execute on all functions in schema private from anon, public;

create or replace function private.validate_answer_issue()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  submission_issue_id uuid;
  question_issue_id uuid;
begin
  select issue_id into submission_issue_id from public.submissions where id = new.submission_id;
  select issue_id into question_issue_id from public.questions where id = new.question_id;
  if submission_issue_id is null or question_issue_id is null or submission_issue_id <> question_issue_id then
    raise exception 'Answer question and submission must belong to the same issue';
  end if;
  return new;
end;
$$;

create trigger answers_validate_issue before insert or update on public.answers for each row execute function private.validate_answer_issue();

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.memberships enable row level security;
alter table public.issues enable row level security;
alter table public.questions enable row level security;
alter table public.submissions enable row level security;
alter table public.answers enable row level security;
alter table public.question_suggestions enable row level security;
alter table public.notification_events enable row level security;

create policy "profiles visible to active group peers" on public.profiles for select to authenticated
using (id = auth.uid() or private.shares_active_group(id));
create policy "members update own profile" on public.profiles for update to authenticated
using (id = auth.uid()) with check (id = auth.uid());

create policy "active members read groups" on public.groups for select to authenticated
using (private.is_active_member(id));
create policy "active members update groups" on public.groups for update to authenticated
using (private.is_active_member(id)) with check (private.is_active_member(id));

create policy "active members read group membership" on public.memberships for select to authenticated
using (private.is_active_member(group_id));
create policy "active members add membership" on public.memberships for insert to authenticated
with check (private.is_active_member(group_id));
create policy "active members update membership" on public.memberships for update to authenticated
using (private.is_active_member(group_id)) with check (private.is_active_member(group_id));

create policy "active members read issues" on public.issues for select to authenticated
using (private.is_active_member(group_id));
create policy "active members create issues" on public.issues for insert to authenticated
with check (private.is_active_member(group_id));
create policy "active members update issues" on public.issues for update to authenticated
using (private.is_active_member(group_id)) with check (private.is_active_member(group_id));

create policy "active members read questions" on public.questions for select to authenticated
using (private.can_access_issue(issue_id));
create policy "members add scheduled questions" on public.questions for insert to authenticated
with check (private.can_edit_issue(issue_id));
create policy "members update scheduled questions" on public.questions for update to authenticated
using (private.can_edit_issue(issue_id)) with check (private.can_edit_issue(issue_id));
create policy "members delete scheduled questions" on public.questions for delete to authenticated
using (private.can_edit_issue(issue_id));

create policy "own or published submissions are readable" on public.submissions for select to authenticated
using (user_id = auth.uid() or private.issue_is_published(issue_id));
create policy "members create own open submission" on public.submissions for insert to authenticated
with check (user_id = auth.uid() and private.can_write_issue(issue_id));
create policy "members update own open submission" on public.submissions for update to authenticated
using (user_id = auth.uid() and private.can_write_issue(issue_id))
with check (user_id = auth.uid() and private.can_write_issue(issue_id));

create policy "own or published answers are readable" on public.answers for select to authenticated
using (private.owns_submission(submission_id) or private.issue_is_published(private.submission_issue(submission_id)));
create policy "members add own open answers" on public.answers for insert to authenticated
with check (private.owns_submission(submission_id) and private.can_write_issue(private.submission_issue(submission_id)));
create policy "members update own open answers" on public.answers for update to authenticated
using (private.owns_submission(submission_id) and private.can_write_issue(private.submission_issue(submission_id)))
with check (private.owns_submission(submission_id) and private.can_write_issue(private.submission_issue(submission_id)));
create policy "members delete own open answers" on public.answers for delete to authenticated
using (private.owns_submission(submission_id) and private.can_write_issue(private.submission_issue(submission_id)));

create policy "group reads suggestions" on public.question_suggestions for select to authenticated
using (private.is_active_member(group_id));
create policy "members suggest questions" on public.question_suggestions for insert to authenticated
with check (suggested_by = auth.uid() and private.is_active_member(group_id));
create policy "group updates suggestions" on public.question_suggestions for update to authenticated
using (private.is_active_member(group_id)) with check (private.is_active_member(group_id));

-- Notification rows contain provider details and are intentionally service-role only.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('issue-photos', 'issue-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "members upload own avatar" on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "group peers read avatars" on storage.objects for select to authenticated
using (
  bucket_id = 'avatars' and
  ((storage.foldername(name))[1] = auth.uid()::text or private.shares_active_group(((storage.foldername(name))[1])::uuid))
);
create policy "members update own avatar" on storage.objects for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "members delete own avatar" on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "members upload own issue photo" on storage.objects for insert to authenticated
with check (
  bucket_id = 'issue-photos' and
  (storage.foldername(name))[2] = auth.uid()::text and
  private.can_write_issue(((storage.foldername(name))[1])::uuid)
);
create policy "own or published issue photos readable" on storage.objects for select to authenticated
using (
  bucket_id = 'issue-photos' and
  (
    (storage.foldername(name))[2] = auth.uid()::text or
    private.issue_is_published(((storage.foldername(name))[1])::uuid)
  )
);
create policy "members update own issue photo" on storage.objects for update to authenticated
using (
  bucket_id = 'issue-photos' and (storage.foldername(name))[2] = auth.uid()::text and
  private.can_write_issue(((storage.foldername(name))[1])::uuid)
)
with check (
  bucket_id = 'issue-photos' and (storage.foldername(name))[2] = auth.uid()::text and
  private.can_write_issue(((storage.foldername(name))[1])::uuid)
);
create policy "members delete own issue photo" on storage.objects for delete to authenticated
using (
  bucket_id = 'issue-photos' and (storage.foldername(name))[2] = auth.uid()::text and
  private.can_write_issue(((storage.foldername(name))[1])::uuid)
);
