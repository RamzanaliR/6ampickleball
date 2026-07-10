"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: player } = await supabase
    .from("players")
    .select("role")
    .eq("id", user.id)
    .single();

  if (player?.role !== "admin") throw new Error("Admins only");
}

export type AddMemberFormState = {
  error?: string;
  created?: { name: string; email: string; password: string };
};

function generateTempPassword(length = 10) {
  // Excludes visually ambiguous characters (0/O, 1/l/I) since this gets
  // read off a screen and typed in by hand.
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let password = "";
  for (let i = 0; i < length; i++) {
    password += alphabet[bytes[i] % alphabet.length];
  }
  return password;
}

export async function addMember(
  _prevState: AddMemberFormState,
  formData: FormData
): Promise<AddMemberFormState> {
  const supabase = await createClient();
  try {
    await requireAdmin(supabase);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized" };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!name) return { error: "Enter a name." };
  if (!email || !email.includes("@")) return { error: "Enter a valid email." };

  const password = generateTempPassword();
  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (createError || !created.user) {
    const message = createError?.message ?? "Couldn't create the account.";
    return {
      error: message.toLowerCase().includes("already been registered")
        ? "Someone with that email already has an account."
        : message,
    };
  }

  // Skip the pending-approval queue — the admin adding this person
  // directly is the approval.
  const { error: approveError } = await admin
    .from("players")
    .update({ status: "approved" })
    .eq("id", created.user.id);

  if (approveError) {
    return { error: `Account created, but approval failed: ${approveError.message}` };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/players");
  revalidatePath("/leaderboard");

  return { created: { name, email, password } };
}

export async function approvePlayer(playerId: string) {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const { error } = await supabase
    .from("players")
    .update({ status: "approved" })
    .eq("id", playerId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath("/admin/players");
  revalidatePath("/leaderboard");
}

export async function rejectPlayer(playerId: string) {
  const supabase = await createClient();
  await requireAdmin(supabase);

  const { error } = await supabase
    .from("players")
    .update({ status: "rejected" })
    .eq("id", playerId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin");
  revalidatePath("/admin/players");
}
