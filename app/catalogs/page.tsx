import type { Metadata } from "next";
import { CatalogItemsGrid } from "@/components/catalog/CatalogItemsGrid";
import { HomeAnnouncementBar } from "@/components/home/HomeAnnouncementBar";
import { HomeFooter } from "@/components/home/HomeFooter";
import { Navbar } from "@/components/layout/Navbar";
import { getActiveCatalogItems } from "@/lib/catalog";
import { getPublicUrl } from "@/lib/r2";

const catalogSocialImageUrl = getPublicUrl("assets/ssn-logo.png");

export const metadata: Metadata = {
  title: "Custom Apparel Catalog",
  description:
    "Browse custom apparel, shirts, flags, tents, bags, and promotional products from SSN Apparels. Choose a catalog item to view details or start designing online.",
  alternates: {
    canonical: "/catalogs",
  },
  openGraph: {
    title: "Custom Apparel Catalog | SSN Apparels",
    description:
      "Explore active catalog items and start your custom apparel design online.",
    url: "/catalogs",
    images: [
      {
        url: catalogSocialImageUrl,
        alt: "SSN Apparels logo",
      },
    ],
  },
  twitter: {
    title: "Custom Apparel Catalog | SSN Apparels",
    description:
      "Explore active catalog items and start your custom apparel design online.",
    images: [catalogSocialImageUrl],
  },
};

export default async function CatalogsPage() {
  const items = await getActiveCatalogItems();

  return (
    <main className="min-h-screen bg-[#030913] text-white">
      <HomeAnnouncementBar />
      <Navbar currentPath="/catalogs" variant="home" />

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <CatalogItemsGrid items={items} />
      </section>

      <HomeFooter />
    </main>
  );
}
