import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  mapDesignToStudioSavedDesign,
  prepareStudioDesignForPersistence,
  saveDesignPreviewImage,
} from "@/lib/designs";
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
