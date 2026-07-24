import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

async function loadLocalEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      const contents = await readFile(new URL(`../${file}`, import.meta.url), "utf8");
      for (const line of contents.split(/\r?\n/)) {
        const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
        if (!match || process.env[match[1]]) continue;
        process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
      }
    } catch {}
  }
}

function profileFromMembership(membership) {
  return Array.isArray(membership.profile) ? membership.profile[0] : membership.profile;
}

await loadLocalEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const emails = (process.env.MEMBER_EMAILS ?? "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
const names = (process.env.MEMBER_NAMES ?? "").split(",").map((value) => value.trim()).filter(Boolean);

if (!url || !serviceKey) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
if (emails.length !== 5 || names.length !== 5) {
  throw new Error("MEMBER_EMAILS and MEMBER_NAMES must each contain exactly five comma-separated values.");
}
if (new Set(emails).size !== emails.length || emails.some((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
  throw new Error("MEMBER_EMAILS must contain five unique, valid email addresses.");
}

async function authAdminRequest(path, { method = "GET", body } = {}) {
  const response = await fetch(`${url}/auth/v1/admin${path}`, {
    method,
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.message || payload.msg || payload.error_description || payload.error || `HTTP ${response.status}`;
    throw new Error(`Supabase Auth Admin ${method} ${path} failed: ${message}`);
  }
  return payload;
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  global: { fetch },
  realtime: { transport: WebSocket },
});
const groupName = process.env.GROUP_NAME || "EATING";
const timezone = process.env.GROUP_TIMEZONE || "America/Los_Angeles";

let { data: group } = await supabase.from("groups").select("id").eq("name", groupName).limit(1).maybeSingle();
if (!group) {
  const created = await supabase.from("groups").insert({ name: groupName, timezone }).select("id").single();
  if (created.error) throw created.error;
  group = created.data;
}

const [existingUserData, existingMemberships] = await Promise.all([
  authAdminRequest("/users?page=1&per_page=1000"),
  supabase
    .from("memberships")
    .select("user_id,profile:profiles!memberships_user_id_fkey(display_name)")
    .eq("group_id", group.id)
    .eq("status", "active"),
]);
if (existingMemberships.error) throw existingMemberships.error;
const existingUsers = existingUserData.users ?? [];

const intendedNames = new Set(names.map((name) => name.toLowerCase()));
const unexpectedExistingNames = (existingMemberships.data ?? [])
  .map((membership) => profileFromMembership(membership)?.display_name?.trim())
  .filter(Boolean)
  .filter((name) => !intendedNames.has(name.toLowerCase()));
if (unexpectedExistingNames.length > 0) {
  throw new Error(
    `The group already contains unexpected members: ${unexpectedExistingNames.join(", ")}. Resolve them before bootstrapping.`,
  );
}

for (let index = 0; index < emails.length; index += 1) {
  const email = emails[index];
  const name = names[index];
  const membershipByName = (existingMemberships.data ?? []).find((membership) => {
    const profile = profileFromMembership(membership);
    return profile?.display_name?.trim().toLowerCase() === name.toLowerCase();
  });
  const userByEmail = existingUsers.find((item) => item.email?.toLowerCase() === email);
  let user = membershipByName
    ? existingUsers.find((item) => item.id === membershipByName.user_id)
    : userByEmail;

  if (user && user.email?.toLowerCase() !== email) {
    user = await authAdminRequest(`/users/${user.id}`, {
      method: "PUT",
      body: {
        email,
        email_confirm: true,
        user_metadata: { ...user.user_metadata, display_name: name },
      },
    });
  }
  if (!user) {
    user = await authAdminRequest("/users", {
      method: "POST",
      body: {
        email,
        email_confirm: true,
        user_metadata: { display_name: name },
      },
    });
  }
  if (!user) throw new Error(`Could not create ${email}`);

  const profile = await supabase.from("profiles").upsert({ id: user.id, display_name: name }, { onConflict: "id" });
  if (profile.error) throw profile.error;
  const membership = await supabase.from("memberships").upsert(
    { group_id: group.id, user_id: user.id, email, status: "active" },
    { onConflict: "group_id,user_id" },
  );
  if (membership.error) throw membership.error;
  process.stdout.write(`✓ ${name} (${email})\n`);
}

process.stdout.write(`\nBootstrapped five email members into ${groupName}. Public signup should remain disabled.\n`);
