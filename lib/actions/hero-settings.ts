"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdminId } from "@/lib/auth/roles";

export type HeroSettings = {
  heroImageUrl: string;
  heroEyebrow: string;
  heroHeadline: string;
  heroSubtext: string;
  heroButton1Label: string;
  heroButton1Href: string;
  heroButton2Label: string;
  heroButton2Href: string;
};

const defaults: HeroSettings = {
  heroImageUrl: "/hero.jpg",
  heroEyebrow: "6AM Pickleball Club • Dar es Salaam",
  heroHeadline: "When the courts opens\nbefore the city wake up",
  heroSubtext:
    "A Dar es Salaam pickleball family that starts the day together — early mornings, good rallies, and friendships that outlast the session.",
  heroButton1Label: "Request to join",
  heroButton1Href: "/signup",
  heroButton2Label: "See what we're about",
  heroButton2Href: "#events",
};

export async function getHeroSettings(): Promise<HeroSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select(
      "hero_image_url, hero_eyebrow, hero_headline, hero_subtext, hero_button1_label, hero_button1_href, hero_button2_label, hero_button2_href"
    )
    .eq("id", true)
    .maybeSingle();

  if (!data) return defaults;

  return {
    heroImageUrl: data.hero_image_url || defaults.heroImageUrl,
    heroEyebrow: data.hero_eyebrow || defaults.heroEyebrow,
    heroHeadline: data.hero_headline || defaults.heroHeadline,
    heroSubtext: data.hero_subtext || defaults.heroSubtext,
    heroButton1Label: data.hero_button1_label || defaults.heroButton1Label,
    heroButton1Href: data.hero_button1_href || defaults.heroButton1Href,
    heroButton2Label: data.hero_button2_label || defaults.heroButton2Label,
    heroButton2Href: data.hero_button2_href || defaults.heroButton2Href,
  };
}

export type UpdateHeroState = { error?: string; success?: boolean };

export async function updateHeroSettings(
  _prevState: UpdateHeroState,
  formData: FormData
): Promise<UpdateHeroState> {
  const supabase = await createClient();
  let adminId: string;
  try {
    adminId = await requireAdminId(supabase);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not authorized" };
  }

  const heroImageUrl = String(formData.get("hero_image_url") ?? "").trim();
  const heroEyebrow = String(formData.get("hero_eyebrow") ?? "").trim();
  const heroHeadline = String(formData.get("hero_headline") ?? "").trim();
  const heroSubtext = String(formData.get("hero_subtext") ?? "").trim();
  const heroButton1Label = String(formData.get("hero_button1_label") ?? "").trim();
  const heroButton1Href = String(formData.get("hero_button1_href") ?? "").trim();
  const heroButton2Label = String(formData.get("hero_button2_label") ?? "").trim();
  const heroButton2Href = String(formData.get("hero_button2_href") ?? "").trim();

  if (!heroImageUrl || !heroHeadline || !heroButton1Label || !heroButton1Href) {
    return { error: "Image, headline, and the first button need values." };
  }

  const { error } = await supabase
    .from("site_settings")
    .update({
      hero_image_url: heroImageUrl,
      hero_eyebrow: heroEyebrow,
      hero_headline: heroHeadline,
      hero_subtext: heroSubtext,
      hero_button1_label: heroButton1Label,
      hero_button1_href: heroButton1Href,
      hero_button2_label: heroButton2Label,
      hero_button2_href: heroButton2Href,
      updated_at: new Date().toISOString(),
      updated_by: adminId,
    })
    .eq("id", true);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/welcome");
  revalidatePath("/admin/hero");
  return { success: true };
}
