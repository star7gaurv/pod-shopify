type AppLoadingScreenProps = {
  title?: string;
  description?: string;
};

export function AppLoadingScreen({
  title = "Loading workspace...",
  description = "Please wait while we prepare the next screen.",
}: AppLoadingScreenProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),rgba(2,6,23,0.96)_48%)] px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-4xl items-center justify-center">
        <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(8,17,28,0.98),rgba(4,10,17,0.98))] p-8 text-center shadow-[0_30px_80px_rgba(0,0,0,0.38)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          </div>
          <p className="mt-5 font-mono text-xs uppercase tracking-[0.3em] text-white/55">
            Working
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-white/62">{description}</p>
        </div>
      </div>
    </main>
  );
}
