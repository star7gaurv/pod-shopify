import Link from "next/link";

export function HomeFinalCta() {
  return (
    <section className="overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(12,22,34,0.98),rgba(4,10,17,0.98))] px-6 py-10 shadow-[0_24px_60px_rgba(0,0,0,0.3)] sm:px-10">
      <div className="relative">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,var(--brand-accent-surface-strong),transparent_70%)] blur-3xl" />
        <p className="font-mono text-sm uppercase tracking-[0.34em] text-white/55">
          Final CTA
        </p>
        <h2 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.05em] text-balance text-white sm:text-5xl">
          Ready to Build Your Custom Apparel?
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-8 text-white/66 sm:text-lg">
          Start with a product, customize it in the studio, and send us a
          clear design for production.
        </p>
        <Link
          href="/studio"
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-linear-to-b from-[var(--accent-soft)] to-[var(--accent)] px-6 py-3 font-semibold text-white shadow-[0_18px_40px_var(--brand-accent-shadow)] transition hover:-translate-y-0.5"
        >
          Start Your Design
        </Link>
      </div>
    </section>
  );
}
