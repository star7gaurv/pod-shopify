"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ProductFormState } from "@/lib/admin/product-form";
import { prisma } from "@/lib/prisma";
import {
  deleteCache,
  getStudioTemplatesByProductCacheKey,
  STUDIO_PRODUCTS_CACHE_KEY,
} from "@/lib/redis";
import { requireAdminActionSession } from "@/lib/admin-auth";

type ProductMutationInput = {
  name: string;
  slug: string;
  isActive: boolean;
};

export async function updateProductStatusAction(
  productId: string,
  nextIsActive: boolean,
) {
  await requireAdminActionSession();

  const existingProduct = await prisma.product.findUnique({
    where: {
      id: productId,
    },
    select: {
      slug: true,
    },
  });

  if (!existingProduct) {
    return {
      success: false,
      message: "Product not found.",
    };
  }

  try {
    await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        isActive: nextIsActive,
      },
    });
  } catch (error) {
    console.error("Product status update failed.", error);
    return {
      success: false,
      message: "We couldn't update this product right now.",
    };
  }

  await deleteCache(STUDIO_PRODUCTS_CACHE_KEY);
  await deleteCache(getStudioTemplatesByProductCacheKey(existingProduct.slug));

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}/edit`);

  return {
    success: true,
  };
}

export async function createProductAction(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdminActionSession();

  const parsed = parseProductFormData(formData);
  if (isProductFormState(parsed)) {
    return parsed;
  }

  try {
    await prisma.product.create({
      data: parsed,
    });
  } catch (error) {
    return handleProductMutationError(error);
  }

  await deleteCache(STUDIO_PRODUCTS_CACHE_KEY);
  await deleteCache(getStudioTemplatesByProductCacheKey(parsed.slug));

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function updateProductAction(
  productId: string,
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireAdminActionSession();

  const parsed = parseProductFormData(formData);
  if (isProductFormState(parsed)) {
    return parsed;
  }

  const existingProduct = await prisma.product.findUnique({
    where: {
      id: productId,
    },
    select: {
      slug: true,
    },
  });

  try {
    await prisma.product.update({
      where: {
        id: productId,
      },
      data: parsed,
    });
  } catch (error) {
    return handleProductMutationError(error);
  }

  await deleteCache(STUDIO_PRODUCTS_CACHE_KEY);
  if (existingProduct?.slug) {
    await deleteCache(getStudioTemplatesByProductCacheKey(existingProduct.slug));
  }
  await deleteCache(getStudioTemplatesByProductCacheKey(parsed.slug));

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

function parseProductFormData(
  formData: FormData,
): ProductMutationInput | ProductFormState {
  const name = String(formData.get("name") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const slug = normalizeSlug(rawSlug || name);
  const isActive = formData.get("isActive") === "on";

  if (!name) {
    return { message: "Product name is required." };
  }

  if (!slug) {
    return { message: "Product slug is required." };
  }

  return {
    name,
    slug,
    isActive,
  };
}

function isProductFormState(
  value: ProductMutationInput | ProductFormState,
): value is ProductFormState {
  return "message" in value;
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function handleProductMutationError(error: unknown): ProductFormState {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return {
      message: "A product with this slug already exists.",
    };
  }

  console.error("Product mutation failed.", error);
  return {
    message: "We couldn't save this product. Please try again.",
  };
}
