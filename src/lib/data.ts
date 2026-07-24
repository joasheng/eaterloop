import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { demoHomeData, demoManageData, demoPublishedIssues, getDemoIssue } from "@/lib/demo-data";
import { hasSupabaseEnv, isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type {
  Answer,
  Contributor,
  HomeData,
  Issue,
  ManageData,
  Profile,
  PublishedIssue,
  Question,
  Submission,
} from "@/lib/types";
import { DEMO_USER_ID } from "@/lib/constants";

type Row = Record<string, unknown>;

function mapQuestion(row: Row): Question {
  return {
    id: String(row.id),
    issue_id: String(row.issue_id),
    prompt: String(row.prompt),
    type: row.type as Question["type"],
    position: Number(row.position),
    callback_to_question_id: row.callback_to_question_id ? String(row.callback_to_question_id) : null,
    callback_body: row.callback_body ? String(row.callback_body) : null,
  };
}

function mapAnswer(row: Row): Answer {
  return {
    id: String(row.id),
    question_id: String(row.question_id),
    body: String(row.body ?? ""),
    image_path: row.image_path ? String(row.image_path) : null,
    image_caption: String(row.image_caption ?? ""),
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
  };
}

function mapSubmission(row: Row): Submission {
  return {
    id: String(row.id),
    issue_id: String(row.issue_id),
    user_id: String(row.user_id),
    ready_at: row.ready_at ? String(row.ready_at) : null,
    answers: Array.isArray(row.answers) ? row.answers.map((answer) => mapAnswer(answer as Row)) : [],
  };
}

function mapIssue(row: Row): Issue {
  const submissionRow = Array.isArray(row.submissions) ? row.submissions[0] : row.submission;
  return {
    id: String(row.id),
    group_id: String(row.group_id),
    title: String(row.title),
    introduction: String(row.introduction ?? ""),
    cover_emoji: String(row.cover_emoji ?? "✉️"),
    accent_color: String(row.accent_color ?? "#C86B4A"),
    status: row.status as Issue["status"],
    release_at: String(row.release_at),
    published_at: row.published_at ? String(row.published_at) : null,
    questions: Array.isArray(row.questions)
      ? row.questions.map((question) => mapQuestion(question as Row)).sort((a, b) => a.position - b.position)
      : [],
    submission: submissionRow ? mapSubmission(submissionRow as Row) : null,
  };
}

function mapProfile(row: Row): Profile {
  return {
    id: String(row.id),
    display_name: String(row.display_name || "Friend"),
    avatar_path: row.avatar_path ? String(row.avatar_path) : null,
    email_notifications_enabled: Boolean(row.email_notifications_enabled),
  };
}

async function addSignedUrls(issue: PublishedIssue, supabase: Awaited<ReturnType<typeof createClient>>) {
  await Promise.all(
    issue.contributors.map(async (contributor) => {
      if (contributor.profile.avatar_path) {
        const { data } = await supabase.storage.from("avatars").createSignedUrl(contributor.profile.avatar_path, 3600);
        contributor.profile.avatar_url = data?.signedUrl ?? null;
      }
      await Promise.all(
        contributor.submission.answers.map(async (answer) => {
          if (!answer.image_path) return;
          const { data } = await supabase.storage.from("issue-photos").createSignedUrl(answer.image_path, 3600);
          answer.image_url = data?.signedUrl ?? null;
        }),
      );
    }),
  );
  return issue;
}

async function addOwnSignedUrls(issue: Issue | null, profile: Profile, supabase: Awaited<ReturnType<typeof createClient>>) {
  if (profile.avatar_path) {
    const { data } = await supabase.storage.from("avatars").createSignedUrl(profile.avatar_path, 3600);
    profile.avatar_url = data?.signedUrl ?? null;
  }
  await Promise.all(
    (issue?.submission?.answers ?? []).map(async (answer) => {
      if (!answer.image_path) return;
      const { data } = await supabase.storage.from("issue-photos").createSignedUrl(answer.image_path, 3600);
      answer.image_url = data?.signedUrl ?? null;
    }),
  );
  return issue;
}

export const getViewer = cache(async () => {
  if (isDemoMode) return { id: DEMO_USER_ID, email: "jiasheng@example.com" };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? "" };
});

export async function requireViewer() {
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  return viewer;
}

export async function getHomeData(): Promise<HomeData> {
  if (!hasSupabaseEnv) return demoHomeData();
  const viewer = await requireViewer();
  const supabase = await createClient();

  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select("group_id, group:groups!inner(id,name,timezone), profile:profiles!memberships_user_id_fkey(*)")
    .eq("user_id", viewer.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership) redirect("/?error=not-a-member");
  const group = membership.group as unknown as { id: string; name: string; timezone: string };
  const profile = mapProfile(membership.profile as unknown as Row);

  const [{ data: currentRows }, { data: publishedRows }, { count: memberCount }] = await Promise.all([
    supabase
      .from("issues")
      .select("*, questions(*), submissions(*, answers(*))")
      .eq("group_id", group.id)
      .in("status", ["scheduled", "open"])
      .eq("submissions.user_id", viewer.id)
      .order("release_at", { ascending: true })
      .limit(1),
    supabase
      .from("issues")
      .select("*, questions(*), submissions(*, answers(*), profile:profiles!submissions_user_id_fkey(*))")
      .eq("group_id", group.id)
      .eq("status", "published")
      .order("release_at", { ascending: false })
      .limit(3),
    supabase.from("memberships").select("id", { count: "exact", head: true }).eq("group_id", group.id).eq("status", "active"),
  ]);

  const recentIssues = await Promise.all(
    (publishedRows ?? []).map((row) => mapPublishedIssue(row as unknown as Row, supabase)),
  );
  const currentIssue = currentRows?.[0] ? mapIssue(currentRows[0] as unknown as Row) : null;
  await addOwnSignedUrls(currentIssue, profile, supabase);

  return {
    group,
    profile,
    currentIssue,
    recentIssues,
    memberCount: memberCount ?? 0,
  };
}

async function mapPublishedIssue(row: Row, supabase: Awaited<ReturnType<typeof createClient>>) {
  const base = mapIssue(row);
  const contributors: Contributor[] = Array.isArray(row.submissions)
    ? row.submissions.map((submission) => {
        const submissionRow = submission as Row;
        return {
          profile: mapProfile(submissionRow.profile as Row),
          submission: mapSubmission(submissionRow),
        };
      })
    : [];
  contributors.sort((a, b) => a.profile.display_name.localeCompare(b.profile.display_name));
  return addSignedUrls({ ...base, contributors }, supabase);
}

export async function getIssue(id: string): Promise<Issue | PublishedIssue> {
  if (isDemoMode) {
    const issue = getDemoIssue(id);
    if (!issue) notFound();
    return issue;
  }
  const viewer = await requireViewer();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("issues")
    .select("*, questions(*), submissions(*, answers(*), profile:profiles!submissions_user_id_fkey(*))")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) notFound();

  if (data.status === "published") return mapPublishedIssue(data as unknown as Row, supabase);
  const issue = mapIssue(data as unknown as Row);
  issue.submission = issue.submission?.user_id === viewer.id ? issue.submission : null;
  const callbackIds = issue.questions.flatMap((question) =>
    question.callback_to_question_id ? [question.callback_to_question_id] : [],
  );
  if (callbackIds.length) {
    const { data: callbackAnswers } = await supabase
      .from("answers")
      .select("body,question_id,submission:submissions!inner(user_id)")
      .in("question_id", callbackIds)
      .eq("submission.user_id", viewer.id);
    const callbackByQuestion = new Map((callbackAnswers ?? []).map((answer) => [answer.question_id, answer.body]));
    issue.questions.forEach((question) => {
      question.callback_body = question.callback_to_question_id
        ? callbackByQuestion.get(question.callback_to_question_id) ?? null
        : null;
    });
  }
  const { data: profileRow } = await supabase.from("profiles").select("*").eq("id", viewer.id).single();
  if (profileRow) await addOwnSignedUrls(issue, mapProfile(profileRow as unknown as Row), supabase);
  return issue;
}

export async function getPublishedIssues(): Promise<PublishedIssue[]> {
  if (isDemoMode) return structuredClone(demoPublishedIssues);
  const home = await getHomeData();
  const supabase = await createClient();
  const { data } = await supabase
    .from("issues")
    .select("*, questions(*), submissions(*, answers(*), profile:profiles!submissions_user_id_fkey(*))")
    .eq("group_id", home.group.id)
    .eq("status", "published")
    .order("release_at", { ascending: false });
  return Promise.all((data ?? []).map((row) => mapPublishedIssue(row as unknown as Row, supabase)));
}

export async function getManageData(): Promise<ManageData> {
  if (isDemoMode) return demoManageData();
  const home = await getHomeData();
  const supabase = await createClient();
  const [{ data: memberships }, { data: issues }] = await Promise.all([
    supabase
      .from("memberships")
      .select("profile:profiles!memberships_user_id_fkey(*)")
      .eq("group_id", home.group.id)
      .eq("status", "active"),
    supabase
      .from("issues")
      .select("*, questions(*)")
      .eq("group_id", home.group.id)
      .neq("status", "published")
      .order("release_at", { ascending: true }),
  ]);
  const members = (memberships ?? []).map((row) => mapProfile(row.profile as unknown as Row));
  await Promise.all(
    members.map(async (member) => {
      if (!member.avatar_path) return;
      const { data } = await supabase.storage.from("avatars").createSignedUrl(member.avatar_path, 3600);
      member.avatar_url = data?.signedUrl ?? null;
    }),
  );
  return {
    group: home.group,
    members,
    upcomingIssues: (issues ?? []).map((row) => mapIssue(row as unknown as Row)),
  };
}
