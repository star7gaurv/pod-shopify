import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapDesignToStudioSavedDesign } from "@/lib/designs";

export async function GET() {
  try {
    const designs = await prisma.design.findMany({
      where: {
        isFeatured: true,
      },
      orderBy: {
        updatedAt: "desc",
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
      designs: designs.map(mapDesignToStudioSavedDesign),
    });
  } catch (error) {
    console.error("GET /api/designs/featured failed", error);
    return NextResponse.json(
      { error: "Failed to load featured designs." },
      { status: 500 },
    );
  }
}
