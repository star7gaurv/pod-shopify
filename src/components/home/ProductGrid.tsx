import Link from "next/link";

const products = [
  {
    title: "Race Jersey Pro Cut",
    label: "Race Kit",
    description:
      "Main race jersey with names, numbers, sponsor zones, and full sublimation.",
    featured: true,
  },
  {
    title: "Quarter-Zip Polo",
    label: "Sponsor Wear",
    description:
      "Professional crew apparel for sponsors, staff, and clean pit-lane presentation.",
  },
  {
    title: "Pullover Hoodie",
    label: "Team Layer",
    description:
      "Off-track team gear built from the same visual language as your race kit.",
  },
  {
    title: "Pit Shirt",
    label: "Pit Apparel",
    description:
      "Structured teamwear for shop days, trackside operations, and sponsor events.",
  },
];

export function ProductGrid() {
  return (
    <section className="px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6 md:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <article
            key={product.title}
            className="flex min-h-[450px] flex-col overflow-hidden border border-white/8 bg-linear-to-b from-[rgba(8,17,28,0.98)] to-[rgba(4,10,17,0.96)] shadow-[0_24px_60px_rgba(0,0,0,0.3)]"
          >
            <div
              className={[
                "grid h-60 place-items-center border-b border-white/8",
                product.featured
                  ? "bg-[repeating-linear-gradient(135deg,rgba(202,2,80,0.88)_0_4px,transparent_4px_14px),linear-gradient(180deg,rgba(14,22,35,0.98),rgba(8,12,20,0.98))]"
                  : "bg-[radial-gradient(circle_at_50%_22%,rgba(255,255,255,0.14),transparent_12%),linear-gradient(180deg,rgba(12,23,37,0.96),rgba(4,10,18,0.98))]",
              ].join(" ")}
            >
              <span className="font-mono text-sm uppercase tracking-[0.32em] text-white/65">
                {product.label}
              </span>
            </div>

            <div className="flex h-full flex-col gap-4 px-6 py-7">
              <h2 className="text-3xl font-extrabold tracking-[-0.04em] text-white">
                {product.title}
              </h2>
              <p className="text-[15px] leading-8 text-white/62">
                {product.description}
              </p>
              <Link
                href="/studio"
                className="mt-auto inline-flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-[0.28em] text-[var(--accent)]"
              >
                Customize This
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
