"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const NAV = [
  { href: "/merchant/dashboard", label: "Dashboard", icon: "◈" },
  { href: "/merchant/products", label: "Products", icon: "⬡" },
  { href: "/merchant/orders", label: "Orders", icon: "📦" },
  { href: "/merchant/subscription", label: "Subscription", icon: "⚡" },
  { href: "/merchant/settings", label: "Settings", icon: "⚙" },
] as const;

function MerchantNav() {
  const pathname = usePathname();
  const [shopDomain, setShopDomain] = useState<string>("");

  // Pull the shop label from the authenticated stats endpoint. The cookie
  // identifies the merchant — there is no `?shop=` in any URL anymore.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/merchant/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { shopDomain?: string } | null) => {
        if (!cancelled && d?.shopDomain) setShopDomain(d.shopDomain);
      })
      .catch(() => {
        // Silent — layout still works without the label.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <nav className="fixed top-0 left-0 h-full w-56 bg-gray-900 border-r border-white/8 flex flex-col z-40">
      <div className="p-5 border-b border-white/8">
        <div className="text-pink-400 font-bold text-lg tracking-tight">Print Studio</div>
        {shopDomain && (
          <div className="text-gray-500 text-xs mt-1 truncate" title={shopDomain}>
            {shopDomain}
          </div>
        )}
      </div>
      <ul className="flex-1 py-4 space-y-1">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors rounded-lg mx-2 ${
                  active
                    ? "bg-pink-500/20 text-pink-300"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{icon}</span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="p-4 border-t border-white/8">
        <a
          href="https://pod.star7gaurav.in"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
        >
          Powered by Print Studio
        </a>
      </div>
    </nav>
  );
}

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Suspense fallback={null}>
        <MerchantNav />
      </Suspense>
      <main className="ml-56 p-8 min-h-screen">
        <Suspense fallback={
          <div className="flex items-center justify-center h-64 text-gray-600">
            <div className="animate-pulse text-sm">Loading…</div>
          </div>
        }>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
