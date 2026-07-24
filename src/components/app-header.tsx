import { Archive, Feather, Home, Settings } from "lucide-react";
import { Avatar, BrandMark } from "@/components/ui";
import type { Profile } from "@/lib/types";

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/archive", label: "Archive", icon: Archive },
  { href: "/manage", label: "Next letter", icon: Feather },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppHeader({ profile }: { profile: Profile }) {
  return (
    <header className="border-b border-black/10 bg-[#f4efe4]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-5 px-5 py-4 lg:px-10">
        <BrandMark />
        <nav aria-label="Main navigation" className="hide-scrollbar flex items-center gap-1 overflow-x-auto">
          {navItems.map(({ href, label, icon: Icon }) => (
            <a key={href} href={href} className="focus-ring inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-semibold text-[#625e55] hover:bg-black/5 hover:text-[#25231f]">
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </a>
          ))}
          <a href="/settings" className="focus-ring ml-1 rounded-full">
            <Avatar name={profile.display_name} url={profile.avatar_url} size="sm" />
          </a>
        </nav>
      </div>
    </header>
  );
}
