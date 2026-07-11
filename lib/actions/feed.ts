"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type FeedFormState = { error?: string; success?: boolean };

async function insertFeedPost(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" } as const;

  const { data: me } = await supabase
    .from("players")
    .select("role, status")
    .eq("id", user.id)
    .single();
  if (me?.status !== "approved") return { error: "Your account needs approval first." } as const;

  const content = String(formData.get("content") ?? "").trim();
  const mediaRaw = String(formData.get("media") ?? "[]");
  let media: { url: string; type: "image" | "video" }[] = [];
  try {
    const parsed = JSON.parse(mediaRaw);
    if (Array.isArray(parsed)) {
      media = parsed
        .filter(
          (m) =>
            m &&
            typeof m.url === "string" &&
            (m.type === "image" || m.type === "video")
        )
        .slice(0, 10);
    }
  } catch {
    // ignore malformed media payloads — post still goes through text-only
  }
  if (!content) return { error: "Write something first." } as const;

  const isAdmin = me.role === "admin";

  const { error } = await supabase.from("community_feed").insert({
    posted_by: user.id,
    content,
    media,
    status: isAdmin ? "approved" : "pending",
  });

  if (error) return { error: error.message } as const;
  return { success: true } as const;
}

/** Admin's direct-post form on /admin/feed — publishes immediately, redirects back. */
export async function createFeedPostAdmin(
  _prevState: FeedFormState,
  formData: FormData
): Promise<FeedFormState> {
  const result = await insertFeedPost(formData);
  if ("error" in result) return result;
  revalidatePath("/feed");
  redirect("/admin/feed");
}

/** Any approved player's compose form on /feed — stays on the page, may go to pending. */
export async function createFeedPostPlayer(
  _prevState: FeedFormState,
  formData: FormData
): Promise<FeedFormState> {
  const result = await insertFeedPost(formData);
  if ("error" in result) return result;
  revalidatePath("/feed");
  revalidatePath("/admin/feed");
  return { success: true };
}

export async function deleteFeedPost(postId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("community_feed").delete().eq("id", postId);
  if (error) throw new Error(error.message);

  revalidatePath("/feed");
  revalidatePath("/admin/feed");
}

export async function moderateFeedPost(postId: string, status: "approved" | "rejected") {
  const supabase = await createClient();
  const { error } = await supabase.from("community_feed").update({ status }).eq("id", postId);
  if (error) throw new Error(error.message);

  revalidatePath("/feed");
  revalidatePath("/admin/feed");
}
