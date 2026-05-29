"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { useStudioStore } from "@/store/studioStore";

const swatches = ["#02060b", "#ac81fd", "#f8fafc", "#45ff83", "#ff433b", "#9aa1a9"];

export function LeftPanel() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const products = useStudioStore((state) => state.products);
  const availableTemplates = useStudioStore((state) => state.templates);
  const productsStatus = useStudioStore((state) => state.productsStatus);
  const templatesStatus = useStudioStore((state) => state.templatesStatus);
  const templateStatus = useStudioStore((state) => state.templateStatus);
  const productsError = useStudioStore((state) => state.productsError);
  const templatesError = useStudioStore((state) => state.templatesError);
  const templateError = useStudioStore((state) => state.templateError);
  const selectedProduct = useStudioStore((state) => state.selectedProduct);
  const selectedTemplate = useStudioStore((state) => state.selectedTemplate);
  const currentTemplate = useStudioStore((state) => state.currentTemplate);
  const baseColor = useStudioStore((state) => state.baseColor);
  const uploadedAssets = useStudioStore((state) => state.uploadedAssets);
  const loadProducts = useStudioStore((state) => state.loadProducts);
  const setSelectedProduct = useStudioStore((state) => state.setSelectedProduct);
  const setSelectedTemplate = useStudioStore((state) => state.setSelectedTemplate);
  const setBaseColor = useStudioStore((state) => state.setBaseColor);
  const addUploadedAsset = useStudioStore((state) => state.addUploadedAsset);
  const updateUploadedAsset = useStudioStore((state) => state.updateUploadedAsset);
  const removeUploadedAsset = useStudioStore((state) => state.removeUploadedAsset);
  const queueCanvasAction = useStudioStore((state) => state.queueCanvasAction);
  const frontCanvasJson = useStudioStore((state) => state.frontCanvasJson);
  const backCanvasJson = useStudioStore((state) => state.backCanvasJson);
  const sleevesCanvasJson = useStudioStore((state) => state.sleevesCanvasJson);
  const isTemplateLoading = templateStatus === "loading";
  const isCanvasInteractionDisabled = !currentTemplate || isTemplateLoading;
  const pendingPreviewUrlsRef = useRef(new Map<string, string>());

  useEffect(() => {
    if (productsStatus === "idle") {
      void loadProducts();
    }
  }, [loadProducts, productsStatus]);

  useEffect(() => {
    const previewUrlMap = pendingPreviewUrlsRef.current;
    return () => {
      for (const previewUrl of previewUrlMap.values()) {
        URL.revokeObjectURL(previewUrl);
      }
      previewUrlMap.clear();
    };
  }, []);

  const processFiles = async (files: FileList | File[]) => {
    const supportedFiles = Array.from(files).filter((file) =>
      isSupportedUploadFile(file),
    );

    if (supportedFiles.length === 0) {
      return;
    }

    for (const file of supportedFiles) {
      const previewUrl = URL.createObjectURL(file);
      const assetId = addUploadedAsset({
        name: file.name,
        type: file.type || "image/png",
        url: previewUrl,
        r2Key: null,
        status: "uploading",
        errorMessage: null,
      });
      pendingPreviewUrlsRef.current.set(assetId, previewUrl);

      void uploadTemporaryImage(file)
        .then((uploadedImage) => {
          updateUploadedAsset(assetId, {
            name: uploadedImage.originalFileName,
            type: uploadedImage.mimeType,
            url: uploadedImage.proxyUrl,
            r2Key: uploadedImage.r2Key,
            status: "ready",
            errorMessage: null,
          });
          revokePendingPreviewUrl(assetId, pendingPreviewUrlsRef);
        })
        .catch((error) => {
          console.error("Failed to upload artwork image.", error);
          updateUploadedAsset(assetId, {
            status: "error",
            errorMessage:
              error instanceof Error
                ? error.message
                : "Upload failed. Please remove and try again.",
          });
        });
    }
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) {
      return;
    }

    void processFiles(files);
    event.target.value = "";
  };

  const handleDragOver = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleDragEnter = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }
    setIsDragActive(false);
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    const files = event.dataTransfer.files;
    if (!files?.length) {
      return;
    }

    void processFiles(files);
  };

  const openStudioGuide = () => {
    window.dispatchEvent(new CustomEvent("studio-guide:open"));
  };

  const handleRemoveUploadedAsset = async (
    asset: (typeof uploadedAssets)[number],
  ) => {
    revokePendingPreviewUrl(asset.id, pendingPreviewUrlsRef);
    if (asset.url.startsWith("blob:")) {
      URL.revokeObjectURL(asset.url);
    }

    removeUploadedAsset(asset.id);

    if (!asset.r2Key?.startsWith("temp-uploads/")) {
      return;
    }
    try {
      await fetch("/api/uploads/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ r2Key: asset.r2Key }),
      });
    } catch (error) {
      console.warn("Failed to delete temporary uploaded image.", {
        r2Key: asset.r2Key,
        error,
      });
    }
  };

  const usedAssetUrls = new Set<string>(
    [frontCanvasJson, backCanvasJson, sleevesCanvasJson]
      .filter((value): value is string => typeof value === "string" && value.length > 0)
      .flatMap((value) => {
        try {
          const parsed = JSON.parse(value) as { objects?: Array<Record<string, unknown>> };
          return collectSerializedImageSources(parsed.objects ?? []);
        } catch {
          return [];
        }
      }),
  );
  const uploadingAssetCount = uploadedAssets.filter(
    (asset) => asset.status === "uploading",
  ).length;
  const hasFailedUpload = uploadedAssets.some((asset) => asset.status === "error");

  return (
    <aside className="border border-white/8 bg-linear-to-b from-[rgba(8,17,28,0.98)] to-[rgba(4,10,17,0.96)] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] sm:p-5 lg:p-6">
      <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
        <p className="font-mono text-xs uppercase tracking-[0.26em] text-white/55 sm:tracking-[0.3em]">
          Design Studio
        </p>
        <button
          type="button"
          aria-label="Open studio guide"
          onClick={openStudioGuide}
          className="inline-flex min-h-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70 transition hover:border-[var(--brand-accent-border)] hover:bg-[var(--brand-accent-surface-faint)] hover:text-white"
        >
          Need help?
        </button>
      </div>

      <div className="space-y-4 sm:space-y-5">
        <Field label="Product" tourId="product-select">
          <select
            value={selectedProduct}
            disabled={productsStatus === "loading" || isTemplateLoading}
            onChange={(event) => {
              void setSelectedProduct(event.target.value);
            }}
            className="h-12 w-full rounded-xl border border-white/10 bg-white/4 px-4 text-sm text-white outline-none transition focus:border-white/20 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {productsStatus === "loading" ? (
              <option value="" className="bg-slate-900 text-white">
                Loading products...
              </option>
            ) : productsStatus === "error" ? (
              <option value="" className="bg-slate-900 text-white">
                Failed to load products
              </option>
            ) : (
              <option value="" className="bg-slate-900 text-white">
                Select product
              </option>
            )}
            {products.map((product) => (
              <option
                key={product.id}
                value={product.id}
                className="bg-slate-900 text-white"
              >
                {product.name}
              </option>
            ))}
          </select>
          {productsStatus === "error" && productsError ? (
            <div className="mt-2 flex items-center gap-2">
              <p className="text-xs text-red-200/70">{productsError}</p>
              <button
                type="button"
                onClick={() => void loadProducts()}
                className="text-xs font-semibold text-white/70 transition hover:text-white"
              >
                Retry
              </button>
            </div>
          ) : null}
        </Field>

        <Field label="Template" tourId="template-select">
          <select
            value={selectedTemplate}
            disabled={
              !selectedProduct ||
              templatesStatus === "loading" ||
              templateStatus === "loading" ||
              availableTemplates.length === 0
            }
            onChange={(event) => {
              void setSelectedTemplate(event.target.value);
            }}
            className="h-12 w-full rounded-xl border border-white/10 bg-white/4 px-4 text-sm text-white outline-none transition focus:border-white/20 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {!selectedProduct ? (
              <option value="" className="bg-slate-900 text-white">
                Select product first
              </option>
            ) : templatesStatus === "loading" ? (
              <option value="" className="bg-slate-900 text-white">
                Loading templates...
              </option>
            ) : templatesStatus === "error" ? (
              <option value="" className="bg-slate-900 text-white">
                Failed to load templates
              </option>
            ) : availableTemplates.length === 0 ? (
              <option value="" className="bg-slate-900 text-white">
                No templates available
              </option>
            ) : (
              <option value="" className="bg-slate-900 text-white">
                Select template
              </option>
            )}
            {availableTemplates.map((template) => (
              <option
                key={template.templateId}
                value={template.templateId}
                className="bg-slate-900 text-white"
              >
                {template.templateName}
              </option>
            ))}
          </select>
          {templatesStatus === "error" && templatesError ? (
            <div className="mt-2 flex items-center gap-2">
              <p className="text-xs text-red-200/70">{templatesError}</p>
              <button
                type="button"
                onClick={() => {
                  if (selectedProduct) {
                    void setSelectedProduct(selectedProduct);
                  }
                }}
                className="text-xs font-semibold text-white/70 transition hover:text-white"
              >
                Retry
              </button>
            </div>
          ) : null}
          {templateStatus === "loading" && selectedTemplate ? (
            <p className="mt-2 text-xs text-white/58">Loading design canvas...</p>
          ) : null}
          {templateStatus === "error" && templateError && selectedTemplate ? (
            <div className="mt-2 flex items-center gap-2">
              <p className="text-xs text-red-200/70">{templateError}</p>
              <button
                type="button"
                onClick={() => {
                  if (selectedTemplate) {
                    void setSelectedTemplate(selectedTemplate);
                  }
                }}
                className="text-xs font-semibold text-white/70 transition hover:text-white"
              >
                Retry
              </button>
            </div>
          ) : null}
        </Field>

        <Field label="Color Swatches" tourId="color-swatches">
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {swatches.map((swatch) => {
                const isSelected = baseColor.toLowerCase() === swatch.toLowerCase();

                return (
                  <button
                    key={swatch}
                    type="button"
                    aria-label={`Color ${swatch}`}
                    aria-pressed={isSelected}
                    disabled={isCanvasInteractionDisabled}
                    onClick={() => setBaseColor(swatch)}
                    className={[
                      "h-10 rounded-md border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/70 disabled:cursor-not-allowed disabled:opacity-40",
                      isSelected
                        ? "border-white shadow-[0_0_0_2px_var(--brand-accent-highlight)]"
                        : "border-white/10 hover:border-white/35",
                    ].join(" ")}
                    style={{ backgroundColor: swatch }}
                  />
                );
              })}
            </div>

            <label className="flex h-12 items-center gap-3 rounded-lg border border-white/8 bg-white/3 px-3 text-sm text-white/76">
              <span className="min-w-0 flex-1">Custom color</span>
              <input
                type="color"
                value={baseColor}
                disabled={isCanvasInteractionDisabled}
                onChange={(event) => setBaseColor(event.target.value)}
                className="h-8 w-12 cursor-pointer rounded border border-white/10 bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-40"
              />
            </label>
          </div>
        </Field>

        <Field label="Uploads" tourId="uploads">
          <div className="space-y-2.5">
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.svg,image/jpeg,image/png,image/webp,image/svg+xml"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              disabled={isCanvasInteractionDisabled}
              className={[
                "grid min-h-14 w-full place-items-center rounded-lg border border-dashed px-4 text-center text-sm text-white/70 transition disabled:cursor-not-allowed disabled:opacity-45",
                isDragActive
                  ? "border-[var(--accent)]/70 bg-white/8 shadow-[0_0_0_1px_var(--brand-accent-glow)]"
                  : "border-white/12 bg-white/2 hover:border-white/20 hover:bg-white/5",
              ].join(" ")}
            >
              {isDragActive
                ? "Drop JPG / PNG / WEBP / SVG files here"
                : uploadingAssetCount > 0
                  ? `Uploading ${uploadingAssetCount} image${uploadingAssetCount === 1 ? "" : "s"}...`
                  : uploadedAssets.length > 0
                  ? "Upload another asset or drop files here"
                  : "Upload JPG / PNG / WEBP / SVG or drop files here"}
            </button>
            {hasFailedUpload ? (
              <p className="text-xs text-red-200/75">
                One or more image uploads failed. You can remove them and try again.
              </p>
            ) : null}

            {uploadedAssets.length > 0 ? (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-3">
                {uploadedAssets.map((asset) => {
                  const isUsedOnCanvas = usedAssetUrls.has(asset.url);
                  const isUploading = asset.status === "uploading";
                  const hasUploadError = asset.status === "error";
                  const isReady = !asset.status || asset.status === "ready";

                  return (
                    <div
                      key={asset.id}
                      className="relative overflow-hidden rounded-lg border border-white/10 bg-white/4"
                    >
                      <button
                        type="button"
                        title={`Add ${asset.name}`}
                        disabled={isCanvasInteractionDisabled || !isReady}
                        onClick={() => queueCanvasAction({ type: "addImage", asset })}
                        className="group relative grid aspect-square min-h-16 w-full place-items-center overflow-hidden p-1 transition hover:border-[var(--accent)]/70 disabled:cursor-not-allowed disabled:opacity-45 sm:min-h-0"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={asset.url}
                          alt={asset.name}
                          className={[
                            "max-h-full max-w-full object-contain transition group-hover:scale-105",
                            isUploading ? "scale-[1.02] opacity-45 blur-[1.5px]" : "",
                            hasUploadError ? "opacity-35" : "",
                          ].join(" ")}
                        />
                        {isUploading ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/32">
                            <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                            <span className="text-[11px] font-semibold text-white">
                              Uploading...
                            </span>
                          </div>
                        ) : null}
                        {hasUploadError ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-red-950/55 px-2 text-center">
                            <span className="text-[11px] font-semibold text-red-100">
                              Upload failed
                            </span>
                            <span className="text-[10px] leading-4 text-red-100/80">
                              {asset.errorMessage ?? "Please remove and try again."}
                            </span>
                          </div>
                        ) : null}
                      </button>
                      {!isUploading ? (
                        <button
                          type="button"
                          title={
                            isUsedOnCanvas && isReady
                              ? "Remove this image from the canvas before deleting it."
                              : `Delete ${asset.name}`
                          }
                          disabled={isUsedOnCanvas && isReady}
                          onClick={() =>
                            void handleRemoveUploadedAsset(asset)
                          }
                          className="absolute right-1 top-1 rounded-full border border-white/10 bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white/85 transition hover:border-red-300/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          x
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-white/8 bg-white/2 px-3 py-3 text-xs leading-5 text-white/50">
                Uploaded assets will appear here. Click an asset to place it on
                the active side.
              </div>
            )}
          </div>
        </Field>

        <Field label="Elements">
          <div className="grid grid-cols-2 gap-2">
            <ElementButton
              label="Add Text"
              disabled={isCanvasInteractionDisabled}
              onClick={() => queueCanvasAction({ type: "addText" })}
            />
            <ElementButton
              label="Rectangle"
              disabled={isCanvasInteractionDisabled}
              onClick={() => queueCanvasAction({ type: "addRectangle" })}
            />
            <ElementButton
              label="Circle"
              disabled={isCanvasInteractionDisabled}
              onClick={() => queueCanvasAction({ type: "addCircle" })}
            />
            <ElementButton
              label="Line"
              disabled={isCanvasInteractionDisabled}
              onClick={() => queueCanvasAction({ type: "addLine" })}
            />
          </div>
        </Field>
      </div>
    </aside>
  );
}

function isSupportedUploadFile(file: File) {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  return (
    type === "image/jpeg" ||
    type === "image/png" ||
    type === "image/webp" ||
    type === "image/svg+xml" ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".webp") ||
    name.endsWith(".svg")
  );
}

async function uploadTemporaryImage(file: File) {
  const formData = new FormData();
  formData.set("file", file);

  const response = await fetch("/api/uploads/temp", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(payload?.error || "Failed to upload image.");
  }

  return (await response.json()) as {
    r2Key: string;
    publicUrl: string;
    proxyUrl: string;
    originalFileName: string;
    mimeType: string;
    size: number;
  };
}

function collectSerializedImageSources(
  objects: Array<Record<string, unknown>>,
): string[] {
  return objects.flatMap((object) => collectImageSourcesFromValue(object));
}

function collectImageSourcesFromValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectImageSourcesFromValue(entry));
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const typed = value as Record<string, unknown>;
  const sources =
    typeof typed.src === "string" && typed.src.length > 0 ? [typed.src] : [];

  return sources.concat(
    Object.values(typed).flatMap((entry) => collectImageSourcesFromValue(entry)),
  );
}

function revokePendingPreviewUrl(
  assetId: string,
  previewMapRef: MutableRefObject<Map<string, string>>,
) {
  const previewUrl = previewMapRef.current.get(assetId);
  if (!previewUrl) {
    return;
  }

  URL.revokeObjectURL(previewUrl);
  previewMapRef.current.delete(assetId);
}

function Field({
  label,
  children,
  tourId,
}: {
  label: string;
  children: ReactNode;
  tourId?: string;
}) {
  return (
    <div data-tour={tourId}>
      <label className="mb-2 block text-sm text-white/78">{label}</label>
      {children}
    </div>
  );
}

function ElementButton({
  label,
  disabled = false,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="h-11 rounded-lg border border-white/8 bg-white/3 px-3 text-sm font-medium text-white/78 transition hover:border-white/18 hover:bg-white/6 disabled:cursor-not-allowed disabled:opacity-45"
    >
      {label}
    </button>
  );
}
