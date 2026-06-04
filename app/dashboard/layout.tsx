import { auth } from "@/lib/auth";
import { DashboardNav } from "./_nav";

/**
 * External merchant dashboard layout. Lives outside the Shopify iframe with
 * its own dark theme. The nav only renders for an authenticated merchant, so
 * the bare login page (no session yet) isn't wrapped in chrome.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isMerchant = session?.user?.kind === "merchant";

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {isMerchant && <DashboardNav shopDomain={session?.user?.shopDomain} />}
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
