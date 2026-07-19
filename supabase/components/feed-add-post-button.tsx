"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { FeedComposeForm } from "@/components/feed-compose-form";

export function FeedAddPostButton({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-[var(--radius-pill)] bg-[var(--color-court)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)]"
      >
        + Add new post
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="New post">
        <FeedComposeForm
          userId={userId}
          onPosted={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </Modal>
    </>
  );
}
