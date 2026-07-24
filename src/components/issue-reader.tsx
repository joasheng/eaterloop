"use client";
/* eslint-disable @next/next/no-img-element -- private signed URLs expire and are rendered directly */

import { useState } from "react";
import { LayoutList, Users } from "lucide-react";
import { Avatar } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { PublishedIssue } from "@/lib/types";

export function IssueReader({ issue }: { issue: PublishedIssue }) {
  const [view, setView] = useState<"people" | "questions">("people");
  const questionById = new Map(issue.questions.map((question) => [question.id, question]));
  const photos = issue.contributors.flatMap((contributor) =>
    contributor.submission.answers.filter((answer) => answer.image_url).map((answer) => ({ ...answer, name: contributor.profile.display_name })),
  );

  return (
    <>
      {photos.length > 0 && (
        <section className="mx-auto mt-10 grid max-w-6xl auto-rows-[14rem] grid-cols-1 gap-3 px-5 sm:grid-cols-2 lg:grid-cols-3 lg:px-10">
          {photos.map((photo) => (
            <figure key={photo.id} className="group relative overflow-hidden rounded-3xl">
              <img src={photo.image_url!} alt={photo.image_caption || `Photo from ${photo.name}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-5 pb-4 pt-12 text-sm text-white">{photo.image_caption || photo.name}</figcaption>
            </figure>
          ))}
        </section>
      )}

      <div className="mx-auto mt-16 flex max-w-5xl justify-center px-5">
        <div className="inline-flex rounded-full border border-black/10 bg-white/35 p-1">
          <button onClick={() => setView("people")} className={cn("focus-ring inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold", view === "people" && "bg-[#292720] text-white")}><Users className="h-4 w-4" /> By person</button>
          <button onClick={() => setView("questions")} className={cn("focus-ring inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold", view === "questions" && "bg-[#292720] text-white")}><LayoutList className="h-4 w-4" /> By question</button>
        </div>
      </div>

      {view === "people" ? (
        <div className="mx-auto mt-12 max-w-4xl space-y-20 px-5">
          {issue.contributors.map((contributor) => (
            <article key={contributor.profile.id}>
              <header className="flex items-center gap-4 border-b border-black/15 pb-5">
                <Avatar name={contributor.profile.display_name} url={contributor.profile.avatar_url} size="lg" />
                <h2 className="font-editorial text-4xl sm:text-5xl">{contributor.profile.display_name}</h2>
              </header>
              <div className="mt-8 space-y-12">
                {contributor.submission.answers.filter((answer) => answer.body.trim() || answer.image_url).map((answer) => (
                  <section key={answer.id}>
                    <p className="eyebrow leading-5 text-[#8b4e39]">{questionById.get(answer.question_id)?.prompt}</p>
                    {answer.body && <p className="magazine-copy mt-4">{answer.body}</p>}
                    {answer.image_url && <img src={answer.image_url} alt={answer.image_caption} className="mt-5 max-h-[38rem] w-full rounded-3xl object-cover" />}
                    {answer.image_caption && <p className="mt-2 text-sm italic text-[#746f65]">{answer.image_caption}</p>}
                  </section>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mx-auto mt-12 max-w-5xl space-y-20 px-5">
          {issue.questions.map((question) => {
            const responses = issue.contributors.flatMap((contributor) => {
              const answer = contributor.submission.answers.find((item) => item.question_id === question.id);
              return answer && (answer.body.trim() || answer.image_url) ? [{ answer, profile: contributor.profile }] : [];
            });
            if (!responses.length) return null;
            return (
              <section key={question.id}>
                <p className="eyebrow text-[#8b4e39]">Question {question.position}</p>
                <h2 className="font-editorial mt-3 max-w-3xl text-4xl sm:text-5xl">{question.prompt}</h2>
                <div className="mt-9 grid gap-5 sm:grid-cols-2">
                  {responses.map(({ answer, profile }) => (
                    <article key={answer.id} className="rounded-3xl border border-black/10 bg-white/30 p-6">
                      <div className="flex items-center gap-3"><Avatar name={profile.display_name} url={profile.avatar_url} size="sm" /><span className="font-semibold">{profile.display_name}</span></div>
                      {answer.body && <p className="magazine-copy mt-5 text-[1.08rem]">{answer.body}</p>}
                      {answer.image_url && <img src={answer.image_url} alt={answer.image_caption} className="mt-5 rounded-2xl" />}
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
