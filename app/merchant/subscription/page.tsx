"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type SubInfo = {
  plan: string;
  subscription: {
    status: string;
    currentPeriodEnd?: string;
    trialEndsAt?: string;
    razorpaySubId?: string;
  } | null;
};

type Plan = {
  key: string;
  name: string;
  price: string;
  priceNum: number;
  features: readonly string[];
  highlight?: boolean;
};

const PLANS: Plan[] = [
  {
    key: "starter",
    name: "Starter",
    price: "₹999/month",
    priceNum: 999,
    features: [
      "Up to 5 products with design studio",
      "Real-time 3D preview for customers",
      "Printful + Printrove auto-fulfillment",
      "Order management dashboard",
      "Email support",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: "₹2,499/month",
    priceNum: 2499,
    features: [
      "Unlimited products",
      "White-label studio (remove branding)",
      "Bulk / team ordering (roster upload)",
      "Priority fulfillment routing",
      "Design sharing links",
      "Priority support",
    ],
    highlight: true,
  },
];

export default function MerchantSubscription() {
  const searchParams = useSearchParams();
  const shop = searchParams.get("shop") ?? "";
  const [info, setInfo] = useState<SubInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shop) return;
    fetch(`/api/merchant/stats?shop=${shop}`)
      .then((r) => r.json())
      .then((d: SubInfo) => setInfo(d))
      .finally(() => setLoading(false));
  }, [shop]);

  async function handleSubscribe(planKey: string) {
    setSubscribing(planKey);
    setError(null);
    try {
      const res = await fetch("/api/billing/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shop, plan: planKey }),
      });
      const data = (await res.json()) as { subscriptionId?: string; razorpayKey?: string; error?: string };
      if (!res.ok || !data.subscriptionId) throw new Error(data.error ?? "Failed");

      // Dynamically load Razorpay
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve();
        script.onerror = reject;
        document.head.appendChild(script);
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzCheckout = new (window as any).Razorpay({
        key: data.razorpayKey,
        subscription_id: data.subscriptionId,
        name: "Print Studio",
        description: `${planKey} Plan — 14-day free trial`,
        theme: { color: "#EE0979" },
        handler: () => {
          setInfo((prev) => prev ? { ...prev, plan: planKey, subscription: { status: "active" } } : prev);
        },
      });
      rzCheckout.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubscribing(null);
    }
  }

  if (loading) {
    return <div className="h-32 bg-gray-900 border border-white/8 rounded-2xl animate-pulse" />;
  }

  const currentPlan = info?.plan ?? "free";
  const sub = info?.subscription;
  const trialEnd = sub?.trialEndsAt ? new Date(sub.trialEndsAt).toLocaleDateString() : null;
  const periodEnd = sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : null;

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black">Subscription</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your Print Studio plan</p>
      </div>

      {/* Current status */}
      <div className="bg-gray-900 border border-white/8 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Current Plan</p>
            <p className="text-2xl font-black text-white capitalize mt-1">{currentPlan}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">Status</p>
            <p className={`font-semibold mt-1 ${sub?.status === "active" ? "text-green-400" : "text-yellow-400"}`}>
              {sub?.status ?? "inactive"}
            </p>
          </div>
        </div>
        {trialEnd && sub?.status !== "active" && (
          <p className="text-amber-400 text-sm mt-3">Trial ends: {trialEnd}</p>
        )}
        {periodEnd && (
          <p className="text-gray-500 text-sm mt-3">Next renewal: {periodEnd}</p>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/40 border border-red-700/50 rounded-xl text-red-300 text-sm">{error}</div>
      )}

      {/* Plan cards */}
      <div className="grid md:grid-cols-2 gap-5">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.key;
          return (
            <div
              key={plan.key}
              className={`rounded-2xl p-7 border ${
                plan.highlight
                  ? "border-pink-500 bg-gray-900"
                  : "border-white/8 bg-gray-900"
              } ${isCurrent ? "ring-2 ring-green-500/50" : ""}`}
            >
              {plan.highlight && (
                <div className="text-xs font-semibold text-pink-400 uppercase tracking-wider mb-2">
                  Most Popular
                </div>
              )}
              {isCurrent && (
                <div className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2">
                  Current Plan
                </div>
              )}
              <h2 className="text-xl font-black">{plan.name}</h2>
              <div className="text-2xl font-black text-pink-400 mb-5 mt-1">{plan.price}</div>
              <ul className="space-y-2 mb-7">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-gray-300 text-sm">
                    <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => !isCurrent && handleSubscribe(plan.key)}
                disabled={subscribing !== null || isCurrent}
                className={`w-full py-3 px-5 rounded-xl font-semibold transition-all text-sm ${
                  isCurrent
                    ? "bg-gray-700 text-gray-400 cursor-default"
                    : plan.highlight
                    ? "bg-pink-500 hover:bg-pink-600 text-white"
                    : "bg-gray-700 hover:bg-gray-600 text-white"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isCurrent
                  ? "Current Plan"
                  : subscribing === plan.key
                  ? "Processing…"
                  : `Switch to ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-center text-gray-600 text-sm mt-6">
        Payments via Razorpay · UPI, cards, netbanking · Cancel anytime
      </p>
    </div>
  );
}
