import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthCard } from "@/components/auth-card";
import { ChangePasswordForm } from "@/components/change-password-form";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // No active session means the reset link is missing, expired, or
  // already used — send them back to request a fresh one.
  if (!user) redirect("/forgot-password");

  return (
    <AuthCard title="Set a new password" subtitle="Choose something you'll remember.">
      <ChangePasswordForm />
      <p className="mt-6 text-center text-sm text-[var(--color-ink-muted)]">
        Once updated,{" "}
        <a href="/dashboard" className="font-medium text-[var(--color-court)]">
          head to your dashboard
        </a>
        .
      </p>
    </AuthCard>
  );
}
