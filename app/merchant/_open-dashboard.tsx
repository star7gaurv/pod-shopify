"use client";

import { useState } from "react";
import { Button } from "@shopify/polaris";

/**
 * Opens the external merchant dashboard in a new tab.
 *
 * Strategy: open a blank tab synchronously inside the click handler (so popup
 * blockers see a direct user gesture), then navigate it once we have the
 * one-time hand-off URL.
 *
 * We intentionally omit the "noopener,noreferrer" feature string on the blank
 * open — those flags revoke the opener's script access to the returned handle,
 * making `tab.location.href = url` throw a SecurityError in Firefox/Safari.
 * The opened page is our own origin (`/dashboard/**`) so keeping the opener
 * reference is safe. `noopener` would only matter if we were opening an
 * untrusted third-party URL, which we are not.
 */
export function OpenDashboardButton({
  variant = "primary",
  children = "Open full dashboard",
  to,
}: {
  variant?: "primary" | "secondary" | "tertiary";
  children?: string;
  /** Optional deep-link inside the dashboard, e.g. "/dashboard/billing". */
  to?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function open() {
    setLoading(true);
    setError(false);
    // Open blank tab synchronously — popup blockers accept this because it
    // happens synchronously inside a user-gesture handler.
    const tab = window.open("", "_blank");
    try {
      const qs = to ? `?to=${encodeURIComponent(to)}` : "";
      const res = await fetch(`/api/merchant/dashboard-link${qs}`);
      if (!res.ok) {
        tab?.close();
        setError(true);
        return;
      }
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        if (tab) {
          tab.location.href = data.url;
        } else {
          // Popup was blocked — fall back to same-tab navigation.
          window.location.href = data.url;
        }
      } else {
        tab?.close();
        setError(true);
      }
    } catch {
      tab?.close();
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant={variant} loading={loading} onClick={open} external>
      {error ? "Couldn't open — try again" : children}
    </Button>
  );
}
