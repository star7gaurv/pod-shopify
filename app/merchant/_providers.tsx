"use client";

import { AppProvider } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";

/**
 * Polaris context boundary for the embedded merchant app.
 *
 * Every Polaris component reads i18n + theme from this provider, so all
 * merchant pages must render inside it. App Bridge itself needs no React
 * provider in v4 — the CDN script (loaded in the layout) installs
 * `window.shopify`, and the App Bridge React components (`NavMenu`,
 * `TitleBar`, …) are custom elements that upgrade once it's present.
 */
export function MerchantProviders({ children }: { children: React.ReactNode }) {
  return <AppProvider i18n={enTranslations}>{children}</AppProvider>;
}
