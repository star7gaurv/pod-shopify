import { NextResponse } from "next/server";
import { requireShop } from "@/lib/merchant-auth";
import { shopifyApiCall } from "@/lib/shopify";
import { prisma } from "@/lib/prisma";

/** GET: Fetch Shopify products + our templates for mapping */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = await requireShop(searchParams.get("shop"));

    const [shopifyData, templates] = await Promise.all([
      shopifyApiCall(shop.shopDomain, shop.accessToken, "products.json?limit=50&fields=id,title,handle,images,variants"),
      prisma.template.findMany({
        where: { isActive: true },
        include: { product: { select: { name: true, slug: true } } },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({
      shopifyProducts: (shopifyData as { products: unknown[] }).products ?? [],
      templates,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}

/** POST: Save a product↔template mapping as Shopify metafields */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = await requireShop(searchParams.get("shop"));
    const { shopifyProductId, productSlug, templateSlug } = (await request.json()) as {
      shopifyProductId: string;
      productSlug: string;
      templateSlug: string;
    };

    // Save as Shopify metafields so the Theme Extension can read them
    await shopifyApiCall(shop.shopDomain, shop.accessToken, `products/${shopifyProductId}/metafields.json`, {
      method: "POST",
      body: JSON.stringify({
        metafield: { namespace: "pod", key: "product_slug", value: productSlug, type: "single_line_text_field" },
      }),
    });
    await shopifyApiCall(shop.shopDomain, shop.accessToken, `products/${shopifyProductId}/metafields.json`, {
      method: "POST",
      body: JSON.stringify({
        metafield: { namespace: "pod", key: "template_slug", value: templateSlug, type: "single_line_text_field" },
      }),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
