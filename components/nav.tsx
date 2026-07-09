import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/nav-bar";

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <NavBar user={null} />;
  }

  const { data: player } = await supabase
    .from("players")
    .select("name, status, role")
    .eq("id", user.id)
    .single();

  return (
    <NavBar
      user={
        player
          ? { name: player.name, status: player.status, role: player.role }
          : null
      }
    />
  );
}
