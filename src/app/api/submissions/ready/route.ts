import { NextResponse } from "next/server";
import { z } from "zod";
import { isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ issueId: z.uuid(), ready: z.boolean() });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  if (isDemoMode) return NextResponse.json({ readyAt: parsed.data.ready ? new Date().toISOString() : null, demo: true });
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ error: "Sign in again." }, { status: 401 });
  const { error } = await supabase.from("submissions").upsert(
    {
      issue_id: parsed.data.issueId,
      user_id: authData.user.id,
      ready_at: parsed.data.ready ? new Date().toISOString() : null,
    },
    { onConflict: "issue_id,user_id" },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 403 });
  return NextResponse.json({ readyAt: parsed.data.ready ? new Date().toISOString() : null });
}
