import { calendarDaysBetween } from "@/lib/date";
import { siteUrl } from "@/lib/env";
import { sendNotificationEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import type { NotificationEventType } from "@/lib/types";

type GroupRow = { id: string; name: string; timezone: string };
type IssueRow = {
  id: string;
  group_id: string;
  title: string;
  status: "scheduled" | "open" | "published";
  release_at: string;
};
type Recipient = {
  user_id: string;
  email: string;
  profile: { display_name: string; email_notifications_enabled: boolean } | Array<{ display_name: string; email_notifications_enabled: boolean }>;
};

function profileOf(recipient: Recipient) {
  return Array.isArray(recipient.profile) ? recipient.profile[0] : recipient.profile;
}

async function recipientsForIssue(issue: IssueRow, onlyNotReady: boolean) {
  const supabase = createAdminClient();
  const { data: memberships, error } = await supabase
    .from("memberships")
    .select("user_id,email,profile:profiles!memberships_user_id_fkey(display_name,email_notifications_enabled)")
    .eq("group_id", issue.group_id)
    .eq("status", "active");
  if (error) throw error;

  let readyIds = new Set<string>();
  if (onlyNotReady) {
    const { data: submissions, error: submissionError } = await supabase
      .from("submissions")
      .select("user_id")
      .eq("issue_id", issue.id)
      .not("ready_at", "is", null);
    if (submissionError) throw submissionError;
    readyIds = new Set((submissions ?? []).map((submission) => submission.user_id));
  }

  return ((memberships ?? []) as unknown as Recipient[]).filter((recipient) => {
    const profile = profileOf(recipient);
    return recipient.email && profile?.email_notifications_enabled && (!onlyNotReady || !readyIds.has(recipient.user_id));
  });
}

function notificationContent(type: NotificationEventType, group: GroupRow, issue: IssueRow, displayName: string) {
  const base = siteUrl();
  const writeUrl = `${base}/issues/${issue.id}/respond`;
  const readUrl = `${base}/issues/${issue.id}`;
  switch (type) {
    case "submission_open":
      return {
        subject: `${group.name}: ${issue.title} is open`,
        message: `${issue.title} is open, ${displayName}. Add your month over the next two weeks.`,
        action: "Write your page",
        url: writeUrl,
      };
    case "week_reminder":
      return {
        subject: `${group.name}: one week until ${issue.title}`,
        message: `There is one week until ${issue.title}. Your page is still open.`,
        action: "Keep writing",
        url: writeUrl,
      };
    case "day_reminder":
      return {
        subject: `${group.name}: ${issue.title} releases tomorrow`,
        message: `${issue.title} releases tomorrow. Add anything you want to keep.`,
        action: "Finish your page",
        url: writeUrl,
      };
    case "issue_release":
      return {
        subject: `${group.name}: ${issue.title} is ready`,
        message: `${issue.title} is on the shelf. The new letter is ready to read.`,
        action: "Read the issue",
        url: readUrl,
      };
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character] ?? character);
}

function emailHtml(group: GroupRow, content: ReturnType<typeof notificationContent>) {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f3ecdf;color:#27251f;font-family:Arial,sans-serif">
    <div style="max-width:560px;margin:0 auto;padding:48px 24px">
      <p style="margin:0 0 20px;color:#9c4d35;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase">${escapeHtml(group.name)}</p>
      <div style="background:#fffaf1;border:1px solid #ded3c2;border-radius:20px;padding:32px">
        <p style="margin:0 0 26px;font-size:18px;line-height:1.65">${escapeHtml(content.message)}</p>
        <a href="${escapeHtml(content.url)}" style="display:inline-block;border-radius:999px;background:#27251f;color:#fffaf1;padding:13px 20px;text-decoration:none;font-size:14px;font-weight:700">${escapeHtml(content.action)}</a>
      </div>
      <p style="margin:20px 4px 0;color:#746f65;font-size:12px;line-height:1.6">You can turn these reminders off in Eaterloop settings.</p>
    </div>
  </body>
</html>`;
}

async function deliverEvent(type: NotificationEventType, group: GroupRow, issue: IssueRow, onlyNotReady: boolean) {
  const supabase = createAdminClient();
  const recipients = await recipientsForIssue(issue, onlyNotReady);
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const { data: existing } = await supabase
      .from("notification_events")
      .select("id,status,attempt_count")
      .eq("issue_id", issue.id)
      .eq("user_id", recipient.user_id)
      .eq("type", type)
      .maybeSingle();
    if (existing?.status === "sent") {
      skipped += 1;
      continue;
    }

    let eventId = existing?.id;
    if (existing) {
      const { data } = await supabase
        .from("notification_events")
        .update({ status: "pending", attempt_count: existing.attempt_count + 1, error_message: null })
        .eq("id", existing.id)
        .neq("status", "sent")
        .select("id")
        .maybeSingle();
      eventId = data?.id;
    } else {
      const { data, error } = await supabase
        .from("notification_events")
        .insert({ issue_id: issue.id, user_id: recipient.user_id, type, status: "pending", attempt_count: 1 })
        .select("id")
        .maybeSingle();
      if (error?.code === "23505") {
        skipped += 1;
        continue;
      }
      if (error) throw error;
      eventId = data?.id;
    }
    if (!eventId) {
      skipped += 1;
      continue;
    }

    try {
      const content = notificationContent(type, group, issue, profileOf(recipient).display_name);
      const message = await sendNotificationEmail({
        to: recipient.email,
        subject: content.subject,
        text: `${content.message}\n\n${content.action}: ${content.url}`,
        html: emailHtml(group, content),
        idempotencyKey: `eaterloop-${issue.id}-${recipient.user_id}-${type}`,
      });
      await supabase
        .from("notification_events")
        .update({ status: "sent", provider_message_id: message.id, sent_at: new Date().toISOString() })
        .eq("id", eventId);
      sent += 1;
    } catch (error) {
      await supabase
        .from("notification_events")
        .update({ status: "failed", error_message: error instanceof Error ? error.message.slice(0, 500) : "Unknown email error" })
        .eq("id", eventId);
      failed += 1;
    }
  }
  return { sent, skipped, failed };
}

export async function runMonthlyScheduler(now = new Date()) {
  const supabase = createAdminClient();
  const [{ data: groups, error: groupError }, { data: issues, error: issueError }] = await Promise.all([
    supabase.from("groups").select("id,name,timezone"),
    supabase
      .from("issues")
      .select("id,group_id,title,status,release_at")
      .in("status", ["scheduled", "open"])
      .order("release_at", { ascending: true }),
  ]);
  if (groupError) throw groupError;
  if (issueError) throw issueError;
  const groupById = new Map((groups as GroupRow[] | null)?.map((group) => [group.id, group]) ?? []);
  const results: Array<Record<string, unknown>> = [];

  for (const issue of (issues ?? []) as IssueRow[]) {
    const group = groupById.get(issue.group_id);
    if (!group) continue;
    const days = calendarDaysBetween(now, issue.release_at, group.timezone);

    if (days <= 0) {
      const publishedAt = now.toISOString();
      const { error } = await supabase
        .from("issues")
        .update({ status: "published", published_at: publishedAt })
        .eq("id", issue.id)
        .neq("status", "published");
      if (error) throw error;
      issue.status = "published";
      results.push({ issue: issue.id, days, transition: "published", ...(await deliverEvent("issue_release", group, issue, false)) });
      continue;
    }

    if (issue.status === "scheduled" && days <= 14) {
      const { error } = await supabase.from("issues").update({ status: "open" }).eq("id", issue.id).eq("status", "scheduled");
      if (error) throw error;
      issue.status = "open";
      results.push({ issue: issue.id, days, transition: "opened", ...(await deliverEvent("submission_open", group, issue, false)) });
      continue;
    }

    if (issue.status === "open" && days === 7) {
      results.push({ issue: issue.id, days, event: "week_reminder", ...(await deliverEvent("week_reminder", group, issue, true)) });
    }
    if (issue.status === "open" && days === 1) {
      results.push({ issue: issue.id, days, event: "day_reminder", ...(await deliverEvent("day_reminder", group, issue, true)) });
    }
  }

  return { checkedAt: now.toISOString(), issuesChecked: issues?.length ?? 0, results };
}
