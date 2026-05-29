import { NextResponse } from "next/server";
import { verifyWebhookHmac } from "@/lib/shopify";
import { prisma } from "@/lib/prisma";
import { routeToFulfillment } from "@/lib/fulfillment/router";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const hmacHeader = request.headers.get("x-shopify-hmac-sha256") ?? "";
  const shopDomain = request.headers.get("x-shopify-shop-domain") ?? "";

  if (!verifyWebhookHmac(rawBody, hmacHeader)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shopifyOrder = JSON.parse(rawBody) as ShopifyOrderPayload;
  const shop = await prisma.shop.findUnique({ where: { shopDomain } });

  if (!shop) return NextResponse.json({ received: true });

  try {
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

      const customerName =
        shopifyOrder.shipping_address?.name ??
        `${shopifyOrder.customer?.first_name ?? ""} ${shopifyOrder.customer?.last_name ?? ""}`.trim();

      const order = await prisma.order.create({
        data: {
          orderNumber: `SHOP-${shopifyOrder.order_number}-${item.id}`,
          shopId: shop.id,
          designId: design.id,
          productId: design.productId,
          templateId: design.templateId,
          materialId: design.materialId,
          shopifyOrderId: String(shopifyOrder.id),
          shopifyOrderNumber: String(shopifyOrder.order_number),
          customerName,
          customerPhone: shopifyOrder.customer?.phone ?? "",
          customerEmail: shopifyOrder.customer?.email ?? null,
          quantity: item.quantity ?? 1,
          pricePerItem: Number(item.price ?? 0),
          totalPrice: Number(item.price ?? 0) * (item.quantity ?? 1),
          status: "pending",
          fulfillmentStatus: "pending",
        },
      });

      // Route to print partner asynchronously (don't block 200 response)
      if (design.exportFolderPath || design.previewImagePath) {
        const printFileUrl = design.exportFolderPath ?? design.previewImagePath ?? "";
        const shippingAddr = shopifyOrder.shipping_address;
        const countryCode = shippingAddr?.country_code ?? "IN";

        routeToFulfillment({
          orderId: order.id,
          countryCode,
          printFileUrl,
          quantity: item.quantity ?? 1,
          customer: {
            name: customerName,
            phone: shopifyOrder.customer?.phone ?? "",
            email: shopifyOrder.customer?.email,
            address1: shippingAddr?.address1 ?? "",
            address2: shippingAddr?.address2,
            city: shippingAddr?.city ?? "",
            state: shippingAddr?.province ?? "",
            zip: shippingAddr?.zip ?? "",
            country: countryCode,
          },
        })
          .then(async (result) => {
            await prisma.order.update({
              where: { id: order.id },
              data: {
                fulfillmentStatus: result.error ? "failed" : "sent_to_printer",
                status: result.error ? "pending" : "processing",
              },
            });
            if (result.error) {
              console.error(`Fulfillment failed for order ${order.id}:`, result.error);
            } else {
              console.info(`Order ${order.id} sent to ${result.provider}: ${result.externalOrderId}`);
            }
          })
          .catch((err) => console.error("Fulfillment routing error:", err));
      }
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
  customer?: {
    email?: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
  };
  shipping_address?: {
    name?: string;
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    zip?: string;
    country_code?: string;
  };
  line_items?: ShopifyLineItem[];
};
