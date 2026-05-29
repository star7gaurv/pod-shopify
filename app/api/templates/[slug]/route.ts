import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapTemplateToStudioTemplateDefinition } from "@/lib/studio-db";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;

  try {
    const template = await prisma.template.findUnique({
      where: {
        slug,
      },
      include: {
        product: true,
        materials: {
          where: {
            isActive: true,
          },
          orderBy: [
            {
              isDefault: "desc",
            },
            {
              createdAt: "asc",
            },
          ],
        },
        sizeCharts: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    });

    if (!template || !template.isActive || !template.product.isActive) {
      return NextResponse.json(
        { error: "Template not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      template: mapTemplateToStudioTemplateDefinition(template),
    });
  } catch (error) {
    console.error(`GET /api/templates/${slug} failed`, error);
    return NextResponse.json(
      {
        error: "Failed to load template details.",
      },
      { status: 500 },
    );
  }
}
