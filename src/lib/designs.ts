import { randomUUID } from "node:crypto";
import type {
  Design,
  DesignAsset,
  Product,
  Template,
  TemplateMaterial,
  TemplateSizeChart,
} from "@prisma/client";
import type { UploadedAsset } from "@/store/studioStore";
import { mapProductToStudioProduct, mapTemplateToStudioTemplateDefinition, mapTemplateToStudioTemplateSummary } from "@/lib/studio-db";
import { uploadFile } from "@/lib/r2";
import {
  buildUploadedImageProxyUrl,
  promoteTempUploadedImages,
  resolveUploadedImageR2Key,
} from "@/lib/studio-uploads";
import type { StudioSavedDesign } from "@/types/designs";

type DesignWithRelations = Design & {
  product: Product;
  template: Template & {
    product: Product;
    materials: TemplateMaterial[];
    sizeCharts: TemplateSizeChart[];
  };
  assets?: DesignAsset[];
};

export function buildStudioDesignPath(shareToken: string) {
  return `/studio?design=${encodeURIComponent(shareToken)}`;
}

export function parseDesignCanvasJson(value: string) {
  return JSON.parse(value) as object;
}

export function normalizeUploadedAssets(value: unknown): UploadedAsset[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry, index) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const typed = entry as Partial<UploadedAsset>;
    if (
      typeof typed.name !== "string" ||
      typeof typed.url !== "string" ||
      typeof typed.type !== "string"
    ) {
      return [];
    }

    return [
      {
        id:
          typeof typed.id === "string" && typed.id.length > 0
            ? typed.id
            : `saved-asset-${index}`,
        name: typed.name,
        url: normalizeUploadedAssetUrl(typed.url, typed.r2Key),
        type: typed.type,
        r2Key:
          typeof typed.r2Key === "string" && typed.r2Key.length > 0
            ? typed.r2Key
            : null,
      },
    ];
  });
}

export async function prepareStudioDesignForPersistence(input: {
  canvasJson: string;
  uploadedAssets: UploadedAsset[];
}) {
  const parsedCanvasJson = parseDesignCanvasJson(input.canvasJson);
  return (await promoteTempUploadedImages({
    canvasJson: parsedCanvasJson,
    uploadedAssets: input.uploadedAssets,
  })) as {
    canvasJson: ReturnType<typeof parseDesignCanvasJson>;
    uploadedAssets: UploadedAsset[];
  };
}

export async function saveDesignPreviewImage(
  shareToken: string,
  previewDataUrl: string | null,
) {
  if (!previewDataUrl?.startsWith("data:image/")) {
    return null;
  }

  const match = previewDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    return null;
  }

  const [, mimeType, base64] = match;
  const extension = getPreviewExtension(mimeType);
  const fileName = `${shareToken}-${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
  const key = `designs/previews/${fileName}`;

  return uploadFile({
    body: base64,
    isBase64: true,
    key,
    contentType: mimeType,
    cacheControl: "public, max-age=31536000, immutable",
  });
}

export function mapDesignToStudioSavedDesign(
  design: DesignWithRelations,
): StudioSavedDesign {
  const uploadedAssets = normalizeUploadedAssets(
    design.designMeta && typeof design.designMeta === "object"
      ? (design.designMeta as { uploadedAssets?: unknown }).uploadedAssets
      : [],
  );

  return {
    id: design.id,
    shareToken: design.shareToken,
    publicPath: buildStudioDesignPath(design.shareToken),
    productId: design.product.slug,
    templateId: design.template.slug,
    selectedMaterialId: design.materialId,
    baseColor: design.baseColor,
    canvasJson: JSON.stringify(
      normalizeCanvasJsonForStudio(design.canvasJson, uploadedAssets),
    ),
    previewImageUrl: design.previewImagePath ?? null,
    isFeatured: design.isFeatured,
    isLocked: design.isLocked,
    parentDesignId: design.parentDesignId ?? null,
    uploadedAssets,
    product: mapProductToStudioProduct(design.product),
    templateSummary: mapTemplateToStudioTemplateSummary(design.template),
    template: mapTemplateToStudioTemplateDefinition(design.template),
  };
}

function normalizeUploadedAssetUrl(url: string, r2Key?: unknown) {
  const resolvedR2Key =
    typeof r2Key === "string" && r2Key.length > 0
      ? r2Key
      : resolveUploadedImageR2Key(url);
  return resolvedR2Key ? buildUploadedImageProxyUrl(resolvedR2Key) : url;
}

function normalizeCanvasJsonForStudio(
  canvasJson: unknown,
  uploadedAssets: UploadedAsset[],
) {
  const urlToAssetKey = new Map<string, string>();
  for (const asset of uploadedAssets) {
    if (asset.r2Key) {
      urlToAssetKey.set(asset.url, asset.r2Key);
    }
  }

  return replaceCanvasImageUrlsWithProxy(canvasJson, urlToAssetKey);
}

function replaceCanvasImageUrlsWithProxy(
  value: unknown,
  urlToAssetKey: Map<string, string>,
): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => replaceCanvasImageUrlsWithProxy(entry, urlToAssetKey));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const typed = value as Record<string, unknown>;
  const next: Record<string, unknown> = {};
  const explicitR2Key =
    typeof typed.assetR2Key === "string"
      ? typed.assetR2Key
      : typeof typed.r2Key === "string"
        ? typed.r2Key
        : null;
  const resolvedSrcKey =
    typeof typed.src === "string"
      ? resolveUploadedImageR2Key(typed.src, explicitR2Key)
      : explicitR2Key;

  for (const [key, entry] of Object.entries(typed)) {
    if (key === "src" && typeof entry === "string" && resolvedSrcKey) {
      next[key] = buildUploadedImageProxyUrl(resolvedSrcKey);
      continue;
    }

    if ((key === "assetUrl" || key === "url") && typeof entry === "string") {
      const resolvedAssetKey =
        resolveUploadedImageR2Key(entry, explicitR2Key) ?? urlToAssetKey.get(entry);
      next[key] = resolvedAssetKey ? buildUploadedImageProxyUrl(resolvedAssetKey) : entry;
      continue;
    }

    next[key] = replaceCanvasImageUrlsWithProxy(entry, urlToAssetKey);
  }

  return next;
}

function getPreviewExtension(mimeType: string) {
  const normalized = mimeType.toLowerCase();
  if (normalized.includes("jpeg") || normalized.includes("jpg")) {
    return "jpg";
  }
  if (normalized.includes("webp")) {
    return "webp";
  }
  return "png";
}
