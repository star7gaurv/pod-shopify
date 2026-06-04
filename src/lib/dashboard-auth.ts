import { redirect } from "next/navigation";
import type { Shop } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Resolve the merchant behind an external-dashboard request from the NextAuth
 * session (realm `kind: "merchant"`). This is a SEPARATE realm from the
 * embedded app's `ps_merchant` cookie — neither satisfies the other.
 */
export async function getDashboardShop(): Promise<Shop | null> {
  const session = await auth();
  if (session?.user?.kind !== "merchant" || !session.user.shopId) return null;
  return prisma.shop.findUnique({
    where: { id: session.user.shopId, isActive: true },
  });
}

/** Same, but redirects unauthenticated visitors to the dashboard login. */
export async function requireDashboardShop(): Promise<Shop> {
  const shop = await getDashboardShop();
  if (!shop) redirect("/dashboard/login");
  return shop;
}
