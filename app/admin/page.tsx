import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: player } = await supabase
    .from("players")
    .select("role")
    .eq("id", user.id)
    .single();

  if (player?.role !== "admin") redirect("/dashboard");

  const { count: pendingCount } = await supabase
    .from("players")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Club control room"
        subtitle="Player approvals, session management, and payment tracking arrive in Phase 3."
      />
      <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
        <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6">
          <p className="text-xs uppercase tracking-widest text-[var(--color-ink-muted)]">
            Pending approvals
          </p>
          <p className="mt-1 font-[family-name:var(--font-mono)] text-4xl font-semibold text-[var(--color-ink)]">
            {pendingCount ?? 0}
          </p>
        </div>
      </div>
    </div>
  );
}
