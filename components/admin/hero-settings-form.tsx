"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { FormField } from "@/components/form-field";
import { HeroImageUploader } from "@/components/admin/hero-image-uploader";
import { updateHeroSettings, type UpdateHeroState, type HeroSettings } from "@/lib/actions/hero-settings";

const initialState: UpdateHeroState = {};

function TextArea({
  label,
  name,
  defaultValue,
  rows = 3,
  hint,
}: {
  label: string;
  name: string;
  defaultValue: string;
  rows?: number;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[var(--color-ink)]">{label}</span>
      {hint && <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">{hint}</p>}
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={rows}
        className="mt-1.5 w-full rounded-[var(--radius-input)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3.5 py-2.5 text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-court)]"
      />
    </label>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-[var(--radius-pill)] bg-[var(--color-court)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-court-dark)] disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

export function HeroSettingsForm({ hero }: { hero: HeroSettings }) {
  const [state, formAction] = useActionState(updateHeroSettings, initialState);

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      <label className="block">
        <span className="text-sm font-medium text-[var(--color-ink)]">Hero image</span>
        <div className="mt-1.5">
          <HeroImageUploader currentUrl={hero.heroImageUrl} />
        </div>
      </label>

      <FormField label="Eyebrow" name="hero_eyebrow" defaultValue={hero.heroEyebrow} />

      <TextArea
        label="Headline"
        name="hero_headline"
        defaultValue={hero.heroHeadline}
        rows={2}
        hint="Each line break here becomes a new line on the page."
      />

      <TextArea label="Subtext" name="hero_subtext" defaultValue={hero.heroSubtext} rows={3} />

      <div className="kitchen-line pt-4">
        <p className="text-xs uppercase tracking-widest text-[var(--color-ink-muted)]">
          Primary button
        </p>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Label" name="hero_button1_label" defaultValue={hero.heroButton1Label} required />
          <FormField label="Link" name="hero_button1_href" defaultValue={hero.heroButton1Href} required />
        </div>
      </div>

      <div className="kitchen-line pt-4">
        <p className="text-xs uppercase tracking-widest text-[var(--color-ink-muted)]">
          Secondary button
        </p>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Label" name="hero_button2_label" defaultValue={hero.heroButton2Label} />
          <FormField label="Link" name="hero_button2_href" defaultValue={hero.heroButton2Href} />
        </div>
      </div>

      {state.error && (
        <p className="rounded-[var(--radius-input)] bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-[var(--radius-input)] bg-[var(--color-court)]/10 px-3 py-2 text-sm text-[var(--color-court)]">
          Saved — the homepage is updated.
        </p>
      )}

      <SaveButton />
    </form>
  );
}
