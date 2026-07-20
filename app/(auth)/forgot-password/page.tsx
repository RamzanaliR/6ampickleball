"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthCard, FormField } from "@/components/auth-card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <AuthCard title="Check your email" subtitle="">
        <p className="text-[var(--color-ink)]">
          If <span className="font-medium">{email}</span> has an account, a reset link is on its
          way. Open it on this device to set a new password.
        </p>
        <p className="mt-4 text-sm text-[var(--color-ink-muted)]">
          Didn&apos;t get it after a few minutes? Ask an admin — they can reset your password
          directly without needing email.
        </p>
        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="font-medium text-[var(--color-court)]">
            Back to sign in
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Forgot password" subtitle="We'll email you a link to set a new one.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
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
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-[var(--color-ink-muted)]">
        <Link href="/login" className="font-medium text-[var(--color-court)]">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
