import { NextResponse } from "next/server";
import { verifyWebhookHmac } from "@/lib/shopify";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const hmacHeader = request.headers.get("x-shopify-hmac-sha256") ?? "";
  const shopDomain = request.headers.get("x-shopify-shop-domain") ?? "";

  if (!verifyWebhookHmac(rawBody, hmacHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const shopifyOrder = JSON.parse(rawBody) as ShopifyOrderPayload;
    const shop = await prisma.shop.findUnique({ where: { shopDomain } });

    if (!shop) {
      // Store not installed via our app — ignore
      return NextResponse.json({ received: true });
    }

    // Look for our design ID in line item properties
    for (const item of shopifyOrder.line_items ?? []) {
      const designIdProp = item.properties?.find(
        (p) => p.name === "_pod_design_id" || p.name === "Design ID",
      );

      if (!designIdProp?.value) continue;

      const design = await prisma.design.findUnique({
        where: { id: designIdProp.value },
        include: { product: true, template: true },
      });

      if (!design) continue;

      // Create internal order record linked to this design
      await prisma.order.create({
        data: {
          orderNumber: `SHOP-${shopifyOrder.order_number}`,
          shopId: shop.id,
          designId: design.id,
          productId: design.productId,
          templateId: design.templateId,
          materialId: design.materialId,
          shopifyOrderId: String(shopifyOrder.id),
          shopifyOrderNumber: String(shopifyOrder.order_number),
          customerName:
            shopifyOrder.shipping_address?.name ??
            `${shopifyOrder.customer?.first_name} ${shopifyOrder.customer?.last_name}`.trim(),
          customerPhone: shopifyOrder.customer?.phone ?? "",
          customerEmail: shopifyOrder.customer?.email ?? null,
          quantity: item.quantity ?? 1,
          pricePerItem: Number(item.price ?? 0),
          totalPrice: Number(item.price ?? 0) * (item.quantity ?? 1),
          status: "pending",
          fulfillmentStatus: "pending",
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("orders/create webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

type ShopifyLineItem = {
  id: number;
  quantity: number;
  price: string;
  properties?: Array<{ name: string; value: string }>;
};

type ShopifyOrderPayload = {
  id: number;
  order_number: number;
  customer?: { email?: string; phone?: string; first_name?: string; last_name?: string };
  shipping_address?: { name?: string };
  line_items?: ShopifyLineItem[];
};
