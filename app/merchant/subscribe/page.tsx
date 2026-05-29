"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

type Plan = {
  key: string;
  name: string;
  price: string;
  features: string[];
  highlight?: boolean;
};

const PLANS: Plan[] = [
  {
    key: "starter",
    name: "Starter",
    price: "₹999/month",
    features: [
      "Up to 5 products with design studio",
      "3D preview for customers",
      "Printful / Printrove integration",
      "Order management dashboard",
      "Email support",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: "₹2,499/month",
    features: [
      "Unlimited products",
      "White-label studio (remove branding)",
      "Bulk / team ordering (roster upload)",
      "Priority fulfillment routing",
      "Priority support + onboarding call",
    ],
    highlight: true,
  },
];

export default function SubscribePage() {
  const searchParams = useSearchParams();
  const shop = searchParams.get("shop") ?? "";
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe(planKey: string) {
    setLoading(planKey);
    setError(null);

    try {
      const res = await fetch("/api/billing/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop, plan: planKey }),
      });

      const data = (await res.json()) as { subscriptionId?: string; razorpayKey?: string; error?: string };

      if (!res.ok || !data.subscriptionId) {
        throw new Error(data.error ?? "Failed to create subscription");
      }

      // Load Razorpay checkout script
      if (!document.querySelector('script[src*="checkout.razorpay.com"]')) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = () => resolve();
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzCheckout = new (window as any).Razorpay({
        key: data.razorpayKey,
        subscription_id: data.subscriptionId,
        name: "Print Studio",
        description: `${planKey.charAt(0).toUpperCase() + planKey.slice(1)} Plan — 14-day free trial`,
        theme: { color: "#EE0979" },
        handler: () => {
          window.location.href = `/merchant/dashboard?shop=${shop}`;
        },
      });

      rzCheckout.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">Choose Your Plan</h1>
          <p className="text-gray-400 text-lg">
            14-day free trial — no credit card required to start.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-center">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {PLANS.map((plan: Plan) => (
            <div
              key={plan.key}
              className={`rounded-2xl p-8 border ${
                plan.highlight
                  ? "border-pink-500 bg-gray-900 shadow-lg shadow-pink-500/20"
                  : "border-gray-700 bg-gray-900"
              }`}
            >
              {plan.highlight && (
                <div className="text-xs font-semibold text-pink-400 uppercase tracking-wider mb-2">
                  Most Popular
                </div>
              )}
              <h2 className="text-2xl font-bold mb-1">{plan.name}</h2>
              <div className="text-3xl font-bold text-pink-400 mb-6">{plan.price}</div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-gray-300">
                    <span className="text-green-400 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan.key)}
                disabled={loading !== null}
                className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                  plan.highlight
                    ? "bg-pink-500 hover:bg-pink-600 text-white"
                    : "bg-gray-700 hover:bg-gray-600 text-white"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading === plan.key ? "Processing..." : `Start Free Trial — ${plan.name}`}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-500 text-sm mt-8">
          Cancel anytime. UPI, cards, and netbanking accepted via Razorpay.
        </p>
      </div>
    </div>
  );
}
