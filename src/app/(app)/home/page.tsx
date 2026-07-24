import { ArrowRight, CalendarDays, Check, Clock3, PenLine } from "lucide-react";
import { Badge, ButtonLink, GhostLink } from "@/components/ui";
import { IssueCard } from "@/components/issue-card";
import { daysUntil, formatLongDate } from "@/lib/date";
import { getHomeData } from "@/lib/data";

export const metadata = { title: "Home" };

export default async function HomePage() {
  const data = await getHomeData();
  const issue = data.currentIssue;
  const answered = issue?.submission?.answers.filter((answer) => answer.body.trim() || answer.image_path).length ?? 0;
  const total = issue?.questions.length ?? 0;

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 lg:px-10 lg:py-16">
      <section className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow text-[#9c4d35]">Hello, {data.profile.display_name}</p>
          <h1 className="font-editorial mt-3 text-5xl sm:text-6xl">Here’s where we are.</h1>
        </div>
        <p className="max-w-sm text-sm leading-6 text-[#746f65]">Five lives, gathered once a month. Nothing here is visible to the group until release day.</p>
      </section>

      {issue ? (
        <section className="paper-card relative mt-10 overflow-hidden p-6 sm:p-9 lg:p-12">
          <div className="absolute -right-8 -top-8 text-[9rem] opacity-10" aria-hidden="true">{issue.cover_emoji}</div>
          <div className="relative grid gap-10 lg:grid-cols-[1fr_18rem]">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className={issue.status === "open" ? "border-[#738b6b]/30 bg-[#738b6b]/10 text-[#43533e]" : ""}>
                  {issue.status === "open" ? "Submissions open" : "Coming soon"}
                </Badge>
                <span className="text-sm text-[#746f65]">Releases in {Math.max(0, daysUntil(issue.release_at))} days</span>
              </div>
              <h2 className="font-editorial mt-5 max-w-2xl text-5xl leading-[1.02] sm:text-6xl">{issue.title}</h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-[#625e55]">{issue.introduction}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                {issue.status === "open" ? (
                  <ButtonLink href={`/issues/${issue.id}/respond`}>
                    <PenLine className="h-4 w-4" /> {answered ? "Keep writing" : "Start writing"}
                  </ButtonLink>
                ) : (
                  <GhostLink href="/manage">Shape this letter</GhostLink>
                )}
                <GhostLink href="/manage">Edit questions <ArrowRight className="h-4 w-4" /></GhostLink>
              </div>
            </div>

            <aside className="rounded-3xl border border-black/10 bg-white/35 p-5">
              <p className="eyebrow text-[#746f65]">Your page</p>
              <div className="mt-5 flex items-end gap-2">
                <span className="font-editorial text-5xl">{answered}</span>
                <span className="pb-1 text-[#746f65]">of {total} answered</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/8">
                <div className="h-full rounded-full bg-[#c86b4a]" style={{ width: `${total ? (answered / total) * 100 : 0}%` }} />
              </div>
              <div className="rule mt-6 space-y-4 pt-5 text-sm text-[#625e55]">
                <p className="flex gap-3"><CalendarDays className="h-4 w-4 shrink-0" /> {formatLongDate(issue.release_at, data.group.timezone)}</p>
                <p className="flex gap-3"><Clock3 className="h-4 w-4 shrink-0" /> Edit freely until release</p>
                {issue.submission?.ready_at && <p className="flex gap-3 font-semibold text-[#43533e]"><Check className="h-4 w-4 shrink-0" /> Marked ready</p>}
              </div>
            </aside>
          </div>
        </section>
      ) : (
        <section className="paper-card mt-10 p-10 text-center">
          <span className="text-5xl">✉️</span>
          <h2 className="font-editorial mt-4 text-4xl">The next letter is still a blank page.</h2>
          <p className="mx-auto mt-3 max-w-lg text-[#746f65]">Anyone in the group can start it when inspiration arrives.</p>
          <ButtonLink href="/manage" className="mt-6">Start the next issue</ButtonLink>
        </section>
      )}

      <section className="mt-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-[#746f65]">From the shelf</p>
            <h2 className="font-editorial mt-2 text-4xl sm:text-5xl">Recent letters</h2>
          </div>
          <GhostLink href="/archive" className="hidden sm:inline-flex">View all</GhostLink>
        </div>
        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.recentIssues.map((published) => <IssueCard key={published.id} issue={published} />)}
        </div>
      </section>
    </main>
  );
}
