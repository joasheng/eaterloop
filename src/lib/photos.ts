import { readdirSync } from "node:fs";
import { join } from "node:path";
import { cache } from "react";

const IMAGE_RE = /\.(jpe?g|png|webp|gif|avif)$/i;

function readGroupDir(): string[] {
  try {
    const dir = join(process.cwd(), "public", "group");
    return readdirSync(dir).filter((file) => IMAGE_RE.test(file) && !file.startsWith("."));
  } catch {
    return [];
  }
}

// Lists group photos dropped into /public/group so the UI fills in automatically.
// Returns web paths ("/group/foo.jpg"); empty when the folder is missing or bare.
export const getGroupPhotos = cache((): string[] =>
  readGroupDir()
    .sort()
    .map((file) => `/group/${file}`),
);

// Maps a lowercased member name to a photo path when a file is named after them
// (e.g. group/Maya.jpg -> { maya: "/group/Maya.jpg" }). Lets preview mode show
// real faces as avatars, mirroring how uploaded profile photos appear in production.
export const getGroupAvatarMap = cache((): Record<string, string> => {
  const map: Record<string, string> = {};
  for (const file of readGroupDir()) {
    const base = file.replace(IMAGE_RE, "").toLowerCase();
    if (!(base in map)) map[base] = `/group/${file}`;
  }
  return map;
});
