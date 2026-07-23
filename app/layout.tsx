import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter/wght.css";
import "@fontsource-variable/jetbrains-mono/wght.css";
import "@fontsource-variable/big-shoulders-display/wght.css";
import "./globals.css";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  metadataBase: new URL("https://6ampickleball.vercel.app"),
  title: "6AM Pickleball Club",
  description: "Sessions, standings, and results for the community.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "6AM Pickleball",
  },
};

export const viewport: Viewport = {
  themeColor: "#1f6f5c",
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">
        <div className="print:hidden">
          <Nav />
        </div>
        <main className="flex-1">{children}</main>
        {modal}
        <footer className="kitchen-line border-t-0 px-6 py-8 text-sm text-[var(--color-ink-muted)] font-[family-name:var(--font-mono)] print:hidden">
          6AM Pickleball Club · built for the community
        </footer>
      </body>
    </html>
  );
}
