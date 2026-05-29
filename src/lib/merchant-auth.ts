import { prisma } from "@/lib/prisma";
import type { Shop } from "@prisma/client";

/** Resolve the current shop from a URL search param. Returns null if not found/inactive. */
export async function getShopFromParam(searchParams: URLSearchParams | Record<string, string>): Promise<Shop | null> {
  const shopDomain =
    searchParams instanceof URLSearchParams
      ? searchParams.get("shop")
      : searchParams["shop"];

  if (!shopDomain) return null;

  return prisma.shop.findUnique({
    where: { shopDomain, isActive: true },
  });
}

/** Same but throws 401 if not found — use in API routes. */
export async function requireShop(shopDomain: string | null): Promise<Shop> {
  if (!shopDomain) throw new Error("Missing shop parameter");
  const shop = await prisma.shop.findUnique({ where: { shopDomain, isActive: true } });
  if (!shop) throw new Error("Shop not found or not installed");
  return shop;
}

export function isPlanActive(shop: Shop): boolean {
  return shop.plan !== "free";
}
