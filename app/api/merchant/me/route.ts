import { NextResponse } from "next/server";
import { requireMerchantShop, merchantErrorResponse } from "@/lib/merchant-auth";

/**
 * Lightweight identity endpoint for the sidebar / chrome.
 *
 * The merchant layout used to hit `/api/merchant/stats` just to read
 * the shop label — but dashboards on the dashboard page were calling
 * the same expensive aggregation endpoint in parallel. Splitting the
 * cheap identity bits out here keeps the sidebar fast and avoids the
 * duplicate work.
 */
export async function GET() {
  try {
    const shop = await requireMerchantShop();
    return NextResponse.json({
      shopDomain: shop.shopDomain,
      plan: shop.plan,
    });
  } catch (err) {
    return merchantErrorResponse(err);
  }
}
