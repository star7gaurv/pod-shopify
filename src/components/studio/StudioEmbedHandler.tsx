"use client";

import { useEffect } from "react";
import { useStudioStore } from "@/store/studioStore";

/**
 * When the studio is rendered inside a Shopify product-page iframe (?embed=1),
 * intercepts design saves and posts the design ID back to the parent window
 * instead of showing the standalone order modal.
 */
export function StudioEmbedHandler() {
  const currentDesign = useStudioStore((state) => state.currentDesign);
  const saveCurrentDesign = useStudioStore((state) => state.saveCurrentDesign);

  const isEmbed =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("embed") === "1";

  useEffect(() => {
    if (!isEmbed) return;

    // Add a "Save Design & Apply" button to the DOM when in embed mode.
    // This is done outside React to avoid touching the complex RightPanel.
    const btn = document.createElement("button");
    btn.id = "pod-embed-save-btn";
    btn.textContent = "✓ Save Design & Apply to Product";
    Object.assign(btn.style, {
      position: "fixed",
      bottom: "24px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: "9999",
      padding: "14px 28px",
      background: "linear-gradient(135deg, #EE0979 0%, #FF6B6B 100%)",
      color: "#fff",
      fontSize: "15px",
      fontWeight: "700",
      border: "none",
      borderRadius: "12px",
      cursor: "pointer",
      boxShadow: "0 8px 30px rgba(238,9,121,0.4)",
      whiteSpace: "nowrap",
    });

    btn.addEventListener("click", async () => {
      btn.textContent = "Saving…";
      btn.setAttribute("disabled", "true");

      try {
        const design = await saveCurrentDesign();
        if (!design) {
          btn.textContent = "✓ Save Design & Apply to Product";
          btn.removeAttribute("disabled");
          return;
        }

        // Notify the parent Shopify storefront
        window.parent.postMessage(
          { type: "pod:design-saved", designId: design.id },
          "*",
        );

        btn.textContent = "✓ Applied!";
      } catch {
        btn.textContent = "✓ Save Design & Apply to Product";
        btn.removeAttribute("disabled");
      }
    });

    document.body.appendChild(btn);
    return () => btn.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmbed]);

  // Hide the standalone "Place Order" button in embed mode
  useEffect(() => {
    if (!isEmbed) return;
    const style = document.createElement("style");
    style.id = "pod-embed-overrides";
    style.textContent = `
      [data-tour="order-panel"] { display: none !important; }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, [isEmbed]);

  return null;
}
