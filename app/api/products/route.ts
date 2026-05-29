import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCache,
  isRedisAvailable,
  setCache,
  STUDIO_PRODUCTS_CACHE_KEY,
} from "@/lib/redis";
import { mapProductToStudioProduct } from "@/lib/studio-db";

export async function GET() {
  try {
    const redisAvailable = isRedisAvailable();
    const cachedProducts = await getCache<{
      products: ReturnType<typeof mapProductToStudioProduct>[];
    }>(STUDIO_PRODUCTS_CACHE_KEY);

    if (cachedProducts) {
      return NextResponse.json(cachedProducts, {
        headers: {
          "x-studio-cache": "hit",
        },
      });
    }

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      }
    });

    const payload = {
      products: products.map(mapProductToStudioProduct),
    };

    const cacheStatus = redisAvailable ? "miss" : "bypass";
    if (redisAvailable) {
      await setCache(STUDIO_PRODUCTS_CACHE_KEY, payload);
    }

    return NextResponse.json(payload, {
      headers: {
        "x-studio-cache": cacheStatus,
      },
    });
  } catch (error) {
    console.error("GET /api/products failed", error);
    return NextResponse.json(
      {
        error: "Failed to load products.",
      },
      { status: 500 },
    );
  }
}
