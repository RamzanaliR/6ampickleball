import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { AddMemberForm } from "@/components/admin/add-member-form";

export default async function AddMemberPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("players")
    .select("role")
    .eq("id", user.id)
    .single();

  if (me?.role !== "admin") redirect("/dashboard");

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Add a member"
        subtitle="Creates their account directly — they skip the approval queue."
      />
      <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
        <AdminTabs active="/admin/players" />
        <div className="mt-6 max-w-lg rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6">
          <AddMemberForm />
        </div>
      </div>
    </div>
  );
}
