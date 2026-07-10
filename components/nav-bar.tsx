"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type NavUser = {
  name: string;
  status: "pending" | "approved" | "rejected";
  role: "player" | "admin";
} | null;

const baseLinks = [
  { href: "/sessions", label: "Sessions" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/tournaments", label: "Tournaments" },
  { href: "/feed", label: "Feed" },
];

export function NavBar({ user }: { user: NavUser }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    ...baseLinks,
    ...(user?.role === "admin" ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="kitchen-line sticky top-0 z-40 bg-[var(--color-paper)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <Image
            src="/logo.png"
            alt="6AM Pickleball Club"
            width={40}
            height={40}
            className="h-10 w-10"
            priority
          />
          <span className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-wide text-[var(--color-ink)]">
            6AM Pickleball Club
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {user &&
            links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-court)]"
              >
                {link.label}
              </Link>
            ))}
          {user ? (
            <button
              onClick={handleSignOut}
              className="rounded-[var(--radius-pill)] border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-court)] hover:text-[var(--color-court)]"
            >
              Sign out
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-court)]"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)]"
              >
                Join the club
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile toggle */}
        <button
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span
            className={`h-0.5 w-6 bg-[var(--color-ink)] transition-transform ${open ? "translate-y-2 rotate-45" : ""}`}
          />
          <span
            className={`h-0.5 w-6 bg-[var(--color-ink)] transition-opacity ${open ? "opacity-0" : ""}`}
          />
          <span
            className={`h-0.5 w-6 bg-[var(--color-ink)] transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="kitchen-line flex flex-col gap-1 px-6 pb-6 md:hidden">
          {user ? (
            <>
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="py-3 text-base font-medium text-[var(--color-ink)]"
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={handleSignOut}
                className="py-3 text-left text-base font-medium text-[var(--color-danger)]"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="py-3 text-base font-medium text-[var(--color-ink)]"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="py-3 text-base font-semibold text-[var(--color-court)]"
              >
                Join the club
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
