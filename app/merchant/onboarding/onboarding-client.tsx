"use client";

import { useState } from "react";
import Link from "next/link";

type Props = {
  hasSubscription: boolean;
  shopDomain: string;
};

export function OnboardingClient({ hasSubscription, shopDomain }: Props) {
  const [active, setActive] = useState<"connect" | "theme" | "subscribe">(
    hasSubscription ? "connect" : "subscribe",
  );

  return (
    <div className="space-y-3">
      <StepCard
        title="Connect a product"
        description="Map one Shopify product to a print template so the studio knows what to render."
        open={active === "connect"}
        onToggle={() => setActive("connect")}
      >
        <p className="text-gray-400 text-sm">
          Open the products page, pick any Shopify product, and choose a template. You can repeat
          this for every product you want to sell as print-on-demand.
        </p>
        <Link
          href="/merchant/products"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-pink-500 hover:bg-pink-600 px-4 py-2 text-sm font-semibold transition-colors"
        >
          Open product mapping →
        </Link>
      </StepCard>

      <StepCard
        title="Add the Design Studio block to your theme"
        description="Lets customers customize the product right on the product page."
        open={active === "theme"}
        onToggle={() => setActive("theme")}
      >
        <ol className="text-gray-400 text-sm space-y-2 list-decimal list-inside">
          <li>
            Open your{" "}
            <a
              href={`https://${shopDomain}/admin/themes`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-400 hover:underline"
            >
              Shopify theme editor
            </a>
            .
          </li>
          <li>Click <strong className="text-white">Customize</strong> on your active theme.</li>
          <li>Navigate to a Product page template.</li>
          <li>
            Click <strong className="text-white">Add block</strong> → choose{" "}
            <strong className="text-white">Design Studio</strong>.
          </li>
          <li>Save the theme.</li>
        </ol>
      </StepCard>

      <StepCard
        title="Start your 14-day free trial"
        description="No charge today. Cancel anytime from the Subscription page."
        open={active === "subscribe"}
        onToggle={() => setActive("subscribe")}
      >
        {hasSubscription ? (
          <p className="text-green-400 text-sm flex items-center gap-2">
            <span>✓</span> Your trial is already active.
          </p>
        ) : (
          <>
            <p className="text-gray-400 text-sm">
              Pick a plan to unlock the studio for your customers. Your shop stays on the free tier
              until the trial converts to a paid month.
            </p>
            <Link
              href="/merchant/subscribe"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-pink-500 hover:bg-pink-600 px-4 py-2 text-sm font-semibold transition-colors"
            >
              Choose a plan →
            </Link>
          </>
        )}
      </StepCard>
    </div>
  );
}

function StepCard({
  title,
  description,
  open,
  onToggle,
  children,
}: {
  title: string;
  description: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border bg-gray-900 transition-colors ${
        open ? "border-pink-500/50" : "border-white/8 hover:border-white/15"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-6 py-5 flex items-start justify-between gap-4"
      >
        <div>
          <p className="font-semibold text-white">{title}</p>
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>
        <span className={`text-pink-400 transition-transform ${open ? "rotate-90" : ""}`}>
          ›
        </span>
      </button>
      {open && <div className="px-6 pb-6 -mt-2">{children}</div>}
    </div>
  );
}
