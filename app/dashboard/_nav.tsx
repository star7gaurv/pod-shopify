"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/billing", label: "Billing" },
];

export function DashboardNav({ shopDomain }: { shopDomain?: string }) {
  const pathname = usePathname();
  return (
    <header className="border-b border-white/10 bg-gray-900/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <span className="text-pink-400 font-bold tracking-tight">Print Studio</span>
          <nav className="flex items-center gap-1">
            {NAV.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    active
                      ? "bg-pink-500/20 text-pink-300"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {shopDomain && (
            <span className="text-xs text-gray-500 hidden sm:block truncate max-w-[200px]">
              {shopDomain}
            </span>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/dashboard/login" })}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
