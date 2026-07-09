import type { Metadata } from "next";
import { Big_Shoulders_Display, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";

const bigShoulders = Big_Shoulders_Display({
  variable: "--font-big-shoulders",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Dar Pickleball Club",
  description: "Sessions, standings, and results for the community.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${bigShoulders.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Nav />
        <main className="flex-1">{children}</main>
        <footer className="kitchen-line border-t-0 px-6 py-8 text-sm text-[var(--color-ink-muted)] font-[family-name:var(--font-mono)]">
          Dar Pickleball Club · built for the community
        </footer>
      </body>
    </html>
  );
}
