import { redirect } from "next/navigation";
import { ArrowUpRight, LockKeyhole, Mail } from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { BrandMark, ButtonLink } from "@/components/ui";
import { getViewer } from "@/lib/data";
import { isDemoMode } from "@/lib/env";

export default async function SignInPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const viewer = await getViewer();
  if (viewer && !isDemoMode) redirect("/home");

  return (
    <main className="mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-5 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
      <section className="max-w-2xl rise-in">
        <BrandMark />
        <p className="eyebrow mt-20 text-[#9c4d35]">Five friends · one letter a month</p>
        <h1 className="font-editorial text-balance mt-5 text-6xl leading-[0.96] sm:text-7xl lg:text-[5.7rem]">
          Keep the ordinary parts.
        </h1>
        <p className="mt-7 max-w-xl text-lg leading-8 text-[#625e55]">
          A private monthly letter shared between friends—small moments, current obsessions, and the photos that would otherwise stay in the camera roll.
        </p>
        <div className="mt-10 flex flex-wrap gap-5 text-sm text-[#625e55]">
          <span className="inline-flex items-center gap-2"><LockKeyhole className="h-4 w-4" /> Private until release day</span>
          <span className="inline-flex items-center gap-2"><Mail className="h-4 w-4" /> Gentle email reminders</span>
        </div>
      </section>

      <section className="paper-card rise-in p-6 sm:p-9" style={{ animationDelay: "120ms" }}>
        <p className="eyebrow text-[#746f65]">Come on in</p>
        <h2 className="font-editorial mt-3 text-4xl">Your place is saved.</h2>
        <p className="mb-7 mt-3 leading-7 text-[#746f65]">No passwords. We’ll send a private link to the email on our list.</p>
        {params.error === "magic-link" && (
          <p className="mb-5 rounded-2xl border border-red-900/15 bg-red-900/5 p-4 text-sm leading-6 text-red-900">
            That sign-in link is invalid or expired. Request a fresh one below.
          </p>
        )}
        {isDemoMode ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-dashed border-black/20 bg-[#efe6d6] p-4 text-sm leading-6 text-[#625e55]">
              Local preview mode is active. Connect Supabase to enable real magic links and private data.
            </div>
            <ButtonLink href="/home" className="w-full">
              Enter the preview <ArrowUpRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        ) : (
          <AuthForm />
        )}
      </section>
    </main>
  );
}
