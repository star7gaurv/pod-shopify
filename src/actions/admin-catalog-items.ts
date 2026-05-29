"use server";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminActionSession } from "@/lib/admin-auth";
import type { CatalogItemFormState } from "@/lib/admin/catalog-item-form";
import { uploadFile } from "@/lib/r2";
import { clearCatalogCache } from "@/lib/catalog";

type CatalogItemMutationInput = {
  title: string;
  slug: string;
  shortDescription: string;
  description: string | null;
  imagePath: string | null;
  ogImagePath: string | null;
  studioProductId: string | null;
  studioTemplateId: string | null;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  metaTitle: string | null;
  metaDescription: string | null;
};

export async function updateCatalogItemStatusAction(
  catalogItemId: string,
  nextIsActive: boolean,
) {
  await requireAdminActionSession();

  const existingCatalogItem = await prisma.catalogItem.findUnique({
    where: {
      id: catalogItemId,
    },
    select: {
      id: true,
      slug: true,
    },
  });

  if (!existingCatalogItem) {
    return {
      success: false,
      message: "Catalog item not found.",
    };
  }

  try {
    await prisma.catalogItem.update({
      where: {
        id: catalogItemId,
      },
      data: {
        isActive: nextIsActive,
      },
    });
  } catch (error) {
    console.error("Catalog item status update failed.", error);
    return {
      success: false,
      message: "We couldn't update this catalog item right now.",
    };
  }

  await clearCatalogCache([existingCatalogItem.slug]);
  revalidateCatalogAdminPaths(catalogItemId);

  return {
    success: true,
  };
}

export async function createCatalogItemAction(
  _prevState: CatalogItemFormState,
  formData: FormData,
): Promise<CatalogItemFormState> {
  await requireAdminActionSession();

  const parsed = await parseCatalogItemFormData(formData);
  if (isCatalogItemFormState(parsed)) {
    return parsed;
  }

  try {
    await prisma.catalogItem.create({
      data: parsed,
    });
  } catch (error) {
    return handleCatalogItemMutationError(error);
  }

  await clearCatalogCache([parsed.slug]);
  revalidateCatalogAdminPaths();
  redirect("/admin/catalog-items");
}

export async function updateCatalogItemAction(
  catalogItemId: string,
  _prevState: CatalogItemFormState,
  formData: FormData,
): Promise<CatalogItemFormState> {
  await requireAdminActionSession();

  const existingCatalogItem = await prisma.catalogItem.findUnique({
    where: {
      id: catalogItemId,
    },
    select: {
      id: true,
      slug: true,
    },
  });

  if (!existingCatalogItem) {
    return {
      message: "Catalog item not found.",
    };
  }

  const parsed = await parseCatalogItemFormData(formData);
  if (isCatalogItemFormState(parsed)) {
    return parsed;
  }

  try {
    await prisma.catalogItem.update({
      where: {
        id: catalogItemId,
      },
      data: parsed,
    });
  } catch (error) {
    return handleCatalogItemMutationError(error);
  }

  await clearCatalogCache([existingCatalogItem.slug, parsed.slug]);
  revalidateCatalogAdminPaths(catalogItemId);
  redirect("/admin/catalog-items");
}

async function parseCatalogItemFormData(
  formData: FormData,
): Promise<CatalogItemMutationInput | CatalogItemFormState> {
  const title = String(formData.get("title") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const slug = normalizeSlug(rawSlug || title);
  const shortDescription = String(formData.get("shortDescription") ?? "").trim();
  const description = normalizeNullableText(formData.get("description"));
  const currentImagePath = normalizeNullableText(formData.get("currentImagePath"));
  const currentOgImagePath = normalizeNullableText(formData.get("currentOgImagePath"));
  const studioProductId = normalizeNullableText(formData.get("studioProductId"));
  const studioTemplateId = normalizeNullableText(formData.get("studioTemplateId"));
  const isActive = formData.get("isActive") === "on";
  const isFeatured = formData.get("isFeatured") === "on";
  const sortOrderRaw = String(formData.get("sortOrder") ?? "").trim() || "0";
  const metaTitle = normalizeNullableText(formData.get("metaTitle"));
  const metaDescription = normalizeNullableText(formData.get("metaDescription"));

  if (!title) {
    return {
      message: "Catalog item title is required.",
    };
  }

  if (!slug) {
    return {
      message: "Catalog item slug is required.",
    };
  }

  if (!shortDescription) {
    return {
      message: "Short description is required.",
    };
  }

  const sortOrder = Number(sortOrderRaw);
  if (!Number.isInteger(sortOrder)) {
    return {
      message: "Sort order must be a whole number.",
    };
  }

  if (studioTemplateId && !studioProductId) {
    return {
      message: "Select a studio product before choosing a studio template.",
    };
  }

  if (studioProductId) {
    const product = await prisma.product.findUnique({
      where: {
        id: studioProductId,
      },
      select: {
        id: true,
      },
    });

    if (!product) {
      return {
        message: "Selected studio product was not found.",
      };
    }
  }

  if (studioTemplateId) {
    const template = await prisma.template.findUnique({
      where: {
        id: studioTemplateId,
      },
      select: {
        id: true,
        productId: true,
      },
    });

    if (!template) {
      return {
        message: "Selected studio template was not found.",
      };
    }

    if (template.productId !== studioProductId) {
      return {
        message: "Selected studio template does not belong to the selected studio product.",
      };
    }
  }

  const uploadResult = await uploadCatalogItemImages({
    formData,
    catalogItemSlug: slug,
    currentImagePath,
    currentOgImagePath,
  });
  if ("message" in uploadResult) {
    return uploadResult;
  }

  return {
    title,
    slug,
    shortDescription,
    description,
    imagePath: uploadResult.imagePath,
    ogImagePath: uploadResult.ogImagePath,
    studioProductId,
    studioTemplateId,
    isActive,
    isFeatured,
    sortOrder,
    metaTitle,
    metaDescription,
  };
}

function isCatalogItemFormState(
  value: CatalogItemMutationInput | CatalogItemFormState,
): value is CatalogItemFormState {
  return "message" in value;
}

function normalizeNullableText(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uploadCatalogItemImages({
  formData,
  catalogItemSlug,
  currentImagePath,
  currentOgImagePath,
}: {
  formData: FormData;
  catalogItemSlug: string;
  currentImagePath: string | null;
  currentOgImagePath: string | null;
}): Promise<
  | {
      imagePath: string | null;
      ogImagePath: string | null;
    }
  | CatalogItemFormState
> {
  const imageResult = await persistCatalogItemImage({
    file: formData.get("imageFile"),
    currentPath: currentImagePath,
    catalogItemSlug,
    imageRole: "image",
    errorLabel: "Catalog image",
  });

  if ("message" in imageResult) {
    return imageResult;
  }

  const ogImageResult = await persistCatalogItemImage({
    file: formData.get("ogImageFile"),
    currentPath: currentOgImagePath,
    catalogItemSlug,
    imageRole: "og",
    errorLabel: "Social preview image",
  });

  if ("message" in ogImageResult) {
    return ogImageResult;
  }

  return {
    imagePath: imageResult.path,
    ogImagePath: ogImageResult.path,
  };
}

async function persistCatalogItemImage({
  file,
  currentPath,
  catalogItemSlug,
  imageRole,
  errorLabel,
}: {
  file: FormDataEntryValue | null;
  currentPath: string | null;
  catalogItemSlug: string;
  imageRole: "image" | "og";
  errorLabel: string;
}): Promise<{ path: string | null } | CatalogItemFormState> {
  if (!(file instanceof File) || file.size === 0) {
    return {
      path: currentPath,
    };
  }

  if (!isAllowedCatalogImageType(file.type)) {
    return {
      message: `${errorLabel} must be a PNG, JPEG, or WEBP file.`,
    };
  }

  if (file.size > 5 * 1024 * 1024) {
    return {
      message: `${errorLabel} must be 5MB or smaller.`,
    };
  }

  const extension = getImageExtension(file);
  if (!extension) {
    return {
      message: `${errorLabel} must be a PNG, JPEG, or WEBP file.`,
    };
  }

  const safeSlug = normalizeSlug(catalogItemSlug) || "catalog-item";
  const timestamp = Date.now();
  const suffix = randomUUID().slice(0, 8);
  const fileName = `${imageRole}-${timestamp}-${suffix}.${extension}`;
  const key = `catalog/items/${safeSlug}/${fileName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const path = await uploadFile({
    body: buffer,
    key,
    contentType: file.type || undefined,
    cacheControl: "public, max-age=31536000, immutable",
  });

  return {
    path,
  };
}

function isAllowedCatalogImageType(contentType: string) {
  return (
    contentType === "image/png" ||
    contentType === "image/jpeg" ||
    contentType === "image/webp"
  );
}

function getImageExtension(file: File) {
  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/jpeg") {
    return "jpg";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  return null;
}

function handleCatalogItemMutationError(
  error: unknown,
): CatalogItemFormState {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return {
      message: "A catalog item with this slug already exists.",
    };
  }

  console.error("Catalog item mutation failed.", error);
  return {
    message: "We couldn't save this catalog item. Please try again.",
  };
}

function revalidateCatalogAdminPaths(catalogItemId?: string) {
  revalidatePath("/admin/catalog-items");
  revalidatePath("/admin/catalog-items/create");
  if (catalogItemId) {
    revalidatePath(`/admin/catalog-items/${catalogItemId}/edit`);
  }
}
