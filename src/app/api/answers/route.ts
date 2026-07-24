import { NextResponse } from "next/server";
import { z } from "zod";
import { isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const answerSchema = z.object({
  issueId: z.uuid(),
  questionId: z.uuid(),
  body: z.string().max(10_000),
  imagePath: z.string().max(500).nullable(),
  imageCaption: z.string().max(500),
});

export async function POST(request: Request) {
  const parsed = answerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid answer." }, { status: 400 });
  if (isDemoMode) return NextResponse.json({ savedAt: new Date().toISOString(), demo: true });

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ error: "Sign in again." }, { status: 401 });

  const { data: submission, error: submissionError } = await supabase
    .from("submissions")
    .upsert(
      { issue_id: parsed.data.issueId, user_id: authData.user.id },
      { onConflict: "issue_id,user_id", ignoreDuplicates: false },
    )
    .select("id")
    .single();
  if (submissionError || !submission) {
    return NextResponse.json({ error: submissionError?.message ?? "Could not create response." }, { status: 403 });
  }

  const { error } = await supabase.from("answers").upsert(
    {
      submission_id: submission.id,
      question_id: parsed.data.questionId,
      body: parsed.data.body,
      image_path: parsed.data.imagePath,
      image_caption: parsed.data.imageCaption,
    },
    { onConflict: "submission_id,question_id" },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 403 });
  return NextResponse.json({ savedAt: new Date().toISOString() });
}
