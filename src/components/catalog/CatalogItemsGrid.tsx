import type { CatalogItemData } from "@/lib/catalog";
import { CatalogEmptyState } from "@/components/catalog/CatalogEmptyState";
import { CatalogItemCard } from "@/components/catalog/CatalogItemCard";

type CatalogItemsGridProps = {
  items: CatalogItemData[];
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  cardProps?: {
    className?: string;
    showFeaturedBadge?: boolean;
    showStudioProductBadge?: boolean;
    showLinkedTemplate?: boolean;
  };
};

export function CatalogItemsGrid({
  items,
  emptyStateTitle,
  emptyStateDescription,
  cardProps,
}: CatalogItemsGridProps) {
  if (items.length === 0) {
    return (
      <CatalogEmptyState
        title={emptyStateTitle}
        description={emptyStateDescription}
      />
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <CatalogItemCard
          key={item.id}
          item={item}
          className={cardProps?.className}
          showFeaturedBadge={cardProps?.showFeaturedBadge}
          showStudioProductBadge={cardProps?.showStudioProductBadge}
          showLinkedTemplate={cardProps?.showLinkedTemplate}
        />
      ))}
    </div>
  );
}
