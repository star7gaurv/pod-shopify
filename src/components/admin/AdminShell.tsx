import type { ReactNode } from "react";
import { signOut } from "@/lib/auth";
import { PendingNavLink } from "@/components/layout/PendingNavLink";

type AdminShellProps = {
  title: string;
  description: string;
  currentPath: string;
  userLabel?: string | null;
  actions?: ReactNode;
  children: ReactNode;
};

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/templates", label: "Templates" },
  { href: "/admin/catalog-items", label: "Catalog Items" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/designs", label: "Designs" },
];

export function AdminShell({
  title,
  description,
  currentPath,
  userLabel,
  actions,
  children,
}: AdminShellProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),rgba(2,6,23,0.96)_48%)] px-4 py-8 lg:px-6">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(8,17,28,0.98),rgba(4,10,17,0.98))] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.38)] lg:p-6">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/55">
            Admin Panel
          </p>
          <div className="mt-5 grid gap-2">
            {navItems.map((item) => {
              const isActive = currentPath === item.href;

              return (
                <PendingNavLink
                  key={item.href}
                  href={item.href}
                  className={[
                    "rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                    isActive
                      ? "border-[var(--accent)]/60 bg-[rgba(255,74,61,0.18)] text-white"
                      : "border-white/8 bg-white/3 text-white/76 hover:border-white/18 hover:bg-white/6",
                  ].join(" ")}
                >
                  {item.label}
                </PendingNavLink>
              );
            })}
          </div>

          <div className="mt-8 rounded-2xl border border-white/8 bg-white/3 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">
              Signed in
            </p>
            <p className="mt-2 text-sm text-white/78">
              {userLabel ?? "Admin"}
            </p>
          </div>

          <form
            className="mt-4"
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}
          >
            <button
              type="submit"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/10 bg-white/4 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/7"
            >
              Sign Out
            </button>
          </form>
        </aside>

        <section className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(8,17,28,0.98),rgba(4,10,17,0.98))] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.38)] lg:p-8">
          <div className="flex flex-col gap-4 border-b border-white/8 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/55">
                Admin Workspace
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white">
                {title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/62">
                {description}
              </p>
            </div>
            {actions ? <div className="shrink-0">{actions}</div> : null}
          </div>

          <div className="mt-6">{children}</div>
        </section>
      </div>
    </main>
  );
}
