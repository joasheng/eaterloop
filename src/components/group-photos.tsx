/* eslint-disable @next/next/no-img-element -- local photos from /public/group are served directly */
import { PigMark } from "@/components/ui";
import { cn } from "@/lib/utils";

const ROTATIONS = ["-6deg", "5deg", "-3deg", "6deg", "-4deg"];
const PLACEHOLDER_CAPTIONS = ["the cook", "the baker", "the taster", "the picky one", "the pig"];

function Polaroid({ src, caption, rotation }: { src?: string; caption?: string; rotation: string }) {
  return (
    <figure
      className="relative w-36 shrink-0 rounded-[5px] border border-black/10 bg-[#fffdf8] p-2.5 pb-4 shadow-[0_12px_28px_rgba(60,48,34,0.18)] transition hover:-translate-y-1 hover:rotate-0 sm:w-40"
      style={{ transform: `rotate(${rotation})` }}
    >
      <span className="pointer-events-none absolute left-1/2 top-0 h-4 w-16 -translate-x-1/2 -translate-y-1/2 -rotate-3 rounded-[1px] bg-[#e79aa6]/35" aria-hidden="true" />
      <div className="relative aspect-square overflow-hidden rounded-[3px] bg-[#fdeef1]">
        {src ? (
          <img src={src} alt={caption ?? "The group"} className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center"><PigMark className="h-14 w-14 opacity-80" /></span>
        )}
      </div>
      {caption && <figcaption className="font-hand mt-1.5 text-center text-lg text-[#6b6459]">{caption}</figcaption>}
    </figure>
  );
}

// A taped-down fan of polaroids. Real photos win; otherwise cheerful pig placeholders
// keep the layout intentional until someone drops images into /public/group.
export function PolaroidStrip({ photos, className, max = 5 }: { photos: string[]; className?: string; max?: number }) {
  const hasPhotos = photos.length > 0;
  const count = hasPhotos ? Math.min(max, photos.length) : 3;
  const items = Array.from({ length: count }, (_, index) => ({
    src: photos[index],
    caption: hasPhotos ? undefined : PLACEHOLDER_CAPTIONS[index],
    rotation: ROTATIONS[index % ROTATIONS.length],
  }));
  return (
    <div className={cn("flex flex-wrap items-start", className)}>
      {items.map((item, index) => (
        <div key={index} className={cn("relative", index > 0 && "-ml-5 sm:-ml-6")} style={{ zIndex: index }}>
          <Polaroid {...item} />
        </div>
      ))}
    </div>
  );
}

// A wider "everyone at the table" banner for the Home page.
export function TableBanner({ photos }: { photos: string[] }) {
  if (!photos.length) {
    return (
      <div className="paper-card flex flex-col items-center gap-2 border-dashed border-[#c96f7d]/30 p-10 text-center">
        <PigMark className="h-12 w-12" />
        <p className="font-hand text-2xl text-[#c96f7d]">the whole table goes here</p>
        <p className="max-w-sm text-sm leading-6 text-[#736c5f]">
          Drop a few group photos into <code className="rounded bg-black/5 px-1.5 py-0.5 text-[0.8em]">public/group/</code> and they’ll lay themselves out.
        </p>
      </div>
    );
  }
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-4 sm:overflow-visible">
      {photos.slice(0, 4).map((src, index) => (
        <img
          key={src}
          src={src}
          alt="The group"
          className="aspect-[4/5] w-48 shrink-0 rounded-2xl border border-black/10 object-cover shadow-[0_10px_26px_rgba(60,48,34,0.12)] sm:w-full"
          style={{ transform: `rotate(${index % 2 ? 1.4 : -1.4}deg)` }}
        />
      ))}
    </div>
  );
}
