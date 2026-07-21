import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { HeroSettingsForm } from "@/components/admin/hero-settings-form";
import { getHeroSettings } from "@/lib/actions/hero-settings";

export default async function AdminHeroPage() {
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

  const hero = await getHeroSettings();

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Homepage" />
      <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
        <AdminTabs active="/admin/hero" role="admin" />
        <p className="mt-6 max-w-xl text-sm text-[var(--color-ink-muted)]">
          Controls the hero banner on the signed-out homepage — swap the photo and copy for
          tournaments, celebrations, or events without touching any code.
        </p>
        <div className="mt-6">
          <HeroSettingsForm hero={hero} />
        </div>
      </div>
    </div>
  );
}
