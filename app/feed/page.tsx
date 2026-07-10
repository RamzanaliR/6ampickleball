import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { formatSessionDate } from "@/lib/format";

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
        <PageHeader eyebrow="Club feed" title="Feed" />
        <div className="mx-auto mt-8 max-w-3xl px-6 pb-16">
          <EmptyState message="Your account needs admin approval before you can see the feed." />
        </div>
      </div>
    );
  }

  const { data: posts } = await supabase
    .from("community_feed")
    .select("id, content, image_url, created_at, posted_by")
    .order("created_at", { ascending: false });

  const posterIds = [...new Set((posts ?? []).map((p) => p.posted_by))];
  const { data: posters } = posterIds.length
    ? await supabase.from("players").select("id, name").in("id", posterIds)
    : { data: [] as { id: string; name: string }[] };
  const posterNameById = new Map((posters ?? []).map((p) => [p.id, p.name]));

  return (
    <div>
      <PageHeader eyebrow="Club feed" title="What's happening" />
      <div className="mx-auto mt-8 max-w-3xl px-6 pb-16">
        {!posts || posts.length === 0 ? (
          <EmptyState message="No announcements yet." />
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6"
              >
                <p className="whitespace-pre-wrap text-[var(--color-ink)]">{post.content}</p>
                {post.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element -- arbitrary external URL, next/image would need remotePatterns configured per-domain
                  <img
                    src={post.image_url}
                    alt=""
                    className="mt-4 max-h-96 w-full rounded-[var(--radius-input)] object-cover"
                  />
                )}
                <p className="mt-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[var(--color-ink-muted)]">
                  {posterNameById.get(post.posted_by) ?? "Admin"} ·{" "}
                  {formatSessionDate(post.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
