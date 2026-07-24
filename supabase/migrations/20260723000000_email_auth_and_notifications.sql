-- Add email identities and notification preferences without breaking a still-running SMS build.
alter table public.profiles
  add column email_notifications_enabled boolean;

update public.profiles
set email_notifications_enabled = sms_notifications_enabled;

alter table public.profiles
  alter column email_notifications_enabled set default true,
  alter column email_notifications_enabled set not null;

alter table public.memberships
  add column email text;

update public.memberships as membership
set email = lower(auth_user.email)
from auth.users as auth_user
where auth_user.id = membership.user_id
  and auth_user.email is not null;

alter table public.memberships
  alter column phone_e164 drop not null;

alter table public.memberships
  add constraint memberships_email_format
  check (
    email is null or (
      email = lower(email)
      and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    )
  );

create unique index memberships_group_email_key
  on public.memberships (group_id, email)
  where email is not null;

comment on column public.memberships.phone_e164 is
  'Legacy phone identity retained only for migrations from the original SMS build.';
comment on column public.memberships.email is
  'Lowercase email used for magic-link identity and scheduled notifications.';
comment on column public.profiles.sms_notifications_enabled is
  'Legacy SMS preference retained for a safe rolling deployment.';
