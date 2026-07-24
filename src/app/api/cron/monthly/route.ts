import { NextResponse } from "next/server";
import { hasSupabaseAdminEnv } from "@/lib/env";
import { runMonthlyScheduler } from "@/lib/scheduler";

export const maxDuration = 60;

export async function GET(request: Request) {
  if (!hasSupabaseAdminEnv) {
    return NextResponse.json({ error: "Supabase admin configuration is missing." }, { status: 503 });
  }
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (process.env.NODE_ENV === "production" && (!secret || authorization !== `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    return NextResponse.json(await runMonthlyScheduler());
  } catch (error) {
    console.error("Monthly scheduler failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Scheduler failed." }, { status: 500 });
  }
}
