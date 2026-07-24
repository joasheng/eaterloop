import { AppHeader } from "@/components/app-header";
import { getHomeData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getHomeData();
  return (
    <div className="min-h-screen">
      <AppHeader profile={profile} />
      {children}
      <footer className="mx-auto mt-24 max-w-6xl border-t border-black/10 px-5 py-8 text-sm text-[#746f65] lg:px-10">
        A private letter for the people already at the table.
      </footer>
    </div>
  );
}
