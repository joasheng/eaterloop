/* eslint-disable @next/next/no-img-element -- signed and local blob URLs are intentionally rendered directly */
import type { ButtonHTMLAttributes, HTMLAttributes } from "react";
import Link from "next/link";
import { cn, initials } from "@/lib/utils";

export function Button({ className, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cn(
        "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#292720] px-5 py-2.5 text-sm font-semibold text-[#fbf8f1] transition hover:-translate-y-0.5 hover:bg-[#15140f] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function ButtonLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#292720] px-5 py-2.5 text-sm font-semibold text-[#fbf8f1] transition hover:-translate-y-0.5 hover:bg-[#15140f]",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function GhostLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-black/15 px-4 py-2 text-sm font-semibold transition hover:bg-black/5",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Avatar({ name, url, size = "md" }: { name: string; url?: string | null; size?: "sm" | "md" | "lg" }) {
  const dimensions = size === "lg" ? "h-16 w-16 text-lg" : size === "sm" ? "h-8 w-8 text-[10px]" : "h-11 w-11 text-xs";
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-full border border-black/10 bg-[#e0d3bc] font-bold tracking-widest",
        dimensions,
      )}
      aria-label={name}
    >
      {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : initials(name)}
    </div>
  );
}

export function Badge({ children, className }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-black/10 bg-white/45 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.13em]",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function PigMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path d="M12.5 14 L9 5.5 L19.5 11 Z" fill="#e79aa6" stroke="#2a2620" strokeWidth="2" strokeLinejoin="round" />
      <path d="M35.5 14 L39 5.5 L28.5 11 Z" fill="#e79aa6" stroke="#2a2620" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="24" cy="26" r="15" fill="#e79aa6" stroke="#2a2620" strokeWidth="2" />
      <ellipse cx="24" cy="29.5" rx="8" ry="5.8" fill="#f4bcc4" stroke="#2a2620" strokeWidth="2" />
      <circle cx="21" cy="29.5" r="1.35" fill="#2a2620" />
      <circle cx="27" cy="29.5" r="1.35" fill="#2a2620" />
      <circle cx="18.4" cy="20.6" r="1.7" fill="#2a2620" />
      <circle cx="29.6" cy="20.6" r="1.7" fill="#2a2620" />
    </svg>
  );
}

const DOODLE_PATHS: Record<string, React.ReactNode> = {
  utensils: (
    <>
      <path d="M8 4v7a3 3 0 0 0 6 0V4M11 4v16" />
      <path d="M20 4c-2 0-3 3-3 6s1 4 3 4 3-1 3-4-1-6-3-6ZM20 14v6" />
    </>
  ),
  noodle: (
    <>
      <path d="M4 8c4-4 8 4 12 0s8-4 8-4" />
      <path d="M4 14c4-4 8 4 12 0s8-4 8-4" />
      <path d="M9 14v6M15 14v6" />
    </>
  ),
  sparkle: <path d="M12 3c1 5 3 7 8 8-5 1-7 3-8 8-1-5-3-7-8-8 5-1 7-3 8-8Z" />,
};

export function FoodDoodle({ name, className }: { name: keyof typeof DOODLE_PATHS; className?: string }) {
  return (
    <svg viewBox="0 0 28 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {DOODLE_PATHS[name]}
    </svg>
  );
}

export function BrandMark({ className }: { className?: string }) {
  return (
    <Link href="/home" className={cn("focus-ring group inline-flex items-center gap-2.5 rounded-md", className)} aria-label="Eaterloop home">
      <span className="grid h-10 w-10 rotate-[-6deg] place-items-center rounded-[46%_54%_50%_50%] border border-[#2a2620]/12 bg-[#fdeef1] shadow-sm transition group-hover:rotate-[0deg]">
        <PigMark className="h-7 w-7" />
      </span>
      <span className="font-editorial text-2xl lowercase tracking-tight">eaterloop</span>
    </Link>
  );
}
