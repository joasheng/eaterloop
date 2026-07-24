import { notFound, redirect } from "next/navigation";
import { ResponseEditor } from "@/components/response-editor";
import { getIssue, requireViewer } from "@/lib/data";
import type { PublishedIssue } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RespondPage({ params }: { params: Promise<{ issueId: string }> }) {
  const { issueId } = await params;
  const [issue, viewer] = await Promise.all([getIssue(issueId), requireViewer()]);
  if ((issue as PublishedIssue).contributors) redirect(`/issues/${issue.id}`);
  if (issue.status !== "open") notFound();
  return <ResponseEditor issue={issue} viewerId={viewer.id} />;
}
