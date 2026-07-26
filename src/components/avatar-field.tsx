"use client";

import { useEffect, useState } from "react";
import { ImagePlus } from "lucide-react";
import { Avatar } from "@/components/ui";

// Shows the current avatar and swaps in a live preview the moment a file is chosen,
// so members see their new profile photo before saving.
export function AvatarField({ name, url }: { name: string; url?: string | null }) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  return (
    <div className="flex items-center gap-5">
      <Avatar name={name} url={preview ?? url} size="lg" />
      <div>
        <label htmlFor="avatar" className="focus-ring inline-flex cursor-pointer items-center gap-2 rounded-full border border-black/15 px-4 py-2 text-sm font-semibold hover:bg-black/5">
          <ImagePlus className="h-4 w-4" /> {preview || url ? "Change photo" : "Choose photo"}
        </label>
        <input id="avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onPick} />
        <p className="mt-2 text-xs text-[#746f65]">
          {preview ? "Looking good—save to keep it." : "JPG, PNG, or WebP. Up to 5 MB."}
        </p>
      </div>
    </div>
  );
}
