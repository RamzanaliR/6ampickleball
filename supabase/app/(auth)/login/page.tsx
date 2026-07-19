"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthCard, FormField } from "@/components/auth-card";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push(searchParams.get("next") ?? "/dashboard");
    router.refresh();
  }

  return (
    <AuthCard title="Sign in" subtitle="Welcome back — let's see what's on this week.">
      <form onSubmit={handleSubmit} className="space-y-4">
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
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
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
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-[var(--color-ink-muted)]">
        New here?{" "}
        <Link href="/signup" className="font-medium text-[var(--color-court)]">
          Request to join
        </Link>
      </p>
    </AuthCard>
  );
}
