import { notFound } from "next/navigation";
import { Badge } from "@/components/ui";
import { IssueReader } from "@/components/issue-reader";
import { formatIssueMonth } from "@/lib/date";
import { getIssue } from "@/lib/data";
import type { PublishedIssue } from "@/lib/types";

export default async function PublishedIssuePage({ params }: { params: Promise<{ issueId: string }> }) {
  const { issueId } = await params;
  const issue = await getIssue(issueId);
  if (issue.status !== "published" || !(issue as PublishedIssue).contributors) notFound();
  const published = issue as PublishedIssue;

  return (
    <main className="pb-16">
      <header className="relative overflow-hidden border-b border-black/10 px-5 py-16 text-center sm:py-24" style={{ backgroundColor: `${published.accent_color}20` }}>
        <div className="absolute inset-0 opacity-[0.07]" style={{ background: `radial-gradient(circle at 50% 30%, ${published.accent_color}, transparent 50%)` }} />
        <div className="relative mx-auto max-w-4xl">
          <span className="text-6xl" aria-hidden="true">{published.cover_emoji}</span>
          <div className="mt-6"><Badge>{formatIssueMonth(published.release_at)}</Badge></div>
          <h1 className="font-editorial text-balance mt-6 text-6xl leading-[0.95] sm:text-8xl">{published.title}</h1>
          <p className="font-editorial mx-auto mt-7 max-w-2xl text-xl leading-8 italic text-[#625e55]">{published.introduction}</p>
          <p className="eyebrow mt-9 text-[#746f65]">{published.contributors.length} friends · private issue</p>
        </div>
      </header>
      <IssueReader issue={published} />
    </main>
  );
}
