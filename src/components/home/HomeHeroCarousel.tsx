"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

const trustPoints = [
  "Free Shipping",
  "Max 10 Days Turnaround"
];

const slides = [
  {
    title: "Design Custom Apparel Online",
    description:
      "Choose your product, customize colors, logos, names, and numbers, then submit a clear design for production.",
    primaryCta: "Start Your Design",
    primaryHref: "/studio",
    secondaryCta: "Browse Products",
    secondaryHref: "#products",
    imageAlt: "Custom racing apparel team wearing printed shirts",
    imageLabel: "Custom jersey preview",
    imageTheme:
      "bg-[linear-gradient(180deg,rgba(13,23,37,0.96),rgba(4,10,18,0.98))]",
  },
  {
    title: "Custom Gear for Teams, Events & Businesses",
    description:
      "Create matching shirts, polos, bags, flags, tents, and event gear with a simple design-first workflow.",
    primaryCta: "Start Your Design",
    primaryHref: "/studio",
    secondaryCta: "View Catalog",
    secondaryHref: "#products",
    imageAlt: "Custom apparel for teams events and businesses",
    imageLabel: "Product collection preview",
    imageTheme:
      "bg-[linear-gradient(180deg,rgba(16,28,44,0.96),rgba(6,12,22,0.98))]",
  },
  {
    title: "Preview Before Production",
    description:
      "Use our studio to build a clear proof before your order goes into making.",
    primaryCta: "Open Studio",
    primaryHref: "/studio",
    secondaryCta: "How It Works",
    secondaryHref: "#how-it-works",
    imageAlt: "Custom apparel preview before production",
    imageLabel: "Studio proof preview",
    imageTheme:
      "bg-[linear-gradient(180deg,rgba(18,25,39,0.96),rgba(7,11,20,0.98))]",
  },
];

export function HomeHeroCarousel({
  firstSlideImageUrl,
}: {
  firstSlideImageUrl: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const activeSlide = slides[activeIndex];

  return (
    <section className="px-4 pb-6 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(9,17,28,0.98),rgba(4,10,17,0.98))] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="grid min-h-[620px] lg:grid-cols-[1.15fr_0.85fr]">
          <div
            className={`relative flex min-h-[320px] items-center justify-center overflow-hidden border-b border-white/8 p-6 sm:p-8 lg:min-h-[620px] lg:border-b-0 lg:border-r ${activeSlide.imageTheme}`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,var(--brand-accent-soft),transparent_28%)]" />
            <div className="relative w-full max-w-[520px]">
              <HeroSlideImage
                alt={activeSlide.imageAlt}
                src={firstSlideImageUrl}
              />
            </div>
          </div>

          <div className="relative flex flex-col justify-center p-6 sm:p-8 lg:p-12">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/55">
              {activeSlide.imageLabel}
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] text-balance text-white sm:text-5xl lg:text-6xl">
              {activeSlide.title}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-white/70 sm:text-lg">
              {activeSlide.description}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={activeSlide.primaryHref}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-linear-to-b from-[var(--accent-soft)] to-[var(--accent)] px-6 py-3 font-semibold text-white shadow-[0_18px_40px_var(--brand-accent-shadow)] transition hover:-translate-y-0.5"
              >
                {activeSlide.primaryCta}
              </Link>
              <Link
                href={activeSlide.secondaryHref}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/10 bg-white/4 px-6 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/7"
              >
                {activeSlide.secondaryCta}
              </Link>
            </div>

            <div className="mt-8 grid gap-3">
              {trustPoints.map((point) => (
                <div
                  key={point}
                  className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-white/78"
                >
                  <CheckCircle2 className="h-5 w-5 text-[var(--accent)]" />
                  <span>{point}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {slides.map((slide, index) => (
                  <button
                    key={slide.title}
                    type="button"
                    aria-label={`Go to slide ${index + 1}`}
                    onClick={() => setActiveIndex(index)}
                    className={[
                      "h-2.5 rounded-full transition",
                      index === activeIndex
                        ? "w-8 bg-[var(--accent)]"
                        : "w-2.5 bg-white/25 hover:bg-white/45",
                    ].join(" ")}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous slide"
                  onClick={() =>
                    setActiveIndex((current) =>
                      current === 0 ? slides.length - 1 : current - 1,
                    )
                  }
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/78 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next slide"
                  onClick={() =>
                    setActiveIndex((current) => (current + 1) % slides.length)
                  }
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/78 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroSlideImage({
  alt,
  src,
}: {
  alt: string;
  src: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[30px] border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="h-[320px] w-full object-cover sm:h-[400px] lg:h-[520px]"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,13,0.12),rgba(2,6,13,0.28))]" />
    </div>
  );
}
