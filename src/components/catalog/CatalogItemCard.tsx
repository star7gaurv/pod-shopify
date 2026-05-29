import Link from "next/link";
import type { CatalogItemData } from "@/lib/catalog";

type CatalogItemCardProps = {
  item: CatalogItemData;
  className?: string;
  showFeaturedBadge?: boolean;
  showStudioProductBadge?: boolean;
  showLinkedTemplate?: boolean;
  detailsHref?: string;
  customizeHref?: string;
};

export function CatalogItemCard({
  item,
  className,
  showFeaturedBadge = true,
  showStudioProductBadge = true,
  showLinkedTemplate = true,
  detailsHref,
  customizeHref,
}: CatalogItemCardProps) {
  const resolvedDetailsHref = detailsHref ?? `/catalogs/${item.slug}`;
  const resolvedCustomizeHref = customizeHref ?? item.customizeHref;

  return (
    <article
      className={[
        "group flex h-full flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,17,28,0.98),rgba(4,10,17,0.98))] shadow-[0_24px_65px_rgba(0,0,0,0.28)]",
        className ?? "",
      ].join(" ")}
    >
      <div className="border-b border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-5">
        <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-white/8 bg-black/20 p-4">
          {item.imagePath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imagePath}
              alt={`${item.title} catalog image`}
              className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-6 text-center text-sm text-white/42">
              No image available
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {showFeaturedBadge && item.isFeatured ? (
              <span className="inline-flex rounded-full border border-[var(--brand-accent-border)] bg-[var(--brand-accent-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                Featured
              </span>
            ) : null}
            {showStudioProductBadge && item.studioProduct ? (
              <span className="inline-flex rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/62">
                {item.studioProduct.name}
              </span>
            ) : null}
          </div>

          <h2 className="mt-4 text-2xl font-black tracking-[-0.04em] text-white">
            {item.title}
          </h2>
          <p className="mt-3 text-sm leading-7 text-white/64">
            {item.shortDescription}
          </p>

          {showLinkedTemplate && item.studioTemplate ? (
            <p className="mt-4 text-xs uppercase tracking-[0.18em] text-white/42">
              Linked template: {item.studioTemplate.name}
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={resolvedDetailsHref}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/4 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/7"
          >
            View Details
          </Link>
          <Link
            href={resolvedCustomizeHref}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-linear-to-b from-[var(--accent-soft)] to-[var(--accent)] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_var(--brand-accent-shadow)] transition hover:-translate-y-0.5"
          >
            Customize This
          </Link>
        </div>
      </div>
    </article>
  );
}
