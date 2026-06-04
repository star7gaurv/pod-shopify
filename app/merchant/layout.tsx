import "@shopify/polaris/build/esm/styles.css";
import { MerchantProviders } from "./_providers";
import { MerchantChrome } from "./_chrome";

/**
 * Layout for the embedded Shopify-admin app.
 *
 * Loads — scoped to `/merchant/**` only, so the public storefront and
 * `/studio` never pay the Polaris/App-Bridge cost:
 *   1. The `shopify-api-key` meta tag (App Bridge reads it to identify the app).
 *   2. Shopify's App Bridge CDN script. Rendered from this server component so
 *      it lands in the initial HTML and executes during parse — before any
 *      merchant page fires its first `fetch` in a client effect. App Bridge
 *      then auto-attaches `Authorization: Bearer <session token>` to those
 *      fetches, which `middleware.ts` already verifies.
 *   3. Polaris CSS + AppProvider so the UI looks native to Shopify admin.
 *
 * No `async`/`defer` on the script — Shopify requires it to run synchronously
 * so it can patch network calls before the app uses them.
 */
export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const apiKey = process.env.SHOPIFY_API_KEY ?? "";

  return (
    <>
      <meta name="shopify-api-key" content={apiKey} />
      {/*
        `async` is required for React 19 to hoist this script to <head>.
        Without it, React renders a bare <script> into the body stream at the
        component's DOM position — after hydration — and App Bridge wouldn't
        patch fetch() before the first merchant useEffect fires. With `async`,
        React 19 deduplicates and hoists it to <head> so it loads in parallel
        with page parsing and is ready before client effects run.
      */}
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script async src="https://cdn.shopify.com/shopifycloud/app-bridge.js" />
      <MerchantProviders>
        <MerchantChrome>{children}</MerchantChrome>
      </MerchantProviders>
    </>
  );
}
