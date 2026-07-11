import { MarketingHome } from "@/components/marketing/marketing-home";

// Always renders the one-page marketing site, regardless of auth state.
// This is where the logo points for signed-in users (root "/" redirects
// them to /dashboard instead), so they can still get back to it.
export default function WelcomePage() {
  return <MarketingHome />;
}
