import Link from "next/link";
import { CatalogItemsGrid } from "@/components/catalog/CatalogItemsGrid";
import { getFeaturedCatalogItems } from "@/lib/catalog";

export async function HomeProductCatalog() {
  const featuredItems = await getFeaturedCatalogItems();

  return (
    <section
      id="products"
      className="scroll-mt-28 rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(8,17,28,0.98),rgba(4,10,17,0.96))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.3)] sm:p-10"
    >
      <CatalogItemsGrid
        items={featuredItems}
        emptyStateTitle="No featured catalog items are available yet."
        emptyStateDescription="Featured catalog selections will appear here soon. You can still head into the studio to start a custom design."
        cardProps={{
          showFeaturedBadge: false,
          showLinkedTemplate: false,
        }}
      />

      <div className="mt-8 text-center">
        <Link
          href="/catalogs"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/10 bg-white/4 px-6 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/7"
        >
          See Full Catalog
        </Link>
      </div>
    </section>
  );
}
