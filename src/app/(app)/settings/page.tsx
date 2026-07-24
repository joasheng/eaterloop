import { Bell, ImagePlus, LogOut, Mail } from "lucide-react";
import { signOutAction, updateSettingsAction } from "@/app/actions";
import { Avatar, Button } from "@/components/ui";
import { getHomeData } from "@/lib/data";

export const metadata = { title: "Settings" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const { profile } = await getHomeData();

  return (
    <main className="mx-auto max-w-3xl px-5 py-12 lg:py-16">
      <p className="eyebrow text-[#9c4d35]">Your corner</p>
      <h1 className="font-editorial mt-3 text-6xl">Settings</h1>
      <p className="mt-4 text-[#746f65]">A name, a face, and whether the letter should nudge you.</p>

      {params.saved && <p className="mt-7 rounded-2xl border border-[#738b6b]/25 bg-[#738b6b]/10 p-4 text-sm text-[#43533e]">Saved. Looking good.</p>}
      {params.error && <p className="mt-7 rounded-2xl border border-red-900/15 bg-red-900/5 p-4 text-sm text-red-900">That change could not be saved. Check the image type and try again.</p>}

      <form action={updateSettingsAction} className="paper-card mt-8 space-y-8 p-6 sm:p-9">
        <div className="flex items-center gap-5">
          <Avatar name={profile.display_name} url={profile.avatar_url} size="lg" />
          <div>
            <label htmlFor="avatar" className="focus-ring inline-flex cursor-pointer items-center gap-2 rounded-full border border-black/15 px-4 py-2 text-sm font-semibold hover:bg-black/5">
              <ImagePlus className="h-4 w-4" /> Choose photo
            </label>
            <input id="avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" />
            <p className="mt-2 text-xs text-[#746f65]">JPG, PNG, or WebP. Up to 5 MB.</p>
          </div>
        </div>

        <div>
          <label htmlFor="displayName" className="mb-2 block text-sm font-semibold">Display name</label>
          <input id="displayName" name="displayName" defaultValue={profile.display_name} maxLength={80} required className="focus-ring h-12 w-full rounded-2xl border border-black/15 bg-white/45 px-4" />
        </div>

        <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-black/10 bg-white/30 p-4">
          <input name="emailEnabled" type="checkbox" defaultChecked={profile.email_notifications_enabled} className="mt-1 h-4 w-4 accent-[#c86b4a]" />
          <span>
            <span className="flex items-center gap-2 font-semibold"><Bell className="h-4 w-4" /> Email reminders</span>
            <span className="mt-1 block text-sm leading-6 text-[#746f65]">Submission open, one week left, one day left if you are not ready, and issue release.</span>
          </span>
        </label>

        {profile.avatar_path && (
          <label className="flex items-center gap-3 text-sm text-[#625e55]"><input name="removeAvatar" type="checkbox" className="accent-[#c86b4a]" /> Remove my current photo</label>
        )}

        <div className="flex justify-end"><Button type="submit">Save settings</Button></div>
      </form>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-black/10 p-5 text-sm text-[#746f65]"><Mail className="mb-3 h-5 w-5" /> Email addresses are managed in the private five-member bootstrap list.</div>
        <form action={signOutAction} className="flex"><button className="focus-ring flex w-full items-center justify-between rounded-2xl border border-black/10 p-5 text-left text-sm font-semibold hover:bg-black/5">Sign out <LogOut className="h-5 w-5" /></button></form>
      </div>
    </main>
  );
}
