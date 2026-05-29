import Link from "next/link";
import { PendingNavLink } from "@/components/layout/PendingNavLink";
import { siteConfig } from "@/lib/site-config";

type NavbarProps = {
  currentPath?: string;
  variant?: "home" | "studio";
};

const homeLinks = [
  { label: "Catalog", href: "/catalogs", type: "route" as const },
  { label: "How It Works", href: "/#how-it-works", type: "hash" as const },
  { label: "Studio", href: "/studio", type: "route" as const },
  { label: "Testimonials", href: "/#testimonials", type: "hash" as const },
  { label: "Contact", href: "/#contact", type: "hash" as const },
];

export function Navbar({
  currentPath,
  variant = "studio",
}: NavbarProps) {
  const isHomeVariant = variant === "home";

  return (
    <header
      className={[
        "relative z-50 border-b border-white/8 bg-[#020910]/88 backdrop-blur-xl",
        isHomeVariant ? "" : "md:sticky md:top-0",
      ].join(" ")}
    >
      <div
        className={[
          "mx-auto flex w-full max-w-7xl px-4 py-3 sm:px-6 lg:px-8",
          isHomeVariant
            ? "flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:py-4"
            : "items-center justify-between",
        ].join(" ")}
      >
        <Link href="/" className="inline-flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={siteConfig.logoUrl}
            alt={`${siteConfig.name} logo`}
            className={[
              "w-auto object-contain",
              isHomeVariant ? "h-10 sm:h-11" : "h-9 sm:h-10",
            ].join(" ")}
          />
        </Link>

        {isHomeVariant ? (
          <>
            <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/68">
              {homeLinks.map((item) =>
                item.type === "hash" ? (
                  <a
                    key={item.label}
                    href={item.href}
                    className="transition hover:text-white"
                  >
                    {item.label}
                  </a>
                ) : (
                  <PendingNavLink
                    key={item.label}
                    href={item.href}
                    className={[
                      "transition hover:text-white",
                      isNavLinkActive(currentPath, item.href) ? "text-white" : "",
                    ].join(" ")}
                  >
                    {item.label}
                  </PendingNavLink>
                ),
              )}
            </nav>

            <PendingNavLink
              href="/studio"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-linear-to-b from-[var(--accent-soft)] to-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_var(--brand-accent-shadow)] transition hover:-translate-y-0.5"
            >
              Start Your Design
            </PendingNavLink>
          </>
        ) : null}
      </div>
    </header>
  );
}

function isNavLinkActive(currentPath: string | undefined, href: string) {
  if (!currentPath) {
    return false;
  }

  if (href === "/catalogs") {
    return currentPath.startsWith("/catalogs");
  }

  if (href === "/studio") {
    return currentPath.startsWith("/studio");
  }

  return currentPath === href;
}
