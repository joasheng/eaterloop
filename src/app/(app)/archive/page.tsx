import { IssueCard } from "@/components/issue-card";
import { getPublishedIssues } from "@/lib/data";

export const metadata = { title: "Archive" };

export default async function ArchivePage() {
  const issues = await getPublishedIssues();
  return (
    <main className="mx-auto max-w-6xl px-5 py-12 lg:px-10 lg:py-16">
      <p className="eyebrow text-[#9c4d35]">Private archive</p>
      <h1 className="font-editorial mt-3 text-6xl sm:text-7xl">The months, kept.</h1>
      <p className="mt-5 max-w-xl text-lg leading-8 text-[#746f65]">A shelf of ordinary days that became worth remembering because someone wrote them down.</p>
      {issues.length ? (
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {issues.map((issue) => <IssueCard key={issue.id} issue={issue} />)}
        </div>
      ) : (
        <div className="paper-card mt-12 p-10 text-center text-[#746f65]">The first issue will appear here on release day.</div>
      )}
    </main>
  );
}
