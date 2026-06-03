import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMerchantShop, merchantErrorResponse } from "@/lib/merchant-auth";

export async function GET(request: Request) {
  try {
    const shop = await requireMerchantShop();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = 20;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { shopId: shop.id },
        include: {
          design: { select: { shareToken: true, previewImagePath: true } },
          template: { select: { name: true } },
          product: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where: { shopId: shop.id } }),
    ]);

    return NextResponse.json({ orders, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    return merchantErrorResponse(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const shop = await requireMerchantShop();
    const { orderId, status } = (await request.json()) as { orderId: string; status: string };

    const validStatuses = ["pending", "processing", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, shopId: shop.id },
    });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
    return NextResponse.json({ order: updated });
  } catch (err) {
    return merchantErrorResponse(err);
  }
}
