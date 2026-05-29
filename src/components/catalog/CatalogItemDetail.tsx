import Link from "next/link";
import type { CatalogItemData } from "@/lib/catalog";

type CatalogItemDetailProps = {
  item: CatalogItemData;
};

export function CatalogItemDetail({ item }: CatalogItemDetailProps) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
        <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,17,28,0.98),rgba(4,10,17,0.98))] p-5 shadow-[0_24px_65px_rgba(0,0,0,0.28)]">
          <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[24px] border border-white/8 bg-black/20 p-6">
            {item.imagePath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.imagePath}
                alt={`${item.title} catalog image`}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 text-center text-sm text-white/42">
                No image available
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,17,28,0.98),rgba(4,10,17,0.98))] p-6 shadow-[0_24px_65px_rgba(0,0,0,0.28)] lg:p-8">
          <div className="flex flex-wrap items-center gap-2">
            {item.isFeatured ? (
              <span className="inline-flex rounded-full border border-[var(--brand-accent-border)] bg-[var(--brand-accent-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                Featured
              </span>
            ) : null}
            {item.studioProduct ? (
              <span className="inline-flex rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/62">
                {item.studioProduct.name}
              </span>
            ) : null}
            {item.studioTemplate ? (
              <span className="inline-flex rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/62">
                {item.studioTemplate.name}
              </span>
            ) : null}
          </div>

          <h1 className="mt-5 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl">
            {item.title}
          </h1>
          <p className="mt-4 text-base leading-7 text-white/68 sm:text-lg">
            {item.shortDescription}
          </p>

          {(item.studioProduct || item.studioTemplate) ? (
            <div className="mt-6 rounded-2xl border border-white/8 bg-black/10 px-5 py-4 text-sm text-white/58">
              {item.studioProduct ? (
                <p>
                  Linked studio product:{" "}
                  <span className="font-semibold text-white/82">
                    {item.studioProduct.name}
                  </span>
                </p>
              ) : null}
              {item.studioTemplate ? (
                <p className={item.studioProduct ? "mt-2" : ""}>
                  Linked studio template:{" "}
                  <span className="font-semibold text-white/82">
                    {item.studioTemplate.name}
                  </span>
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={item.customizeHref}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-linear-to-b from-[var(--accent-soft)] to-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_var(--brand-accent-shadow)] transition hover:-translate-y-0.5"
            >
              Customize This
            </Link>
            <Link
              href="/catalogs"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/10 bg-white/4 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/7"
            >
              Back to Catalog
            </Link>
          </div>

          {item.description ? (
            <div className="mt-10 border-t border-white/8 pt-8">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-white/45">
                Description
              </p>
              <div
                className="mt-5 space-y-4 text-sm leading-7 text-white/74 [&_a]:text-[var(--accent)] [&_a]:underline [&_h1]:text-3xl [&_h1]:font-black [&_h1]:tracking-[-0.05em] [&_h1]:text-white [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-[-0.04em] [&_h2]:text-white [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-white [&_li]:ml-5 [&_li]:list-disc [&_ol]:space-y-2 [&_ol]:pl-5 [&_ol]:list-decimal [&_p]:m-0 [&_ul]:space-y-2"
                // This HTML comes from trusted admin input. Sanitize if untrusted users ever gain edit access.
                dangerouslySetInnerHTML={{ __html: item.description }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
