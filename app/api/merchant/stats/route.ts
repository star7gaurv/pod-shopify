import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireShop } from "@/lib/merchant-auth";

export async function GET(request: Request) {
  try {
    const shop = await requireShop(new URL(request.url).searchParams.get("shop"));

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalOrders, pendingOrders, monthOrders, totalDesigns] = await Promise.all([
      prisma.order.count({ where: { shopId: shop.id } }),
      prisma.order.count({ where: { shopId: shop.id, status: "pending" } }),
      prisma.order.findMany({
        where: { shopId: shop.id, createdAt: { gte: startOfMonth } },
        select: { totalPrice: true, status: true },
      }),
      prisma.design.count({ where: { shopId: shop.id } }),
    ]);

    const monthRevenue = monthOrders.reduce(
      (sum, o) => sum + Number(o.totalPrice),
      0,
    );

    const subscription = await prisma.subscription.findUnique({
      where: { shopId: shop.id },
      select: { status: true, currentPeriodEnd: true, trialEndsAt: true },
    });

    return NextResponse.json({
      totalOrders,
      pendingOrders,
      monthOrders: monthOrders.length,
      monthRevenue: monthRevenue.toFixed(2),
      totalDesigns,
      plan: shop.plan,
      subscription,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
