"use server";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminActionSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { deleteCache, getStudioTemplatesByProductCacheKey } from "@/lib/redis";
import { uploadFile } from "@/lib/r2";
import type { TemplateFormState } from "@/lib/admin/template-form";

type TemplateMutationInput = {
  productId: string;
  name: string;
  slug: string;
  basePrice: Prisma.Decimal;
  baseColor: string;
  modelPath: string;
  uvLayoutPath: string;
  isActive: boolean;
};

export async function createTemplateAction(
  _prevState: TemplateFormState,
  formData: FormData,
): Promise<TemplateFormState> {
  await requireAdminActionSession();

  const parsed = await parseTemplateFormData(formData);
  if (isTemplateFormState(parsed)) {
    return parsed;
  }

  try {
    await prisma.template.create({
      data: parsed,
    });
  } catch (error) {
    return handleTemplateMutationError(error);
  }

  const product = await prisma.product.findUnique({
    where: {
      id: parsed.productId,
    },
    select: {
      slug: true,
    },
  });
  if (product?.slug) {
    await deleteCache(getStudioTemplatesByProductCacheKey(product.slug));
  }

  revalidatePath("/admin/templates");
  redirect("/admin/templates");
}

export async function updateTemplateAction(
  templateId: string,
  _prevState: TemplateFormState,
  formData: FormData,
): Promise<TemplateFormState> {
  await requireAdminActionSession();

  const parsed = await parseTemplateFormData(formData);
  if (isTemplateFormState(parsed)) {
    return parsed;
  }

  const existingTemplate = await prisma.template.findUnique({
    where: {
      id: templateId,
    },
    select: {
      product: {
        select: {
          slug: true,
        },
      },
    },
  });

  try {
    await prisma.template.update({
      where: {
        id: templateId,
      },
      data: parsed,
    });
  } catch (error) {
    return handleTemplateMutationError(error);
  }

  if (existingTemplate?.product.slug) {
    await deleteCache(
      getStudioTemplatesByProductCacheKey(existingTemplate.product.slug),
    );
  }

  const nextProduct = await prisma.product.findUnique({
    where: {
      id: parsed.productId,
    },
    select: {
      slug: true,
    },
  });
  if (nextProduct?.slug) {
    await deleteCache(getStudioTemplatesByProductCacheKey(nextProduct.slug));
  }

  revalidatePath("/admin/templates");
  redirect("/admin/templates");
}

export async function uploadTemplateAssets(
  formData: FormData,
  templateSlug: string,
): Promise<
  | {
      modelPath: string;
      uvLayoutPath: string;
    }
  | TemplateFormState
> {
  const currentModelPath = String(formData.get("currentModelPath") ?? "").trim();
  const currentUvLayoutPath = String(formData.get("currentUvLayoutPath") ?? "").trim();
  const modelFile = formData.get("modelFile");
  const uvFile = formData.get("uvFile");

  const modelResult = await persistTemplateAsset({
    file: modelFile,
    currentPath: currentModelPath,
    keyPrefix: "templates/models",
    templateSlug,
    fileRole: "model",
    allowedExtensions: [".glb"],
    errorMessage: "Model file must be a .glb file.",
    enforceImageMime: false,
  });

  if ("message" in modelResult) {
    return modelResult;
  }

  const uvResult = await persistTemplateAsset({
    file: uvFile,
    currentPath: currentUvLayoutPath,
    keyPrefix: "templates/uv",
    templateSlug,
    fileRole: "uv",
    allowedExtensions: [".png", ".jpg", ".jpeg"],
    errorMessage: "UV layout file must be a .png or .jpg image.",
    enforceImageMime: true,
  });

  if ("message" in uvResult) {
    return uvResult;
  }

  return {
    modelPath: modelResult.path,
    uvLayoutPath: uvResult.path,
  };
}

async function parseTemplateFormData(
  formData: FormData,
): Promise<TemplateMutationInput | TemplateFormState> {
  const productId = String(formData.get("productId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const slug = normalizeSlug(rawSlug || name);
  const basePriceRaw = String(formData.get("basePrice") ?? "").trim();
  const baseColor = String(formData.get("baseColor") ?? "").trim() || "#ffffff";
  const isActive = formData.get("isActive") === "on";

  if (!productId) {
    return { message: "Please select a product." };
  }

  if (!name) {
    return { message: "Template name is required." };
  }

  if (!slug) {
    return { message: "Template slug is required." };
  }

  if (!basePriceRaw) {
    return { message: "Base price is required." };
  }

  const basePriceNumber = Number(basePriceRaw);
  if (!Number.isFinite(basePriceNumber) || basePriceNumber < 0) {
    return { message: "Base price must be a valid positive number." };
  }

  const uploadResult = await uploadTemplateAssets(formData, slug);
  if ("message" in uploadResult) {
    return uploadResult;
  }

  const { modelPath, uvLayoutPath } = uploadResult;

  if (!modelPath) {
    return { message: "Model file is required." };
  }

  if (!uvLayoutPath) {
    return { message: "UV layout image is required." };
  }

  return {
    productId,
    name,
    slug,
    basePrice: new Prisma.Decimal(basePriceNumber),
    baseColor,
    modelPath,
    uvLayoutPath,
    isActive,
  };
}

async function persistTemplateAsset({
  file,
  currentPath,
  keyPrefix,
  templateSlug,
  fileRole,
  allowedExtensions,
  errorMessage,
  enforceImageMime,
}: {
  file: FormDataEntryValue | null;
  currentPath: string;
  keyPrefix: string;
  templateSlug: string;
  fileRole: "model" | "uv";
  allowedExtensions: string[];
  errorMessage: string;
  enforceImageMime: boolean;
}): Promise<{ path: string } | TemplateFormState> {
  if (!(file instanceof File) || file.size === 0) {
    return { path: currentPath };
  }

  const extension = getFileExtension(file.name);
  if (!allowedExtensions.includes(extension)) {
    return { message: errorMessage };
  }

  if (enforceImageMime && !file.type.startsWith("image/")) {
    return { message: errorMessage };
  }

  const fileName = buildTemplateAssetFileName({
    templateSlug,
    fileRole,
    extension,
  });
  const buffer = Buffer.from(await file.arrayBuffer());
  const path = await uploadFile({
    body: buffer,
    key: `${keyPrefix}/${fileName}`,
    contentType: file.type || undefined,
    cacheControl: "public, max-age=31536000, immutable",
  });

  return { path };
}

function isTemplateFormState(
  value: TemplateMutationInput | TemplateFormState,
): value is TemplateFormState {
  return "message" in value;
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildTemplateAssetFileName({
  templateSlug,
  fileRole,
  extension,
}: {
  templateSlug: string;
  fileRole: "model" | "uv";
  extension: string;
}) {
  const safeSlug = normalizeSlug(templateSlug) || "template";
  const timestamp = Date.now();
  const suffix = randomUUID().slice(0, 8);
  const roleSuffix = fileRole === "uv" ? "-uv" : "";
  return `${safeSlug}-${timestamp}-${suffix}${roleSuffix}${extension}`;
}

function getFileExtension(fileName: string) {
  const normalized = fileName.trim().toLowerCase();
  const dotIndex = normalized.lastIndexOf(".");
  return dotIndex >= 0 ? normalized.slice(dotIndex) : "";
}

function handleTemplateMutationError(error: unknown): TemplateFormState {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return {
      message: "A template with this slug already exists.",
    };
  }

  console.error("Template mutation failed.", error);
  return {
    message: "We couldn't save this template. Please try again.",
  };
}
