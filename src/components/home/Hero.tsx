import Link from "next/link";

export function Hero() {
  return (
    <section className="px-4 pb-5 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl overflow-hidden border border-white/8 bg-linear-to-b from-[rgba(8,17,28,0.98)] to-[rgba(4,10,17,0.96)] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="relative min-h-[560px] px-6 py-16 text-center sm:px-10 lg:min-h-[640px] lg:px-16 lg:py-24">
          <div className="absolute left-[18%] top-[-72px] h-[360px] w-[140px] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.34),rgba(255,255,255,0.04)_42%,transparent_72%)] opacity-90 blur-[3px] [clip-path:polygon(35%_0%,65%_0%,100%_100%,0%_100%)]" />
          <div className="absolute left-[46%] top-[-72px] h-[360px] w-[140px] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.34),rgba(255,255,255,0.04)_42%,transparent_72%)] opacity-90 blur-[3px] [clip-path:polygon(35%_0%,65%_0%,100%_100%,0%_100%)]" />
          <div className="absolute left-[74%] top-[-72px] h-[360px] w-[140px] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.34),rgba(255,255,255,0.04)_42%,transparent_72%)] opacity-90 blur-[3px] [clip-path:polygon(35%_0%,65%_0%,100%_100%,0%_100%)]" />

          <div className="relative mx-auto flex max-w-5xl flex-col items-center">
            <p className="mb-6 font-mono text-sm uppercase tracking-[0.34em] text-white/55">
              Custom Racing Apparel
            </p>
            <h1 className="max-w-5xl text-5xl font-black tracking-[-0.06em] text-balance text-white sm:text-6xl lg:text-8xl">
              Build your gear.
              <br />
              Then enter the studio.
            </h1>
            <p className="mt-7 max-w-4xl text-base leading-8 text-white/72 sm:text-lg lg:text-[1.35rem]">
              Start with the product that fits your team, then move into a
              single premium design flow for colors, sponsor zones, rider names,
              numbers, and matching teamwear.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/studio"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-linear-to-b from-[var(--accent-soft)] to-[var(--accent)] px-6 py-3 font-semibold text-white shadow-[0_18px_40px_rgba(202,2,80,0.24)] transition hover:-translate-y-0.5"
              >
                Enter Studio
              </Link>
              <Link
                href="/studio"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/10 bg-white/4 px-6 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/7"
              >
                View Team Order Flow
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
