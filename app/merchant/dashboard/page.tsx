"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Stats = {
  totalOrders: number;
  pendingOrders: number;
  monthOrders: number;
  monthRevenue: string;
  totalDesigns: number;
  plan: string;
  subscription: {
    status: string;
    currentPeriodEnd?: string;
    trialEndsAt?: string;
  } | null;
};

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-gray-900 border border-white/8 rounded-2xl p-6">
      <p className="text-gray-500 text-xs uppercase tracking-widest font-mono">{label}</p>
      <p className="text-3xl font-black text-white mt-2">{value}</p>
      {sub && <p className="text-gray-500 text-sm mt-1">{sub}</p>}
    </div>
  );
}

export default function MerchantDashboard() {
  const searchParams = useSearchParams();
  const shop = searchParams.get("shop") ?? "";
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shop) return;
    fetch(`/api/merchant/stats?shop=${shop}`)
      .then((r) => r.json())
      .then((d: Stats) => setStats(d))
      .finally(() => setLoading(false));
  }, [shop]);

  const planBadge = stats?.plan === "pro"
    ? "bg-purple-500/20 text-purple-300"
    : stats?.plan === "starter"
    ? "bg-blue-500/20 text-blue-300"
    : "bg-gray-700/50 text-gray-400";

  const trialEnd = stats?.subscription?.trialEndsAt
    ? new Date(stats.subscription.trialEndsAt).toLocaleDateString()
    : null;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">{shop}</p>
        </div>
        {stats && (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${planBadge}`}>
            {stats.plan} plan
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-900 border border-white/8 rounded-2xl p-6 animate-pulse h-28" />
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Orders" value={stats.totalOrders} />
            <StatCard label="Pending" value={stats.pendingOrders} sub="need fulfillment" />
            <StatCard label="This Month" value={stats.monthOrders} sub="orders" />
            <StatCard label="Revenue (MTD)" value={`₹${stats.monthRevenue}`} />
          </div>

          {/* Trial / subscription notice */}
          {trialEnd && stats.subscription?.status !== "active" && (
            <div className="mb-6 p-4 bg-amber-900/30 border border-amber-600/40 rounded-xl text-amber-300 text-sm flex items-center justify-between">
              <span>Free trial ends on {trialEnd}. Add a payment method to keep your store running.</span>
              <Link
                href={`/merchant/subscription?shop=${shop}`}
                className="ml-4 px-3 py-1 bg-amber-500 text-black font-semibold rounded-lg text-xs whitespace-nowrap"
              >
                Upgrade Now
              </Link>
            </div>
          )}

          {/* Quick actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href={`/merchant/products?shop=${shop}`}
              className="bg-gray-900 border border-white/8 rounded-2xl p-5 hover:border-pink-500/40 transition-colors group"
            >
              <div className="text-2xl mb-2">⬡</div>
              <p className="font-semibold text-white group-hover:text-pink-300 transition-colors">
                Connect Products
              </p>
              <p className="text-gray-500 text-sm mt-1">Link Shopify products to print templates</p>
            </Link>
            <Link
              href={`/merchant/orders?shop=${shop}`}
              className="bg-gray-900 border border-white/8 rounded-2xl p-5 hover:border-pink-500/40 transition-colors group"
            >
              <div className="text-2xl mb-2">📦</div>
              <p className="font-semibold text-white group-hover:text-pink-300 transition-colors">
                View Orders
              </p>
              <p className="text-gray-500 text-sm mt-1">
                {stats.pendingOrders} pending • {stats.totalDesigns} designs saved
              </p>
            </Link>
            <a
              href={`/studio`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-900 border border-white/8 rounded-2xl p-5 hover:border-pink-500/40 transition-colors group"
            >
              <div className="text-2xl mb-2">🎨</div>
              <p className="font-semibold text-white group-hover:text-pink-300 transition-colors">
                Open Design Studio
              </p>
              <p className="text-gray-500 text-sm mt-1">Preview how customers see the 3D studio</p>
            </a>
          </div>
        </>
      ) : (
        <p className="text-gray-500">Could not load dashboard stats.</p>
      )}
    </div>
  );
}
