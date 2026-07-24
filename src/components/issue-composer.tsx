"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, CalendarDays, Plus, Trash2 } from "lucide-react";
import { createIssueAction, updateIssueAction } from "@/app/actions";
import { Button } from "@/components/ui";
import { ACCENT_COLORS, DEFAULT_QUESTIONS } from "@/lib/constants";
import { dateInputValue, nextFirstMonday } from "@/lib/date";
import type { Issue, QuestionType } from "@/lib/types";

export function IssueComposer({ issue, defaultReleaseDate }: { issue?: Issue; defaultReleaseDate?: string }) {
  const [questions, setQuestions] = useState(
    issue?.questions.map((question) => ({ prompt: question.prompt, type: question.type })) ??
      DEFAULT_QUESTIONS.map((question) => ({ ...question })),
  );
  const action = issue ? updateIssueAction : createIssueAction;

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= questions.length) return;
    setQuestions((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <form action={action} className="paper-card p-6 sm:p-9">
      {issue && <input type="hidden" name="issueId" value={issue.id} />}
      <div className="grid gap-5 sm:grid-cols-[1fr_7rem]">
        <div>
          <label htmlFor={`title-${issue?.id ?? "new"}`} className="mb-2 block text-sm font-semibold">Issue title</label>
          <input id={`title-${issue?.id ?? "new"}`} name="title" required maxLength={120} defaultValue={issue?.title ?? "Around the table"} className="focus-ring h-12 w-full rounded-2xl border border-black/15 bg-white/45 px-4" />
        </div>
        <div>
          <label htmlFor={`emoji-${issue?.id ?? "new"}`} className="mb-2 block text-sm font-semibold">Cover</label>
          <input id={`emoji-${issue?.id ?? "new"}`} name="coverEmoji" required maxLength={12} defaultValue={issue?.cover_emoji ?? "🍅"} className="focus-ring h-12 w-full rounded-2xl border border-black/15 bg-white/45 px-4 text-center text-xl" />
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor={`intro-${issue?.id ?? "new"}`} className="mb-2 block text-sm font-semibold">Opening note</label>
        <textarea id={`intro-${issue?.id ?? "new"}`} name="introduction" maxLength={1000} rows={3} defaultValue={issue?.introduction ?? "A small place to leave the bits of life we might otherwise forget."} className="focus-ring w-full rounded-2xl border border-black/15 bg-white/45 p-4 leading-7" />
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`release-${issue?.id ?? "new"}`} className="mb-2 block text-sm font-semibold">Release date</label>
          <div className="relative"><CalendarDays className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-[#746f65]" /><input id={`release-${issue?.id ?? "new"}`} name="releaseDate" type="date" required defaultValue={issue ? issue.release_at.slice(0, 10) : defaultReleaseDate ?? dateInputValue(nextFirstMonday())} className="focus-ring h-12 w-full rounded-2xl border border-black/15 bg-white/45 pl-11 pr-4" /></div>
          <p className="mt-2 text-xs text-[#746f65]">Writing opens automatically 14 days earlier.</p>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Accent</legend>
          <div className="flex h-12 items-center gap-3 rounded-2xl border border-black/15 bg-white/30 px-4">
            {ACCENT_COLORS.map((color) => (
              <label key={color} className="cursor-pointer">
                <input type="radio" name="accentColor" value={color} defaultChecked={(issue?.accent_color ?? ACCENT_COLORS[0]) === color} className="peer sr-only" />
                <span className="block h-7 w-7 rounded-full border-2 border-transparent shadow-sm ring-offset-2 ring-offset-[#f8f3e9] peer-checked:ring-2 peer-checked:ring-black/50" style={{ backgroundColor: color }} />
                <span className="sr-only">{color}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="rule mt-8 pt-7">
        <div className="flex items-center justify-between gap-4">
          <div><p className="font-semibold">Questions</p><p className="mt-1 text-sm text-[#746f65]">Everyone may skip anything.</p></div>
          <button type="button" onClick={() => setQuestions((current) => [...current, { prompt: "", type: "text" }])} disabled={questions.length >= 10} className="focus-ring inline-flex items-center gap-2 rounded-full border border-black/15 px-4 py-2 text-sm font-semibold disabled:opacity-40"><Plus className="h-4 w-4" /> Add</button>
        </div>
        <div className="mt-5 space-y-3">
          {questions.map((question, index) => (
            <div key={index} className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-2xl border border-black/10 bg-white/30 p-3">
              <span className="font-editorial text-center text-lg">{index + 1}</span>
              <div className="grid min-w-0 gap-2 sm:grid-cols-[1fr_8.5rem]">
                <input name="questions" value={question.prompt} onChange={(event) => setQuestions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, prompt: event.target.value } : item))} required maxLength={300} aria-label={`Question ${index + 1}`} className="focus-ring min-h-10 min-w-0 rounded-xl border border-black/10 bg-white/50 px-3" />
                <select name="questionTypes" value={question.type} onChange={(event) => setQuestions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, type: event.target.value as QuestionType } : item))} aria-label={`Question ${index + 1} type`} className="focus-ring min-h-10 min-w-0 rounded-xl border border-black/10 bg-white/50 px-2 text-xs font-semibold">
                  <option value="text">Text</option>
                  <option value="photo">Photo</option>
                  <option value="prediction">Prediction</option>
                </select>
              </div>
              <div className="flex">
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="focus-ring rounded-lg p-2 disabled:opacity-25" aria-label={`Move question ${index + 1} up`}><ArrowUp className="h-4 w-4" /></button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === questions.length - 1} className="focus-ring rounded-lg p-2 disabled:opacity-25" aria-label={`Move question ${index + 1} down`}><ArrowDown className="h-4 w-4" /></button>
                <button type="button" onClick={() => setQuestions((current) => current.filter((_, itemIndex) => itemIndex !== index))} disabled={questions.length === 1} className="focus-ring rounded-lg p-2 text-[#8b4e39] disabled:opacity-25" aria-label={`Remove question ${index + 1}`}><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex justify-end"><Button type="submit">{issue ? "Save upcoming issue" : "Schedule issue"}</Button></div>
    </form>
  );
}
