import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { AdminTabs } from "@/components/admin/admin-tabs";
import { EmptyState } from "@/components/empty-state";
import { FeedPostForm } from "@/components/admin/feed-post-form";
import { FeedPostRow } from "@/components/admin/feed-post-row";
import { FeedModerationRow } from "@/components/admin/feed-moderation-row";
import { createFeedPostAdmin } from "@/lib/actions/feed";
import { formatSessionDate } from "@/lib/format";

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

  if (me?.role !== "admin") redirect("/dashboard");

  const [{ data: pending }, { data: posts }] = await Promise.all([
    supabase
      .from("community_feed")
      .select("id, content, image_url, posted_by, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase
      .from("community_feed")
      .select("id, content, image_url, created_at")
      .eq("status", "approved")
      .order("created_at", { ascending: false }),
  ]);

  const posterIds = [...new Set((pending ?? []).map((p) => p.posted_by))];
  const { data: posters } = posterIds.length
    ? await supabase.from("players").select("id, name").in("id", posterIds)
    : { data: [] as { id: string; name: string }[] };
  const posterNameById = new Map((posters ?? []).map((p) => [p.id, p.name]));

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Club feed" />
      <div className="mx-auto mt-8 max-w-6xl px-6 pb-16">
        <AdminTabs active="/admin/feed" />

        {pending && pending.length > 0 && (
          <section className="mt-6">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
              Pending review ({pending.length})
            </h2>
            <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] px-6">
              {pending.map((post) => (
                <FeedModerationRow
                  key={post.id}
                  postId={post.id}
                  posterName={posterNameById.get(post.posted_by) ?? "Unknown"}
                  content={post.content}
                  imageUrl={post.image_url}
                />
              ))}
            </div>
          </section>
        )}

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <section>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
              New post
            </h2>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
              Posted by you goes live immediately — no review needed.
            </p>
            <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6">
              <FeedPostForm action={createFeedPostAdmin} />
            </div>
          </section>
          <section>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight text-[var(--color-ink)]">
              Published
            </h2>
            <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] px-6">
              {!posts || posts.length === 0 ? (
                <div className="py-10">
                  <EmptyState message="Nothing posted yet." />
                </div>
              ) : (
                posts.map((post) => (
                  <FeedPostRow
                    key={post.id}
                    postId={post.id}
                    content={post.content}
                    imageUrl={post.image_url}
                    createdAtLabel={formatSessionDate(post.created_at)}
                  />
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
