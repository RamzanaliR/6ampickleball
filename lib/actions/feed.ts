"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type FeedFormState = { error?: string };

export async function createFeedPost(
  _prevState: FeedFormState,
  formData: FormData
): Promise<FeedFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const content = String(formData.get("content") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();

  if (!content) return { error: "Write something first." };

  const { error } = await supabase.from("community_feed").insert({
    posted_by: user.id,
    content,
    image_url: imageUrl || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/feed");
  redirect("/admin/feed");
}

export async function deleteFeedPost(postId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("community_feed").delete().eq("id", postId);
  if (error) throw new Error(error.message);

  revalidatePath("/feed");
  revalidatePath("/admin/feed");
}
