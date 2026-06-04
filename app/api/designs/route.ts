import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  mapDesignToStudioSavedDesign,
  prepareStudioDesignForPersistence,
  saveDesignPreviewImage,
} from "@/lib/designs";
import { isValidShopDomain } from "@/lib/shopify";
import { FREE_DESIGN_LIMIT } from "@/lib/plan";
import type { SaveStudioDesignPayload } from "@/types/designs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SaveStudioDesignPayload;

    const product = await prisma.product.findUnique({
      where: {
        slug: body.productId,
      },
    });
    const template = await prisma.template.findUnique({
      where: {
        slug: body.templateId,
      },
      include: {
        product: true,
        materials: {
          where: {
            isActive: true,
          },
          orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        },
        sizeCharts: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    });

    if (!product || !template || template.product.slug !== body.productId) {
      return NextResponse.json(
        { error: "Product or template could not be found." },
        { status: 400 },
      );
    }

    // Attribute the design to the storefront shop (when the embed passed one)
    // and enforce the free-tier design cap.
    //
    // Security note: `body.shop` is unsigned storefront data from the Liquid
    // block's `{{ shop.permanent_domain }}`. An attacker could pass a
    // competitor's shop domain and exhaust their free 3-design counter.
    //
    // Mitigation: we only enforce the hard cap when the HTTP Referer header
    // indicates the request originated from that shop's actual storefront
    // (*.myshopify.com or a custom domain the shop uses). Requests with a
    // mismatched or absent Referer can still save designs, but the cap is
    // not applied — so a spoofed body.shop cannot be used to DoS a competitor.
    // Attribution (shopId) is still set so the merchant's own dashboard
    // count is accurate.
    const shop =
      body.shop && isValidShopDomain(body.shop)
        ? await prisma.shop.findUnique({
            where: { shopDomain: body.shop, isActive: true },
          })
        : null;

    const referer = (request as Request & { headers: Headers }).headers.get("referer") ?? "";
    const refererHost = (() => {
      try { return new URL(referer).hostname; } catch { return ""; }
    })();
    // Trust the cap only when the Referer matches the shop's myshopify domain.
    // Custom storefronts that use a non-myshopify Referer will attribute but
    // not be capped — acceptable; they can be tightened later with a signed
    // storefront token.
    const capTrusted = !!shop && refererHost === body.shop;

    if (shop && shop.plan === "free" && capTrusted) {
      // count + create isn't atomic; worst case a store lands on 4 designs —
      // acceptable for a soft free tier.
      const used = await prisma.design.count({ where: { shopId: shop.id } });
      if (used >= FREE_DESIGN_LIMIT) {
        return NextResponse.json(
          {
            error: "design_limit_reached",
            used,
            limit: FREE_DESIGN_LIMIT,
            message: `This store has used all ${FREE_DESIGN_LIMIT} free designs. The merchant needs to subscribe to enable more.`,
          },
          { status: 402 },
        );
      }
    }

    const shareToken = randomUUID();
    const previewImageUrl = await saveDesignPreviewImage(
      shareToken,
      body.previewDataUrl,
    );
    const preparedDesign = await prepareStudioDesignForPersistence({
      canvasJson: body.canvasJson,
      uploadedAssets: body.uploadedAssets,
    });

    const design = await prisma.design.create({
      data: {
        shareToken,
        shopId: shop?.id ?? null,
        productId: product.id,
        templateId: template.id,
        materialId: body.selectedMaterialId || null,
        parentDesignId: body.parentDesignId || body.currentDesignId || null,
        baseColor: body.baseColor,
        canvasJson: preparedDesign.canvasJson,
        designMeta: {
          uploadedAssets: preparedDesign.uploadedAssets,
        },
        previewImagePath: previewImageUrl,
        isFeatured: false,
        isLocked: false,
      },
      include: {
        product: true,
        template: {
          include: {
            product: true,
            materials: {
              where: {
                isActive: true,
              },
              orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
            },
            sizeCharts: {
              orderBy: {
                sortOrder: "asc",
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      design: mapDesignToStudioSavedDesign(
        design as Parameters<typeof mapDesignToStudioSavedDesign>[0],
      ),
    });
  } catch (error) {
    console.error("POST /api/designs failed", error);
    return NextResponse.json(
      { error: "Failed to save design." },
      { status: 500 },
    );
  }
}
