type CatalogEmptyStateProps = {
  title?: string;
  description?: string;
};

export function CatalogEmptyState({
  title = "No catalog items are available yet.",
  description = "Please check back soon or head into the studio to begin a custom design from the available products.",
}: CatalogEmptyStateProps) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/4 px-6 py-14 text-center shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
      <h2 className="text-2xl font-black tracking-[-0.04em] text-white">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-7 text-white/62">{description}</p>
    </div>
  );
}
