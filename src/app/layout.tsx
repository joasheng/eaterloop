import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: { default: "Eaterloop", template: "%s · Eaterloop" },
  description: "A private monthly letter shared between friends.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
