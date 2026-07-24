import { ArrowUpRight, Users } from "lucide-react";
import { formatIssueMonth } from "@/lib/date";
import type { PublishedIssue } from "@/lib/types";

export function IssueCard({ issue }: { issue: PublishedIssue }) {
  return (
    <a
      href={`/issues/${issue.id}`}
      className="focus-ring group relative flex min-h-72 flex-col overflow-hidden rounded-[1.6rem] border border-black/10 p-6 shadow-[0_15px_40px_rgba(50,40,25,.06)] transition hover:-translate-y-1"
      style={{ backgroundColor: `${issue.accent_color}18` }}
    >
      <div className="flex items-start justify-between">
        <span className="text-4xl" aria-hidden="true">{issue.cover_emoji}</span>
        <ArrowUpRight className="h-5 w-5 transition group-hover:translate-x-1 group-hover:-translate-y-1" />
      </div>
      <div className="mt-auto">
        <p className="eyebrow text-[#746f65]">{formatIssueMonth(issue.release_at)}</p>
        <h3 className="font-editorial mt-2 text-3xl leading-tight">{issue.title}</h3>
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-[#625e55]"><Users className="h-4 w-4" /> {issue.contributors.length} voices</p>
      </div>
    </a>
  );
}
