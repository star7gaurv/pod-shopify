"use client";

import { NavMenu } from "@shopify/app-bridge-react";

/**
 * Embedded-app chrome.
 *
 * `NavMenu` renders into Shopify admin's own left navigation (it becomes a
 * `<ui-nav-menu>` custom element that the App Bridge CDN script upgrades).
 * The first link with `rel="home"` is the app root. Links are plain `<a>`
 * tags on purpose — Shopify intercepts them and drives navigation, so we
 * must NOT use next/link here.
 *
 * Anything analytical or financial lives in the external dashboard, reached
 * from Home / Settings via a one-time-token link — never inline in the
 * embedded app. So the nav is intentionally tiny: Home, Products, Settings.
 */
export function MerchantChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavMenu>
        <a href="/merchant" rel="home">
          Home
        </a>
        <a href="/merchant/products">Products</a>
        <a href="/merchant/settings">Settings</a>
      </NavMenu>
      {children}
    </>
  );
}
