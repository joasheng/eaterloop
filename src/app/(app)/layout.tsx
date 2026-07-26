import { AppHeader } from "@/components/app-header";
import { PigMark } from "@/components/ui";
import { getHomeData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getHomeData();
  return (
    <div className="min-h-screen">
      <AppHeader profile={profile} />
      {children}
      <footer className="mx-auto mt-24 flex max-w-6xl items-center gap-3 border-t border-black/10 px-5 py-8 text-sm text-[#746f65] lg:px-10">
        <PigMark className="h-6 w-6 shrink-0" />
        <span>A private letter for the people already at the table.</span>
        <span className="font-hand ml-auto text-lg text-[#c96f7d]">made with full mouths 🐷</span>
      </footer>
    </div>
  );
}
