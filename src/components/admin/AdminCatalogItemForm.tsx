"use client";

import { useActionState, useEffect, useState } from "react";
import {
  INITIAL_CATALOG_ITEM_FORM_STATE,
  type CatalogItemFormState,
} from "@/lib/admin/catalog-item-form";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

type ProductOption = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

type TemplateOption = {
  id: string;
  name: string;
  slug: string;
  productId: string;
  isActive: boolean;
};

type AdminCatalogItemFormProps = {
  action: (
    state: CatalogItemFormState,
    formData: FormData,
  ) => Promise<CatalogItemFormState>;
  submitLabel: string;
  products: ProductOption[];
  templates: TemplateOption[];
  initialValues?: {
    title: string;
    slug: string;
    shortDescription: string;
    description: string;
    imagePath: string;
    ogImagePath: string;
    studioProductId: string;
    studioTemplateId: string;
    isActive: boolean;
    isFeatured: boolean;
    sortOrder: number;
    metaTitle: string;
    metaDescription: string;
  };
};

export function AdminCatalogItemForm({
  action,
  submitLabel,
  products,
  templates,
  initialValues,
}: AdminCatalogItemFormProps) {
  const [state, formAction, pending] = useActionState<
    CatalogItemFormState,
    FormData
  >(action, INITIAL_CATALOG_ITEM_FORM_STATE);
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [slug, setSlug] = useState(initialValues?.slug ?? "");
  const [shortDescription, setShortDescription] = useState(
    initialValues?.shortDescription ?? "",
  );
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [currentImagePath] = useState(initialValues?.imagePath ?? "");
  const [currentOgImagePath] = useState(initialValues?.ogImagePath ?? "");
  const [studioProductId, setStudioProductId] = useState(
    initialValues?.studioProductId ?? "",
  );
  const [studioTemplateId, setStudioTemplateId] = useState(
    initialValues?.studioTemplateId ?? "",
  );
  const [isActive, setIsActive] = useState(initialValues?.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(initialValues?.isFeatured ?? false);
  const [sortOrder, setSortOrder] = useState(
    String(initialValues?.sortOrder ?? 0),
  );
  const [metaTitle, setMetaTitle] = useState(initialValues?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(
    initialValues?.metaDescription ?? "",
  );
  const [catalogImagePreviewSrc, setCatalogImagePreviewSrc] = useState(
    initialValues?.imagePath ?? "",
  );
  const [ogImagePreviewSrc, setOgImagePreviewSrc] = useState(
    initialValues?.ogImagePath ?? "",
  );
  const [hasEditedSlug, setHasEditedSlug] = useState(
    Boolean(initialValues?.slug),
  );
  const availableTemplates = templates.filter(
    (template) => template.productId === studioProductId,
  );

  const resolvedStudioTemplateId = availableTemplates.some(
    (template) => template.id === studioTemplateId,
  )
    ? studioTemplateId
    : "";

  useEffect(() => {
    return () => {
      if (catalogImagePreviewSrc.startsWith("blob:")) {
        URL.revokeObjectURL(catalogImagePreviewSrc);
      }

      if (ogImagePreviewSrc.startsWith("blob:")) {
        URL.revokeObjectURL(ogImagePreviewSrc);
      }
    };
  }, [catalogImagePreviewSrc, ogImagePreviewSrc]);

  return (
    <form action={formAction} className="grid gap-5">
      <input type="hidden" name="currentImagePath" value={currentImagePath} />
      <input type="hidden" name="currentOgImagePath" value={currentOgImagePath} />
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="text-sm text-white/78">Title</span>
          <input
            type="text"
            name="title"
            required
            value={title}
            onChange={(event) => {
              const nextTitle = event.target.value;
              setTitle(nextTitle);
              if (!hasEditedSlug) {
                setSlug(slugify(nextTitle));
              }
            }}
            className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/4 px-4 text-white outline-none transition focus:border-white/20"
            placeholder="Half Sleeves Shirts"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm text-white/78">Slug</span>
          <input
            type="text"
            name="slug"
            required
            value={slug}
            onChange={(event) => {
              setHasEditedSlug(true);
              setSlug(slugify(event.target.value));
            }}
            className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/4 px-4 text-white outline-none transition focus:border-white/20"
            placeholder="half-sleeves-shirts"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm text-white/78">Short Description</span>
          <textarea
            name="shortDescription"
            required
            rows={3}
            value={shortDescription}
            onChange={(event) => setShortDescription(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-white outline-none transition focus:border-white/20"
            placeholder="Create custom short sleeve shirts for teams, events, and businesses."
          />
        </label>

        <RichTextEditor
          name="description"
          label="Description"
          value={description}
          onChange={setDescription}
          placeholder="Optional long-form public catalog description."
          helpText="Use basic formatting for future public catalog and product detail content."
        />

        <div className="grid gap-5 md:col-span-2 md:grid-cols-2">
          <label className="block">
            <span className="text-sm text-white/78">Catalog Image</span>
            <p className="mt-1 text-xs text-white/55">
              Used on homepage/catalog/product cards.
            </p>
            <div className="mt-2 rounded-2xl border border-white/10 bg-white/4 p-4">
              <input
                type="file"
                name="imageFile"
                accept="image/png,image/jpeg,image/webp"
                className="block w-full text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    setCatalogImagePreviewSrc(currentImagePath);
                    return;
                  }

                  setCatalogImagePreviewSrc((previous) => {
                    if (previous.startsWith("blob:")) {
                      URL.revokeObjectURL(previous);
                    }

                    return URL.createObjectURL(file);
                  });
                }}
              />
              <p className="mt-3 text-sm text-white/62">
                {currentImagePath
                  ? `Current file: ${getFileNameFromPath(currentImagePath)}`
                  : "Upload a PNG, JPEG, or WEBP image."}
              </p>
              {catalogImagePreviewSrc ? (
                <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={catalogImagePreviewSrc}
                    alt="Catalog item image preview"
                    className="max-h-72 w-full rounded-xl object-contain"
                  />
                </div>
              ) : null}
            </div>
          </label>

          <label className="block">
            <span className="text-sm text-white/78">Social Preview Image</span>
            <p className="mt-1 text-xs text-white/55">
              Used later for Open Graph/social sharing previews.
            </p>
            <div className="mt-2 rounded-2xl border border-white/10 bg-white/4 p-4">
              <input
                type="file"
                name="ogImageFile"
                accept="image/png,image/jpeg,image/webp"
                className="block w-full text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    setOgImagePreviewSrc(currentOgImagePath);
                    return;
                  }

                  setOgImagePreviewSrc((previous) => {
                    if (previous.startsWith("blob:")) {
                      URL.revokeObjectURL(previous);
                    }

                    return URL.createObjectURL(file);
                  });
                }}
              />
              <p className="mt-3 text-sm text-white/62">
                {currentOgImagePath
                  ? `Current file: ${getFileNameFromPath(currentOgImagePath)}`
                  : "Upload a PNG, JPEG, or WEBP image."}
              </p>
              {ogImagePreviewSrc ? (
                <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ogImagePreviewSrc}
                    alt="Catalog item social preview"
                    className="max-h-72 w-full rounded-xl object-contain"
                  />
                </div>
              ) : null}
            </div>
          </label>
        </div>

        <label className="block">
          <span className="text-sm text-white/78">Studio Product</span>
          <select
            name="studioProductId"
            value={studioProductId}
            onChange={(event) => {
              const nextProductId = event.target.value;
              setStudioProductId(nextProductId);
              if (
                !templates.some(
                  (template) =>
                    template.id === studioTemplateId &&
                    template.productId === nextProductId,
                )
              ) {
                setStudioTemplateId("");
              }
            }}
            className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/4 px-4 text-sm text-white outline-none transition focus:border-white/20"
          >
            <option value="" className="bg-slate-900 text-white">
              No linked studio product
            </option>
            {products.map((product) => (
              <option
                key={product.id}
                value={product.id}
                className="bg-slate-900 text-white"
              >
                {product.name}
                {product.isActive ? "" : " (Inactive)"}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm text-white/78">Studio Template</span>
          <select
            name="studioTemplateId"
            value={resolvedStudioTemplateId}
            disabled={!studioProductId}
            onChange={(event) => setStudioTemplateId(event.target.value)}
            className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/4 px-4 text-sm text-white outline-none transition focus:border-white/20 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {!studioProductId ? (
              <option value="" className="bg-slate-900 text-white">
                Select a studio product first
              </option>
            ) : (
              <option value="" className="bg-slate-900 text-white">
                No linked studio template
              </option>
            )}
            {availableTemplates.map((template) => (
              <option
                key={template.id}
                value={template.id}
                className="bg-slate-900 text-white"
              >
                {template.name}
                {template.isActive ? "" : " (Inactive)"}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm text-white/78">Sort Order</span>
          <input
            type="number"
            name="sortOrder"
            required
            step="1"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/4 px-4 text-white outline-none transition focus:border-white/20"
            placeholder="0"
          />
        </label>

        <div className="grid gap-3 md:col-span-2 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/3 px-4 py-3">
            <input
              type="checkbox"
              name="isActive"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-white/10 text-[var(--accent)]"
            />
            <span className="text-sm text-white/78">Active catalog item</span>
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/3 px-4 py-3">
            <input
              type="checkbox"
              name="isFeatured"
              checked={isFeatured}
              onChange={(event) => setIsFeatured(event.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-white/10 text-[var(--accent)]"
            />
            <span className="text-sm text-white/78">Featured catalog item</span>
          </label>
        </div>

        <label className="block md:col-span-2">
          <span className="text-sm text-white/78">Meta Title</span>
          <input
            type="text"
            name="metaTitle"
            value={metaTitle}
            onChange={(event) => setMetaTitle(event.target.value)}
            className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/4 px-4 text-white outline-none transition focus:border-white/20"
            placeholder="Optional SEO title"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm text-white/78">Meta Description</span>
          <textarea
            name="metaDescription"
            rows={4}
            value={metaDescription}
            onChange={(event) => setMetaDescription(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-white outline-none transition focus:border-white/20"
            placeholder="Optional SEO description"
          />
        </label>
      </div>

      {state.message ? (
        <div className="rounded-2xl border border-red-400/25 bg-red-950/20 px-4 py-3 text-sm text-red-100">
          {state.message}
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-linear-to-b from-[var(--accent-soft)] to-[var(--accent)] px-6 py-3 font-semibold text-white shadow-[0_18px_40px_rgba(255,74,61,0.24)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {pending ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getFileNameFromPath(value: string) {
  const parts = value.split("/");
  return parts[parts.length - 1] || value;
}
