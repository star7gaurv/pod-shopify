"use client";

import Link from "next/link";
import { useState } from "react";

type AdminOrderActionsProps = {
  orderId: string;
  designPath: string;
};

export function AdminOrderActions({
  orderId,
  designPath,
}: AdminOrderActionsProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  const handleCopyLink = async () => {
    try {
      const absoluteUrl = `${window.location.origin}${designPath}`;
      await navigator.clipboard.writeText(absoluteUrl);
      setCopyState("copied");
    } catch (error) {
      console.error("Failed to copy design link.", error);
      setCopyState("error");
    } finally {
      window.setTimeout(() => {
        setCopyState("idle");
      }, 1800);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/admin/orders/${orderId}`}
        className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/4 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/7"
      >
        View Details
      </Link>
      <Link
        href={designPath}
        className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/4 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/7"
      >
        Open Saved Design
      </Link>
      <button
        type="button"
        onClick={() => {
          void handleCopyLink();
        }}
        className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/4 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/7"
      >
        {copyState === "copied"
          ? "Copied"
          : copyState === "error"
            ? "Copy Failed"
            : "Copy Design Link"}
      </button>
    </div>
  );
}
