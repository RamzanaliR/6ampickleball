import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { EmptyState } from "@/components/empty-state";
import { FeedModerationRow } from "@/components/admin/feed-moderation-row";
import { formatSessionDate, displayName } from "@/lib/format";
import type { FeedMediaItem } from "@/lib/types";

export default async function AdminFeedPage() {
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

  if (me?.role !== "admin" && me?.role !== "manager") redirect("/dashboard");

  const { data: pending } = await supabase
    .from("community_feed")
    .select("id, content, image_url, media, posted_by, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const posterIds = [...new Set((pending ?? []).map((p) => p.posted_by))];
  const { data: posters } = posterIds.length
    ? await supabase.from("players").select("id, name, nickname").in("id", posterIds)
    : { data: [] as { id: string; name: string }[] };
  const posterNameById = new Map((posters ?? []).map((p) => [p.id, displayName(p)]));

  return (
    <div>
      <PageHeader eyebrow="Admin" title="The Club — review queue" />
      <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
        <AdminTabs active="/admin/feed" role={me?.role === "manager" ? "manager" : "admin"} />

        <div className="mt-6">
          {!pending || pending.length === 0 ? (
            <EmptyState message="Nothing waiting on review." />
          ) : (
            <div className="space-y-3">
              {pending.map((post) => {
                const media: FeedMediaItem[] =
                  Array.isArray(post.media) && post.media.length > 0
                    ? (post.media as FeedMediaItem[])
                    : post.image_url
                      ? [{ url: post.image_url, type: "image" as const }]
                      : [];
                return (
                  <FeedModerationRow
                    key={post.id}
                    postId={post.id}
                    posterName={posterNameById.get(post.posted_by) ?? "Unknown"}
                    content={post.content}
                    media={media}
                    createdAtLabel={formatSessionDate(post.created_at)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
