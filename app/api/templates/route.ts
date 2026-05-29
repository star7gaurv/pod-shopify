import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCache,
  getStudioTemplatesByProductCacheKey,
  isRedisAvailable,
  setCache,
} from "@/lib/redis";
import { mapTemplateToStudioTemplateSummary } from "@/lib/studio-db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productSlug = searchParams.get("productSlug");

  if (!productSlug) {
    return NextResponse.json(
      { error: "productSlug is required." },
      { status: 400 },
    );
  }

  try {
    const redisAvailable = isRedisAvailable();
    const cacheKey = getStudioTemplatesByProductCacheKey(productSlug);
    const cachedTemplates = await getCache<{
      templates: ReturnType<typeof mapTemplateToStudioTemplateSummary>[];
    }>(cacheKey);

    if (cachedTemplates) {
      return NextResponse.json(cachedTemplates, {
        headers: {
          "x-studio-cache": "hit",
        },
      });
    }

    const templates = await prisma.template.findMany({
      where: {
        isActive: true,
        product: {
          slug: productSlug,
          isActive: true,
        },
      },
      include: {
        product: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const payload = {
      templates: templates.map(mapTemplateToStudioTemplateSummary),
    };

    const cacheStatus = redisAvailable ? "miss" : "bypass";
    if (redisAvailable) {
      await setCache(cacheKey, payload);
    }

    return NextResponse.json(payload, {
      headers: {
        "x-studio-cache": cacheStatus,
      },
    });
  } catch (error) {
    console.error("GET /api/templates failed", error);
    return NextResponse.json(
      {
        error: "Failed to load templates.",
      },
      { status: 500 },
    );
  }
}
