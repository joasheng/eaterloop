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

export function BrandMark() {
  return (
    <Link href="/home" className="focus-ring inline-flex items-center gap-3 rounded-md" aria-label="Eaterloop home">
      <span className="grid h-9 w-9 rotate-[-5deg] place-items-center rounded-[42%_58%_53%_47%] bg-[#c86b4a] text-lg text-white shadow-sm">e</span>
      <span className="font-editorial text-2xl">eaterloop</span>
    </Link>
  );
}
