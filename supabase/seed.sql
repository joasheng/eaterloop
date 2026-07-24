-- Safe structural seed. Run scripts/bootstrap-members.mjs after reset to create
-- the five email-auth users, their profiles, memberships, and first issue.
insert into public.groups (id, name, timezone)
values ('10000000-0000-4000-8000-000000000001', 'EATING', 'America/Los_Angeles')
on conflict (id) do nothing;
