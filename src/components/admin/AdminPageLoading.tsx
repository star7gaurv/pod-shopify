import { BrandLogoLoader } from "@/components/ui/BrandLogoLoader";

type AdminPageLoadingProps = {
  title?: string;
  description?: string;
};

export function AdminPageLoading({
  title = "Loading workspace...",
  description = "Preparing admin tools.",
}: AdminPageLoadingProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),rgba(2,6,23,0.96)_48%)] px-4 py-8 lg:px-6">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(8,17,28,0.98),rgba(4,10,17,0.98))] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.38)] lg:p-6">
          <div className="h-3 w-24 animate-pulse rounded-full bg-white/10" />
          <div className="mt-5 grid gap-2">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="h-12 animate-pulse rounded-2xl border border-white/8 bg-white/4"
              />
            ))}
          </div>
          <div className="mt-8 h-20 animate-pulse rounded-2xl border border-white/8 bg-white/4" />
          <div className="mt-4 h-11 animate-pulse rounded-xl border border-white/8 bg-white/4" />
        </aside>

        <section className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(8,17,28,0.98),rgba(4,10,17,0.98))] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.38)] lg:p-8">
          <BrandLogoLoader
            eyebrow="Admin Panel"
            title={title}
            description={description}
            fullScreen={false}
          />
        </section>
      </div>
    </main>
  );
}
