import type { Metadata } from "next";
import "@fontsource-variable/inter/wght.css";
import "@fontsource-variable/jetbrains-mono/wght.css";
import "@fontsource-variable/big-shoulders-display/wght.css";
import "./globals.css";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "6AM Pickleball Club",
  description: "Sessions, standings, and results for the community.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="kitchen-line border-t-0 px-6 py-8 text-sm text-[var(--color-ink-muted)] font-[family-name:var(--font-mono)]">
          6AM Pickleball Club · built for the community
        </footer>
      </body>
    </html>
  );
}
