import { getPublicUrl } from "@/lib/r2";

type BrandLogoLoaderProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  fullScreen?: boolean;
};

export function BrandLogoLoader({
  eyebrow = "Loading",
  title = "Preparing your experience...",
  description = "Please wait a moment.",
  fullScreen = true,
}: BrandLogoLoaderProps) {
  const logoUrl = getPublicUrl("assets/ssn-logo.png");

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        "text-white",
        fullScreen
          ? "min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),rgba(2,6,23,0.96)_48%)] px-4 py-10"
          : "",
      ].join(" ")}
    >
      <div
        className={[
          "mx-auto flex w-full items-center justify-center",
          fullScreen ? "min-h-[70vh] max-w-4xl" : "min-h-[320px] max-w-none",
        ].join(" ")}
      >
        <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(8,17,28,0.98),rgba(4,10,17,0.98))] p-8 text-center shadow-[0_30px_80px_rgba(0,0,0,0.38)]">
          <div className="brand-loader-glow mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-white/10 bg-white/4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt="SSN Custom Apparel logo"
              className="brand-logo-beat h-14 w-auto object-contain"
            />
          </div>
          <p className="mt-5 font-mono text-xs uppercase tracking-[0.3em] text-white/55">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-white/62">{description}</p>
          <span className="sr-only">{title} Please wait while the page loads.</span>
        </div>
      </div>
    </div>
  );
}
