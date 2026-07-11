import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MarketingHome } from "@/components/marketing/marketing-home";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Signed-in visitors land on their dashboard, not the marketing site.
  if (user) redirect("/dashboard");

  return <MarketingHome />;
}
