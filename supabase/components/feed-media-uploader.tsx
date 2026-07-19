"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { FeedMediaItem } from "@/lib/types";

type UploadItem = FeedMediaItem & { id: string; previewUrl: string; uploading: boolean; error?: string };

const MAX_FILES = 10;
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB, matches the storage bucket cap

export function FeedMediaUploader({ userId }: { userId: string }) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const supabase = createClient();
    const files = Array.from(fileList).slice(0, MAX_FILES - items.length);

    const newItems: UploadItem[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      url: "",
      type: file.type.startsWith("video") ? "video" : "image",
      previewUrl: URL.createObjectURL(file),
      uploading: true,
    }));
    setItems((prev) => [...prev, ...newItems]);

    await Promise.all(
      files.map(async (file, i) => {
        const item = newItems[i];
        if (file.size > MAX_SIZE_BYTES) {
          setItems((prev) =>
            prev.map((it) => (it.id === item.id ? { ...it, uploading: false, error: "Too large (50MB max)" } : it))
          );
          return;
        }
        const ext = file.name.split(".").pop() ?? "bin";
        const path = `${userId}/${item.id}.${ext}`;
        const { error } = await supabase.storage.from("feed-media").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (error) {
          setItems((prev) =>
            prev.map((it) => (it.id === item.id ? { ...it, uploading: false, error: error.message } : it))
          );
          return;
        }
        const { data } = supabase.storage.from("feed-media").getPublicUrl(path);
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, uploading: false, url: data.publicUrl } : it))
        );
      })
    );
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  const mediaJson = JSON.stringify(
    items.filter((it) => it.url && !it.error).map(({ url, type }) => ({ url, type }))
  );

  return (
    <div>
      <input type="hidden" name="media" value={mediaJson} />

      {items.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {items.map((it) => (
            <div
              key={it.id}
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper)]"
            >
              {it.type === "video" ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video src={it.previewUrl} className="h-full w-full object-cover" muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.previewUrl} alt="" className="h-full w-full object-cover" />
              )}
              {it.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-medium text-white">
                  …
                </div>
              )}
              {it.error && (
                <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-danger)]/80 p-1 text-center text-[9px] font-medium text-white">
                  {it.error}
                </div>
              )}
              <button
                type="button"
                onClick={() => removeItem(it.id)}
                aria-label="Remove"
                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={items.length >= MAX_FILES}
        className="rounded-[var(--radius-pill)] border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-court)] hover:text-[var(--color-court)] disabled:opacity-50"
      >
        + Add photos / videos
      </button>
    </div>
  );
}
