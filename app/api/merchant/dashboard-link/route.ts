import { NextResponse } from "next/server";
import { requireMerchantShop, merchantErrorResponse } from "@/lib/merchant-auth";
import { signDashboardToken } from "@/lib/merchant-session";

/**
 * Mints a one-time hand-off URL into the external merchant dashboard.
 *
 * Gated by the `/api/merchant` middleware, so it only runs for an
 * authenticated embedded merchant. The returned URL carries a short-lived
 * token the dashboard exchanges for its own NextAuth session.
 *
 * `DASHBOARD_URL` lets the dashboard live on a different origin later; it
 * defaults to a same-origin relative path.
 */
export async function GET(request: Request) {
  try {
    const shop = await requireMerchantShop();
    const token = await signDashboardToken({
      shopId: shop.id,
      shopDomain: shop.shopDomain,
    });

    // Optional deep-link target inside the dashboard (e.g. /dashboard/billing).
    // Only same-app dashboard paths are allowed.
    const to = new URL(request.url).searchParams.get("to");
    const next = to && /^\/dashboard(\/|$)/.test(to) ? to : null;

    const base = process.env.DASHBOARD_URL?.replace(/\/$/, "") ?? "";
    const params = new URLSearchParams({ token });
    if (next) params.set("next", next);
    const url = `${base}/dashboard/login?${params.toString()}`;

    return NextResponse.json({ url });
  } catch (err) {
    return merchantErrorResponse(err);
  }
}
