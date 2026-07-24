"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ACCENT_COLORS } from "@/lib/constants";
import { releaseIsoFromDateInput } from "@/lib/date";
import { isDemoMode } from "@/lib/env";
import { requireViewer } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

const settingsSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  emailEnabled: z.boolean(),
});

export async function signOutAction() {
  if (!isDemoMode) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

export async function updateSettingsAction(formData: FormData) {
  if (isDemoMode) redirect("/settings?saved=demo");
  const viewer = await requireViewer();
  const parsed = settingsSchema.safeParse({
    displayName: formData.get("displayName"),
    emailEnabled: formData.get("emailEnabled") === "on",
  });
  if (!parsed.success) redirect("/settings?error=invalid");

  const supabase = await createClient();
  let avatarPath: string | undefined;
  const removeAvatar = formData.get("removeAvatar") === "on";
  const avatar = formData.get("avatar");

  if (avatar instanceof File && avatar.size > 0) {
    if (avatar.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(avatar.type)) {
      redirect("/settings?error=avatar");
    }
    const extension = avatar.type.split("/")[1].replace("jpeg", "jpg");
    avatarPath = `${viewer.id}/${randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from("avatars").upload(avatarPath, avatar, {
      contentType: avatar.type,
      upsert: false,
    });
    if (error) redirect("/settings?error=upload");
  }

  const updates: Record<string, unknown> = {
    display_name: parsed.data.displayName,
    email_notifications_enabled: parsed.data.emailEnabled,
  };
  if (avatarPath) updates.avatar_path = avatarPath;
  if (removeAvatar) updates.avatar_path = null;

  const { error } = await supabase.from("profiles").update(updates).eq("id", viewer.id);
  if (error) redirect("/settings?error=save");
  revalidatePath("/settings");
  revalidatePath("/home");
  redirect("/settings?saved=1");
}

const issueSchema = z.object({
  title: z.string().trim().min(1).max(120),
  introduction: z.string().trim().max(1000),
  coverEmoji: z.string().trim().min(1).max(12),
  accentColor: z.string().refine((value) => ACCENT_COLORS.includes(value)),
  releaseDate: z.iso.date(),
  questions: z
    .array(
      z.object({
        prompt: z.string().trim().min(1).max(300),
        type: z.enum(["text", "photo", "prediction"]),
      }),
    )
    .min(1)
    .max(10),
});

async function latestPredictionQuestion(
  supabase: Awaited<ReturnType<typeof createClient>>,
  groupId: string,
  releaseAt: string,
) {
  const { data: previousIssue } = await supabase
    .from("issues")
    .select("id")
    .eq("group_id", groupId)
    .eq("status", "published")
    .lt("release_at", releaseAt)
    .order("release_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!previousIssue) return null;
  const { data: question } = await supabase
    .from("questions")
    .select("id")
    .eq("issue_id", previousIssue.id)
    .eq("type", "prediction")
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();
  return question?.id ?? null;
}

export async function createIssueAction(formData: FormData) {
  if (isDemoMode) redirect("/manage?created=demo");
  await requireViewer();
  const questionValues = formData
    .getAll("questions")
    .map(String)
    .filter((value) => value.trim());
  const questionTypes = formData.getAll("questionTypes").map(String);
  const parsed = issueSchema.safeParse({
    title: formData.get("title"),
    introduction: formData.get("introduction"),
    coverEmoji: formData.get("coverEmoji"),
    accentColor: formData.get("accentColor"),
    releaseDate: formData.get("releaseDate"),
    questions: questionValues.map((prompt, index) => ({ prompt, type: questionTypes[index] ?? "text" })),
  });
  if (!parsed.success) redirect("/manage?error=invalid");

  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("memberships")
    .select("group_id")
    .eq("user_id", (await requireViewer()).id)
    .eq("status", "active")
    .limit(1)
    .single();
  if (!membership) redirect("/manage?error=membership");

  const { data: issue, error } = await supabase
    .from("issues")
    .insert({
      group_id: membership.group_id,
      title: parsed.data.title,
      introduction: parsed.data.introduction,
      cover_emoji: parsed.data.coverEmoji,
      accent_color: parsed.data.accentColor,
      release_at: releaseIsoFromDateInput(parsed.data.releaseDate),
      status: "scheduled",
    })
    .select("id")
    .single();
  if (error || !issue) redirect("/manage?error=create");

  const callbackQuestionId = await latestPredictionQuestion(supabase, membership.group_id, releaseIsoFromDateInput(parsed.data.releaseDate));
  const { error: questionError } = await supabase.from("questions").insert(
    parsed.data.questions.map((question, index) => ({
      issue_id: issue.id,
      prompt: question.prompt,
      type: question.type,
      position: index + 1,
      callback_to_question_id: question.type === "prediction" ? callbackQuestionId : null,
    })),
  );
  if (questionError) redirect("/manage?error=questions");
  revalidatePath("/manage");
  revalidatePath("/home");
  redirect("/manage?created=1");
}

export async function updateIssueAction(formData: FormData) {
  if (isDemoMode) redirect("/manage?updated=demo");
  await requireViewer();
  const issueId = z.uuid().safeParse(formData.get("issueId"));
  const questionValues = formData.getAll("questions").map(String).filter((value) => value.trim());
  const questionTypes = formData.getAll("questionTypes").map(String);
  const parsed = issueSchema.safeParse({
    title: formData.get("title"),
    introduction: formData.get("introduction"),
    coverEmoji: formData.get("coverEmoji"),
    accentColor: formData.get("accentColor"),
    releaseDate: formData.get("releaseDate"),
    questions: questionValues.map((prompt, index) => ({ prompt, type: questionTypes[index] ?? "text" })),
  });
  if (!issueId.success || !parsed.success) redirect("/manage?error=invalid");

  const supabase = await createClient();
  const { data: issue, error } = await supabase
    .from("issues")
    .update({
      title: parsed.data.title,
      introduction: parsed.data.introduction,
      cover_emoji: parsed.data.coverEmoji,
      accent_color: parsed.data.accentColor,
      release_at: releaseIsoFromDateInput(parsed.data.releaseDate),
    })
    .eq("id", issueId.data)
    .eq("status", "scheduled")
    .select("id,group_id")
    .maybeSingle();
  if (error || !issue) redirect("/manage?error=update");

  await supabase.from("questions").delete().eq("issue_id", issue.id);
  const callbackQuestionId = await latestPredictionQuestion(supabase, issue.group_id, releaseIsoFromDateInput(parsed.data.releaseDate));
  const { error: questionError } = await supabase.from("questions").insert(
    parsed.data.questions.map((question, index) => ({
      issue_id: issue.id,
      prompt: question.prompt,
      type: question.type,
      position: index + 1,
      callback_to_question_id: question.type === "prediction" ? callbackQuestionId : null,
    })),
  );
  if (questionError) redirect("/manage?error=questions");
  revalidatePath("/manage");
  revalidatePath("/home");
  redirect("/manage?updated=1");
}
