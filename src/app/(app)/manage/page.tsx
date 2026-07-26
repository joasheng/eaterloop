import { Check, Circle, MessageCircle, PenLine, Users } from "lucide-react";
import { Avatar, Badge } from "@/components/ui";
import { IssueComposer } from "@/components/issue-composer";
import { dateInputValue, firstMonday, formatLongDate } from "@/lib/date";
import { getManageData } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { SubmissionState } from "@/lib/types";

export const metadata = { title: "Next letter" };

const STATUS_STYLES: Record<SubmissionState, { label: string; className: string; Icon: typeof Check }> = {
  ready: { label: "Ready", className: "border-[#738b6b]/35 bg-[#738b6b]/12 text-[#43533e]", Icon: Check },
  in_progress: { label: "Writing", className: "border-[#c39a45]/40 bg-[#c39a45]/15 text-[#7a5713]", Icon: PenLine },
  not_started: { label: "Not started", className: "border-black/10 bg-black/[0.04] text-[#746f65]", Icon: Circle },
};

export default async function ManagePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const [data, params] = await Promise.all([getManageData(), searchParams]);
  const scheduled = data.upcomingIssues.find((issue) => issue.status === "scheduled");
  const open = data.upcomingIssues.find((issue) => issue.status === "open");
  const followingRelease = scheduled
    ? (() => {
        const current = new Date(scheduled.release_at);
        return dateInputValue(firstMonday(current.getUTCFullYear(), current.getUTCMonth() + 1));
      })()
    : undefined;

  return (
    <main className="mx-auto max-w-5xl px-5 py-12 lg:px-10 lg:py-16">
      <div className="grid gap-8 lg:grid-cols-[1fr_18rem] lg:items-end">
        <div>
          <p className="eyebrow text-[#9c4d35]">Shared controls</p>
          <h1 className="font-editorial mt-3 text-6xl sm:text-7xl">Shape the next letter.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#746f65]">No admin here. Anyone at the table can choose the date, tune the questions, or start the following month.</p>
        </div>
        <aside className="rounded-3xl border border-black/10 bg-white/30 p-5">
          <p className="flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4" /> The five</p>
          <div className="mt-4 flex -space-x-2">{data.members.map((member) => <Avatar key={member.id} name={member.display_name} url={member.avatar_url} />)}</div>
          <p className="mt-4 text-xs leading-5 text-[#746f65]">All members have the same controls. Answers stay private regardless.</p>
        </aside>
      </div>

      {(params.created || params.updated) && <p className="mt-8 rounded-2xl border border-[#738b6b]/25 bg-[#738b6b]/10 p-4 text-sm text-[#43533e]"><Check className="mr-2 inline h-4 w-4" /> The schedule is saved.</p>}
      {params.error && <p className="mt-8 rounded-2xl border border-red-900/15 bg-red-900/5 p-4 text-sm text-red-900">That issue could not be saved. A release may already exist for that date.</p>}

      {open && (
        <section className="mt-10 rounded-3xl border border-black/10 bg-[#dfe5d8] p-6 sm:flex sm:items-center sm:justify-between">
          <div><Badge className="bg-white/35">Open now</Badge><h2 className="font-editorial mt-3 text-3xl">{open.title}</h2><p className="mt-2 text-sm text-[#596451]">Releases {formatLongDate(open.release_at, data.group.timezone)}. Questions are fixed once writing begins.</p></div>
          <a href={`/issues/${open.id}/respond`} className="focus-ring mt-5 inline-flex items-center gap-2 rounded-full bg-[#292720] px-5 py-3 text-sm font-semibold text-white sm:mt-0"><MessageCircle className="h-4 w-4" /> Write yours</a>
        </section>
      )}

      {data.openIssue && data.memberStatuses.length > 0 && (
        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow text-[#746f65]">Where everyone’s at</p>
              <h2 className="font-editorial mt-2 text-3xl sm:text-4xl">“{data.openIssue.title}” progress</h2>
            </div>
            <p className="text-sm font-semibold text-[#746f65]">
              {data.memberStatuses.filter((member) => member.state === "ready").length} of {data.memberStatuses.length} ready
            </p>
          </div>
          <div className="paper-card divide-y divide-black/8 overflow-hidden">
            {data.memberStatuses.map((member) => {
              const status = STATUS_STYLES[member.state];
              const percent = member.total ? Math.round((member.answered / member.total) * 100) : 0;
              return (
                <div key={member.profile.id} className="flex items-center gap-4 p-4 sm:px-6 sm:py-5">
                  <Avatar name={member.profile.display_name} url={member.profile.avatar_url} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate font-semibold">{member.profile.display_name}</span>
                      <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em]", status.className)}>
                        <status.Icon className="h-3.5 w-3.5" /> {status.label}
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/8">
                        <div className="h-full rounded-full bg-[#c86b4a] transition-all" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-[#746f65]">{member.answered}/{member.total}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs leading-5 text-[#746f65]">Only progress is shared here—everyone’s answers stay private until release day.</p>
        </section>
      )}

      <section className="mt-12">
        <div className="mb-6 flex items-center gap-3"><Circle className="h-3 w-3 fill-[#c86b4a] text-[#c86b4a]" /><h2 className="font-editorial text-4xl">{scheduled ? "Upcoming issue" : "Start an issue"}</h2></div>
        <IssueComposer issue={scheduled} />
      </section>

      {scheduled && (
        <section className="mt-14">
          <div className="mb-6 flex items-center gap-3"><Circle className="h-3 w-3 text-[#746f65]" /><h2 className="font-editorial text-4xl">Schedule another month</h2></div>
          <IssueComposer defaultReleaseDate={followingRelease} />
        </section>
      )}
    </main>
  );
}
