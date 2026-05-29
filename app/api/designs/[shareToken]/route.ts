import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  mapDesignToStudioSavedDesign,
  prepareStudioDesignForPersistence,
  saveDesignPreviewImage,
} from "@/lib/designs";
import type { SaveStudioDesignPayload } from "@/types/designs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ shareToken: string }> },
) {
  const { shareToken } = await context.params;

  try {
    const design = await prisma.design.findUnique({
      where: {
        shareToken,
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

    if (!design) {
      return NextResponse.json({ error: "Design not found." }, { status: 404 });
    }

    await prisma.design.update({
      where: {
        id: design.id,
      },
      data: {
        lastOpenedAt: new Date(),
      },
    });

    return NextResponse.json({
      design: mapDesignToStudioSavedDesign(
        design as Parameters<typeof mapDesignToStudioSavedDesign>[0],
      ),
    });
  } catch (error) {
    console.error(`GET /api/designs/${shareToken} failed`, error);
    return NextResponse.json(
      { error: "Failed to load design." },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ shareToken: string }> },
) {
  const { shareToken } = await context.params;

  try {
    const body = (await request.json()) as SaveStudioDesignPayload;
    const existingDesign = await prisma.design.findUnique({
      where: {
        shareToken,
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

    if (!existingDesign) {
      return NextResponse.json({ error: "Design not found." }, { status: 404 });
    }

    if (existingDesign.isLocked || existingDesign.isFeatured) {
      return NextResponse.json(
        { error: "Locked or featured designs cannot be overwritten." },
        { status: 409 },
      );
    }

    const previewImageUrl =
      (await saveDesignPreviewImage(shareToken, body.previewDataUrl)) ??
      existingDesign.previewImagePath;
    const preparedDesign = await prepareStudioDesignForPersistence({
      canvasJson: body.canvasJson,
      uploadedAssets: body.uploadedAssets,
    });

    const design = await prisma.design.update({
      where: {
        shareToken,
      },
      data: {
        materialId: body.selectedMaterialId || null,
        baseColor: body.baseColor,
        canvasJson: preparedDesign.canvasJson,
        designMeta: {
          uploadedAssets: preparedDesign.uploadedAssets,
        },
        previewImagePath: previewImageUrl,
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
    console.error(`PUT /api/designs/${shareToken} failed`, error);
    return NextResponse.json(
      { error: "Failed to update design." },
      { status: 500 },
    );
  }
}
