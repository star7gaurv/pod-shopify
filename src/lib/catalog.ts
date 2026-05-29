import { prisma } from "@/lib/prisma";
import { deleteCache, getCache, setCache } from "@/lib/redis";

export const ACTIVE_CATALOG_ITEMS_CACHE_KEY = "catalog:items:active";
export const FEATURED_CATALOG_ITEMS_CACHE_KEY = "catalog:items:featured";

export function getCatalogItemBySlugCacheKey(slug: string) {
  return `catalog:item:${slug}`;
}

type CatalogItemRecord = Awaited<ReturnType<typeof fetchCatalogItemRecords>>[number];

export type CatalogItemData = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string | null;
  imagePath: string | null;
  ogImagePath: string | null;
  isFeatured: boolean;
  sortOrder: number;
  metaTitle: string | null;
  metaDescription: string | null;
  studioProduct: {
    id: string;
    slug: string;
    name: string;
  } | null;
  studioTemplate: {
    id: string;
    slug: string;
    name: string;
  } | null;
  customizeHref: string;
  createdAt: string;
  updatedAt: string;
};

export async function getActiveCatalogItems() {
  const cached = await getCache<CatalogItemData[]>(ACTIVE_CATALOG_ITEMS_CACHE_KEY);
  if (cached) {
    return cached;
  }

  const items = await fetchCatalogItemRecords({
    where: {
      isActive: true,
    },
  });
  const mapped = items.map(mapCatalogItemRecord);

  await setCache(ACTIVE_CATALOG_ITEMS_CACHE_KEY, mapped);
  return mapped;
}

export async function getFeaturedCatalogItems() {
  const cached = await getCache<CatalogItemData[]>(FEATURED_CATALOG_ITEMS_CACHE_KEY);
  if (cached) {
    return cached;
  }

  const items = await fetchCatalogItemRecords({
    where: {
      isActive: true,
      isFeatured: true,
    },
  });
  const mapped = items.map(mapCatalogItemRecord);

  await setCache(FEATURED_CATALOG_ITEMS_CACHE_KEY, mapped);
  return mapped;
}

export async function getCatalogItemBySlug(slug: string) {
  const normalizedSlug = slug.trim().toLowerCase();
  if (!normalizedSlug) {
    return null;
  }

  const cacheKey = getCatalogItemBySlugCacheKey(normalizedSlug);
  const cached = await getCache<CatalogItemData>(cacheKey);
  if (cached) {
    return cached;
  }

  const item = await prisma.catalogItem.findFirst({
    where: {
      slug: normalizedSlug,
      isActive: true,
    },
    include: catalogItemRelations,
  });

  if (!item) {
    return null;
  }

  const mapped = mapCatalogItemRecord(item);
  await setCache(cacheKey, mapped);
  return mapped;
}

export function getCatalogItemCustomizeHref(
  item: Pick<CatalogItemData, "studioProduct" | "studioTemplate">,
) {
  const productSlug = item.studioProduct?.slug;
  const templateSlug = item.studioTemplate?.slug;

  if (productSlug && templateSlug) {
    return `/studio?product=${encodeURIComponent(productSlug)}&template=${encodeURIComponent(templateSlug)}`;
  }

  if (productSlug) {
    return `/studio?product=${encodeURIComponent(productSlug)}`;
  }

  return "/studio";
}

export async function clearCatalogCache(slugs?: string[]) {
  const keys = new Set<string>([
    ACTIVE_CATALOG_ITEMS_CACHE_KEY,
    FEATURED_CATALOG_ITEMS_CACHE_KEY,
  ]);

  for (const slug of slugs ?? []) {
    const normalizedSlug = slug.trim().toLowerCase();
    if (!normalizedSlug) {
      continue;
    }

    keys.add(getCatalogItemBySlugCacheKey(normalizedSlug));
  }

  await Promise.all([...keys].map((key) => deleteCache(key)));
}

const catalogItemRelations = {
  studioProduct: {
    select: {
      id: true,
      slug: true,
      name: true,
    },
  },
  studioTemplate: {
    select: {
      id: true,
      slug: true,
      name: true,
    },
  },
} as const;

async function fetchCatalogItemRecords({
  where,
}: {
  where: {
    isActive?: boolean;
    isFeatured?: boolean;
  };
}) {
  return prisma.catalogItem.findMany({
    where,
    include: catalogItemRelations,
    orderBy: [
      {
        sortOrder: "asc",
      },
      {
        createdAt: "desc",
      },
    ],
  });
}

function mapCatalogItemRecord(item: CatalogItemRecord): CatalogItemData {
  const mapped: CatalogItemData = {
    id: item.id,
    title: item.title,
    slug: item.slug,
    shortDescription: item.shortDescription,
    description: item.description,
    imagePath: item.imagePath,
    ogImagePath: item.ogImagePath,
    isFeatured: item.isFeatured,
    sortOrder: item.sortOrder,
    metaTitle: item.metaTitle,
    metaDescription: item.metaDescription,
    studioProduct: item.studioProduct
      ? {
          id: item.studioProduct.id,
          slug: item.studioProduct.slug,
          name: item.studioProduct.name,
        }
      : null,
    studioTemplate: item.studioTemplate
      ? {
          id: item.studioTemplate.id,
          slug: item.studioTemplate.slug,
          name: item.studioTemplate.name,
        }
      : null,
    customizeHref: "/studio",
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };

  mapped.customizeHref = getCatalogItemCustomizeHref(mapped);
  return mapped;
}
