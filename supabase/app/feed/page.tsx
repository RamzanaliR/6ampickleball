import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { FeedAddPostButton } from "@/components/feed-add-post-button";
import { FeedGalleryList, type FeedListPost } from "@/components/feed-post-card";
import { formatSessionDate, displayName } from "@/lib/format";
import type { FeedMediaItem } from "@/lib/types";

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: player } = await supabase
    .from("players")
    .select("status")
    .eq("id", user.id)
    .single();

  if (player?.status !== "approved") {
    return (
      <div>
        <PageHeader eyebrow="The Club" title="The Club" />
        <div className="mx-auto mt-8 max-w-3xl px-6 pb-16">
          <EmptyState message="Your account needs admin approval before you can see The Club." />
        </div>
      </div>
    );
  }

  // RLS already limits this to approved posts (everyone's) plus the
  // caller's own posts regardless of status — no extra filtering needed.
  const { data: posts } = await supabase
    .from("community_feed")
    .select("id, content, image_url, media, status, created_at, posted_by")
    .order("created_at", { ascending: false });

  const posterIds = [...new Set((posts ?? []).map((p) => p.posted_by))];
  const { data: posters } = posterIds.length
    ? await supabase.from("players").select("id, name, nickname").in("id", posterIds)
    : { data: [] as { id: string; name: string }[] };
  const posterNameById = new Map((posters ?? []).map((p) => [p.id, displayName(p)]));

  const listPosts: FeedListPost[] = (posts ?? []).map((post) => {
    const media: FeedMediaItem[] =
      Array.isArray(post.media) && post.media.length > 0
        ? (post.media as FeedMediaItem[])
        : post.image_url
          ? [{ url: post.image_url, type: "image" }]
          : [];
    return {
      id: post.id,
      content: post.content,
      media,
      posterName: posterNameById.get(post.posted_by) ?? "Unknown",
      createdAtLabel: formatSessionDate(post.created_at),
      statusLabel: post.status === "approved" ? null : (post.status as "pending" | "rejected"),
    };
  });

  return (
    <div>
      <PageHeader eyebrow="The Club" title="The Club" />
      <div className="mx-auto mt-8 max-w-5xl px-6 pb-16">
        <div className="mb-6 flex justify-end">
          <FeedAddPostButton userId={user.id} />
        </div>

        {listPosts.length === 0 ? (
          <EmptyState message="No announcements yet — be the first to post." />
        ) : (
          <FeedGalleryList posts={listPosts} />
        )}
      </div>
    </div>
  );
}
