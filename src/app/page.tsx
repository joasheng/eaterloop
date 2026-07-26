import { redirect } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { PolaroidStrip } from "@/components/group-photos";
import { BrandMark, ButtonLink, FoodDoodle, PigMark } from "@/components/ui";
import { getViewer } from "@/lib/data";
import { isDemoMode } from "@/lib/env";
import { getGroupPhotos } from "@/lib/photos";

export default async function SignInPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const viewer = await getViewer();
  if (viewer && !isDemoMode) redirect("/home");
  const photos = getGroupPhotos();

  return (
    <main className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-5 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
      <FoodDoodle name="noodle" className="pointer-events-none absolute left-[35%] top-[8%] hidden h-9 w-12 text-[#6f8a5f]/45 lg:block" />
      <FoodDoodle name="utensils" className="pointer-events-none absolute left-[47%] top-[40%] hidden h-11 w-11 rotate-6 text-[#d19a3f]/45 lg:block" />
      <FoodDoodle name="sparkle" className="pointer-events-none absolute bottom-[24%] left-[41%] hidden h-7 w-7 text-[#e79aa6]/70 lg:block" />

      <section className="max-w-2xl rise-in">
        <BrandMark />
        <p className="kitchen-note mt-16">table for five, always 🐷</p>
        <p className="eyebrow mt-3 text-[#c96f7d]">A private letter from the EATING chat</p>
        <h1 className="font-editorial text-balance mt-4 text-6xl leading-[0.95] sm:text-7xl lg:text-[5.6rem]">
          Keep the{" "}
          <span className="relative inline-block">
            <span className="relative z-10">ordinary</span>
            <span className="absolute inset-x-[-4px] bottom-2 z-0 h-4 -rotate-1 rounded-sm bg-[#e79aa6]/40 sm:h-5" aria-hidden="true" />
          </span>{" "}
          parts.
        </h1>
        <p className="mt-7 max-w-xl text-lg leading-8 text-[#5f594e]">
          One letter a month, just for us—the small moments, the current obsessions, the meals worth mentioning, and the photos that would otherwise rot in a camera roll.
        </p>
        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-[#5f594e]">
          <span className="inline-flex items-center gap-2">🔒 Private until release day</span>
          <span className="inline-flex items-center gap-2">✉️ Gentle nudges, never nags</span>
          <span className="inline-flex items-center gap-2">🐷 Only the five of us</span>
        </div>
        <PolaroidStrip photos={photos} className="mt-14" />
      </section>

      <section className="paper-card rise-in relative overflow-hidden p-6 sm:p-9" style={{ animationDelay: "120ms" }}>
        <span className="pointer-events-none absolute -right-6 -top-6 grid h-24 w-24 rotate-12 place-items-center rounded-full bg-[#fdeef1] opacity-70" aria-hidden="true">
          <PigMark className="h-12 w-12" />
        </span>
        <p className="eyebrow text-[#8a8375]">Pull up a chair</p>
        <h2 className="font-editorial mt-3 text-4xl">Your seat’s still warm.</h2>
        <p className="mb-7 mt-3 leading-7 text-[#736c5f]">No passwords—just a private link sent to the email on the table.</p>
        {params.error === "magic-link" && (
          <p className="mb-5 rounded-2xl border border-red-900/15 bg-red-900/5 p-4 text-sm leading-6 text-red-900">
            That sign-in link is invalid or expired. Request a fresh one below.
          </p>
        )}
        {isDemoMode ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-dashed border-[#c96f7d]/35 bg-[#fdeef1]/60 p-4 text-sm leading-6 text-[#6b6459]">
              Preview mode is on. Connect Supabase to send real magic links and keep everyone’s answers private.
            </div>
            <ButtonLink href="/home" className="w-full">
              Come on in <ArrowUpRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        ) : (
          <AuthForm />
        )}
      </section>
    </main>
  );
}
