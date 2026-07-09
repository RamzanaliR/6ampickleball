"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthCard, FormField } from "@/components/auth-card";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <AuthCard title="Almost there" subtitle="One more step.">
        <p className="text-sm text-[var(--color-ink)]">
          Check <span className="font-medium">{email}</span> for a confirmation
          link. Once confirmed, an admin still needs to approve your account
          before you can RSVP to sessions.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Join the club" subtitle="Create an account — an admin will review it.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Full name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
        <FormField
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <FormField
          label="Password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
        {error && (
          <p className="rounded-[var(--radius-input)] bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger)]">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-[var(--radius-pill)] bg-[var(--color-court)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)] disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-[var(--color-ink-muted)]">
        Already a member?{" "}
        <Link href="/login" className="font-medium text-[var(--color-court)]">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
