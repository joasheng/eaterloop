"use client";
/* eslint-disable @next/next/no-img-element -- local previews use blob URLs */

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Check, CheckCircle2, ImagePlus, LoaderCircle, Save, Trash2, X } from "lucide-react";
import { Button, GhostLink } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import type { Answer, Issue } from "@/lib/types";

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";
type Draft = {
  body: string;
  imagePath: string | null;
  imageUrl: string | null;
  imageCaption: string;
  state: SaveState;
  error?: string;
};

function initialDraft(answer?: Answer): Draft {
  return {
    body: answer?.body ?? "",
    imagePath: answer?.image_path ?? null,
    imageUrl: answer?.image_url ?? null,
    imageCaption: answer?.image_caption ?? "",
    state: "idle",
  };
}

export function ResponseEditor({ issue, viewerId }: { issue: Issue; viewerId: string }) {
  const answerByQuestion = useMemo(
    () => new Map(issue.submission?.answers.map((answer) => [answer.question_id, answer]) ?? []),
    [issue.submission?.answers],
  );
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(issue.questions.map((question) => [question.id, initialDraft(answerByQuestion.get(question.id))])),
  );
  const [ready, setReady] = useState(Boolean(issue.submission?.ready_at));
  const [readyBusy, setReadyBusy] = useState(false);
  const [readyError, setReadyError] = useState("");
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const answered = Object.values(drafts).filter((draft) => draft.body.trim() || draft.imagePath).length;
  const hasUnsaved = Object.values(drafts).some((draft) => draft.state === "dirty" || draft.state === "saving");

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsaved) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [hasUnsaved]);

  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  async function save(questionId: string, draft: Draft) {
    setDrafts((current) => ({ ...current, [questionId]: { ...current[questionId], state: "saving", error: undefined } }));
    try {
      const response = await fetch("/api/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueId: issue.id,
          questionId,
          body: draft.body,
          imagePath: draft.imagePath,
          imageCaption: draft.imageCaption,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Save failed.");
      setDrafts((current) => ({ ...current, [questionId]: { ...current[questionId], state: "saved" } }));
    } catch (error) {
      setDrafts((current) => ({
        ...current,
        [questionId]: { ...current[questionId], state: "error", error: error instanceof Error ? error.message : "Save failed." },
      }));
    }
  }

  function changeDraft(questionId: string, patch: Partial<Draft>) {
    setDrafts((current) => {
      const next = { ...current[questionId], ...patch, state: "dirty" as const };
      clearTimeout(timers.current[questionId]);
      timers.current[questionId] = setTimeout(() => save(questionId, next), 800);
      return { ...current, [questionId]: next };
    });
  }

  async function uploadPhoto(questionId: string, file: File) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
      changeDraft(questionId, { state: "error", error: "Use a JPG, PNG, or WebP under 10 MB." });
      return;
    }
    const localUrl = URL.createObjectURL(file);
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      changeDraft(questionId, { imagePath: `demo/${file.name}`, imageUrl: localUrl });
      return;
    }
    setDrafts((current) => ({ ...current, [questionId]: { ...current[questionId], state: "saving", imageUrl: localUrl } }));
    const extension = file.type.split("/")[1].replace("jpeg", "jpg");
    const path = `${issue.id}/${viewerId}/${crypto.randomUUID()}.${extension}`;
    const supabase = createClient();
    const { error } = await supabase.storage.from("issue-photos").upload(path, file, { contentType: file.type });
    if (error) {
      setDrafts((current) => ({ ...current, [questionId]: { ...current[questionId], state: "error", error: error.message } }));
      return;
    }
    changeDraft(questionId, { imagePath: path, imageUrl: localUrl });
  }

  async function toggleReady() {
    if (hasUnsaved) return;
    setReadyBusy(true);
    setReadyError("");
    try {
      const response = await fetch("/api/submissions/ready", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueId: issue.id, ready: !ready }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not update readiness.");
      setReady(!ready);
    } catch (error) {
      setReadyError(error instanceof Error ? error.message : "Could not update readiness.");
    } finally {
      setReadyBusy(false);
    }
  }

  return (
    <div>
      <div className="sticky top-0 z-20 border-b border-black/10 bg-[#f4efe4]/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
          <GhostLink href="/home"><X className="h-4 w-4" /> Close</GhostLink>
          <div className="hidden items-center gap-3 text-sm sm:flex">
            <span className="font-semibold">{answered} of {issue.questions.length}</span>
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-black/10"><div className="h-full bg-[#c86b4a]" style={{ width: `${(answered / issue.questions.length) * 100}%` }} /></div>
          </div>
          <span className="inline-flex min-w-24 items-center justify-end gap-2 text-xs font-semibold text-[#746f65]">
            {hasUnsaved ? <><LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Saving…</> : <><Check className="h-3.5 w-3.5" /> Saved</>}
          </span>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-5 py-10 sm:py-16">
        <p className="eyebrow text-[#9c4d35]">Your page · private until release</p>
        <h1 className="font-editorial mt-3 text-balance text-5xl leading-tight sm:text-6xl">{issue.title}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-[#746f65]">Answer what feels worth keeping. Skip anything. Every change saves as you go.</p>

        <div className="mt-12 space-y-6">
          {issue.questions.map((question, index) => {
            const draft = drafts[question.id];
            return (
              <article key={question.id} className="paper-card p-5 sm:p-8">
                <div className="flex items-start gap-4">
                  <span className="font-editorial grid h-9 w-9 shrink-0 place-items-center rounded-full border border-black/15 text-lg">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-editorial text-2xl leading-snug sm:text-3xl">{question.prompt}</h2>
                    {question.callback_body ? (
                      <blockquote className="mt-4 rounded-2xl border-l-2 border-[#c86b4a] bg-[#c86b4a]/7 px-4 py-3 text-sm leading-6 text-[#625e55]">
                        <span className="font-semibold not-italic">Last month you said:</span> “{question.callback_body}”
                      </blockquote>
                    ) : question.type === "prediction" ? (
                      <p className="mt-2 text-sm italic text-[#746f65]">We may bring this back to you next month.</p>
                    ) : null}
                  </div>
                </div>

                <textarea
                  aria-label={question.prompt}
                  value={draft.body}
                  onChange={(event) => changeDraft(question.id, { body: event.target.value })}
                  placeholder="Write a little, or leave this one for later…"
                  rows={question.type === "photo" ? 4 : 7}
                  className="focus-ring mt-6 w-full resize-y rounded-2xl border border-black/12 bg-white/45 p-4 leading-7 placeholder:text-[#9b958a]"
                />

                {question.type === "photo" && (
                  <div className="mt-4">
                    {draft.imageUrl ? (
                      <div className="relative overflow-hidden rounded-2xl border border-black/10">
                        <img src={draft.imageUrl} alt="Your monthly upload" className="max-h-[32rem] w-full object-cover" />
                        <button type="button" onClick={() => changeDraft(question.id, { imagePath: null, imageUrl: null, imageCaption: "" })} className="focus-ring absolute right-3 top-3 rounded-full bg-[#25231f]/85 p-2 text-white" aria-label="Remove photo"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ) : (
                      <label className="focus-ring flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-black/20 bg-white/25 px-6 py-9 text-center hover:bg-white/40">
                        <ImagePlus className="h-6 w-6" />
                        <span className="mt-2 font-semibold">Add one photo</span>
                        <span className="mt-1 text-xs text-[#746f65]">JPG, PNG, or WebP · up to 10 MB</span>
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => event.target.files?.[0] && uploadPhoto(question.id, event.target.files[0])} />
                      </label>
                    )}
                    {draft.imagePath && (
                      <input aria-label="Photo caption" value={draft.imageCaption} onChange={(event) => changeDraft(question.id, { imageCaption: event.target.value })} placeholder="A short caption…" maxLength={500} className="focus-ring mt-3 h-12 w-full rounded-2xl border border-black/12 bg-white/45 px-4" />
                    )}
                  </div>
                )}

                <div className="mt-4 flex min-h-5 items-center justify-end text-xs font-semibold text-[#746f65]">
                  {draft.state === "saving" && <span className="inline-flex items-center gap-1.5"><LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Saving</span>}
                  {draft.state === "saved" && <span className="inline-flex items-center gap-1.5"><Save className="h-3.5 w-3.5" /> Saved</span>}
                  {draft.state === "error" && <span className="inline-flex items-center gap-1.5 text-red-900"><AlertCircle className="h-3.5 w-3.5" /> {draft.error}</span>}
                </div>
              </article>
            );
          })}
        </div>

        <section className="mt-10 rounded-[1.6rem] border border-black/10 bg-[#dfe5d8] p-6 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-8">
          <div>
            <h2 className="font-editorial text-3xl">{ready ? "You’re ready." : "Done for now?"}</h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-[#596451]">{ready ? "We’ll skip the deadline reminders. You can still change anything until release." : "Marking ready only quiets reminder texts—it never locks your answers."}</p>
            {readyError && <p className="mt-2 text-sm text-red-900">{readyError}</p>}
          </div>
          <Button onClick={toggleReady} disabled={readyBusy || hasUnsaved} className="mt-5 w-full sm:mt-0 sm:w-auto">
            {readyBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : ready ? <CheckCircle2 className="h-4 w-4" /> : <Check className="h-4 w-4" />}
            {ready ? "Send reminders again" : "Mark me ready"}
          </Button>
        </section>
      </main>
    </div>
  );
}
