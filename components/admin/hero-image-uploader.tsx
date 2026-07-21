"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function HeroImageUploader({ currentUrl }: { currentUrl: string }) {
  const [previewUrl, setPreviewUrl] = useState(currentUrl);
  const [imageUrl, setImageUrl] = useState(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | null) {
    if (!file) return;
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("Too large — 20MB max.");
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);

    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `hero/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("site-media").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    setUploading(false);

    if (uploadError) {
      setError(uploadError.message);
      return;
    }
    const { data } = supabase.storage.from("site-media").getPublicUrl(path);
    setImageUrl(data.publicUrl);
  }

  return (
    <div>
      <input type="hidden" name="hero_image_url" value={imageUrl} />
      <div
        className="relative h-40 w-full overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-paper)]"
        style={{ background: `url('${previewUrl}') center/cover no-repeat` }}
      >
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-medium text-white">
            Uploading…
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="mt-2 rounded-[var(--radius-pill)] border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-court)] hover:text-[var(--color-court)] disabled:opacity-50"
      >
        {uploading ? "Uploading…" : "Replace image"}
      </button>
      {error && <p className="mt-1.5 text-xs text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}
