import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

const quickLinks = [
  { label: "Products", href: "#products" },
  { label: "Studio", href: "/studio" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Contact", href: "#contact" },
];

export function HomeFooter() {
  return (
    <footer
      id="contact"
      className="scroll-mt-28 mt-6 border-t border-white/8 bg-[#020910] px-4 py-10 sm:px-6 lg:px-8"
    >
      <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={siteConfig.logoUrl}
            alt={`${siteConfig.name} logo`}
            className="h-12 w-auto object-contain"
          />
          <p className="mt-4 max-w-md text-sm leading-7 text-white/62">
            {siteConfig.footerDescription}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/82">
            Quick Links
          </p>
          <div className="mt-4 grid gap-3 text-sm text-white/62">
            {quickLinks.map((link) =>
              link.href.startsWith("#") ? (
                <a key={link.label} href={link.href} className="hover:text-white">
                  {link.label}
                </a>
              ) : (
                <Link key={link.label} href={link.href} className="hover:text-white">
                  {link.label}
                </Link>
              ),
            )}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/82">
            Contact
          </p>
          <div className="mt-4 grid gap-3 text-sm text-white/62">
            <p>{siteConfig.phone}</p>
            <p>{siteConfig.email}</p>
            <p>{siteConfig.address}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 w-full max-w-7xl border-t border-white/8 pt-6 text-sm text-white/48">
        © 2026 {siteConfig.name}. All rights reserved.
      </div>
    </footer>
  );
}
