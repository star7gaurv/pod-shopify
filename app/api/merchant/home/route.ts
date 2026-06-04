import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMerchantShop, merchantErrorResponse } from "@/lib/merchant-auth";
import { countMappedProducts } from "@/lib/shopify";
import { FREE_DESIGN_LIMIT } from "@/lib/plan";

/**
 * Everything the embedded Home surface needs, in one call:
 * setup-checklist inputs, the free-designs counter, and a short read-only
 * recent-orders snippet. Heavy analytics + full order history live in the
 * external dashboard, so this stays deliberately light.
 *
 * `countMappedProducts` calls the Shopify Admin GraphQL API, which can be
 * slow or unavailable. We race it against a 1.5 s deadline so a hung Shopify
 * connection never blocks the entire Home page response — the checklist just
 * shows the "Connect a product" step as pending (mappedProducts = 0) and
 * self-corrects on the next load once Shopify is healthy.
 */
export async function GET() {
  try {
    const shop = await requireMerchantShop();

    // Fast DB queries run in parallel, independent of the Shopify API call.
    const [subscription, designsUsed, pendingOrders, recentOrders] =
      await Promise.all([
        prisma.subscription.findUnique({
          where: { shopId: shop.id },
          select: { status: true, trialEndsAt: true, currentPeriodEnd: true },
        }),
        prisma.design.count({ where: { shopId: shop.id } }),
        prisma.order.count({ where: { shopId: shop.id, status: "pending" } }),
        prisma.order.findMany({
          where: { shopId: shop.id },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            orderNumber: true,
            shopifyOrderNumber: true,
            customerName: true,
            status: true,
            totalPrice: true,
            createdAt: true,
            product: { select: { name: true } },
            design: { select: { shareToken: true, previewImagePath: true } },
          },
        }),
      ]);

    // Race the Shopify call against a 1.5 s deadline. If it loses, return 0
    // so the rest of the page renders immediately — the checklist step will
    // self-correct next time Shopify is healthy.
    const mappedProducts = await Promise.race([
      countMappedProducts(shop.shopDomain, shop.accessToken),
      new Promise<number>((resolve) => setTimeout(() => resolve(0), 1500)),
    ]);

    return NextResponse.json({
      shopDomain: shop.shopDomain,
      plan: shop.plan,
      subscription,
      designsUsed,
      designLimit: FREE_DESIGN_LIMIT,
      mappedProducts,
      pendingOrders,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.shopifyOrderNumber ?? o.orderNumber,
        customerName: o.customerName,
        status: o.status,
        totalPrice: Number(o.totalPrice).toFixed(2),
        createdAt: o.createdAt.toISOString(),
        productName: o.product.name,
        designToken: o.design?.shareToken ?? null,
        previewImagePath: o.design?.previewImagePath ?? null,
      })),
    });
  } catch (err) {
    return merchantErrorResponse(err);
  }
}
