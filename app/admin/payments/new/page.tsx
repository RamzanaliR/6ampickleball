import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { PaymentForm } from "@/components/admin/payment-form";
import { createPayment } from "@/lib/actions/payments";

export default async function NewPaymentPage() {
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

  const [{ data: players }, { data: sessions }] = await Promise.all([
    supabase.from("players").select("id, name").eq("status", "approved").order("name"),
    supabase.from("sessions").select("id, title").order("date_time", { ascending: false }),
  ]);

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Add a charge" />
      <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
        <AdminTabs active="/admin/payments" />
        <div className="mt-6 max-w-lg rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6">
          <PaymentForm action={createPayment} players={players ?? []} sessions={sessions ?? []} />
        </div>
      </div>
    </div>
  );
}
