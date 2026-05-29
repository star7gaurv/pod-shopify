"use client";

import { useActionState, useEffect, useState } from "react";
import {
  INITIAL_TEMPLATE_FORM_STATE,
  type TemplateFormState,
} from "@/lib/admin/template-form";

type ProductOption = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

type AdminTemplateFormProps = {
  action: (
    state: TemplateFormState,
    formData: FormData,
  ) => Promise<TemplateFormState>;
  submitLabel: string;
  products: ProductOption[];
  initialValues?: {
    productId: string;
    name: string;
    slug: string;
    basePrice: string;
    baseColor: string;
    modelPath: string;
    uvLayoutPath: string;
    isActive: boolean;
  };
};

export function AdminTemplateForm({
  action,
  submitLabel,
  products,
  initialValues,
}: AdminTemplateFormProps) {
  const [state, formAction, pending] = useActionState<TemplateFormState, FormData>(
    action,
    INITIAL_TEMPLATE_FORM_STATE,
  );
  const [productId, setProductId] = useState(
    initialValues?.productId ?? products[0]?.id ?? "",
  );
  const [name, setName] = useState(initialValues?.name ?? "");
  const [slug, setSlug] = useState(initialValues?.slug ?? "");
  const [basePrice, setBasePrice] = useState(initialValues?.basePrice ?? "");
  const [baseColor, setBaseColor] = useState(
    initialValues?.baseColor ?? "#ffffff",
  );
  const [currentModelPath] = useState(initialValues?.modelPath ?? "");
  const [currentUvLayoutPath] = useState(
    initialValues?.uvLayoutPath ?? "",
  );
  const [isActive, setIsActive] = useState(initialValues?.isActive ?? true);
  const [hasEditedSlug, setHasEditedSlug] = useState(
    Boolean(initialValues?.slug),
  );
  const [modelFileName, setModelFileName] = useState("");
  const [uvPreviewSrc, setUvPreviewSrc] = useState(
    initialValues?.uvLayoutPath ?? "",
  );

  useEffect(() => {
    return () => {
      if (uvPreviewSrc.startsWith("blob:")) {
        URL.revokeObjectURL(uvPreviewSrc);
      }
    };
  }, [uvPreviewSrc]);

  return (
    <form action={formAction} className="grid gap-5">
      <input type="hidden" name="currentModelPath" value={currentModelPath} />
      <input type="hidden" name="currentUvLayoutPath" value={currentUvLayoutPath} />
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-sm text-white/78">Product</span>
          <select
            name="productId"
            required
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/4 px-4 text-sm text-white outline-none transition focus:border-white/20"
          >
            <option value="" className="bg-slate-900 text-white">
              Select product
            </option>
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
        </label>

        <label className="block">
          <span className="text-sm text-white/78">Base Price</span>
          <input
            type="number"
            name="basePrice"
            required
            min="0"
            step="1"
            value={basePrice}
            onChange={(event) => setBasePrice(event.target.value)}
            className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/4 px-4 text-white outline-none transition focus:border-white/20"
            placeholder="100"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm text-white/78">Template Name</span>
          <input
            type="text"
            name="name"
            required
            value={name}
            onChange={(event) => {
              const nextName = event.target.value;
              setName(nextName);
              if (!hasEditedSlug) {
                setSlug(slugify(nextName));
              }
            }}
            className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/4 px-4 text-white outline-none transition focus:border-white/20"
            placeholder="Round Neck Half Sleeves Shirt"
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
            placeholder="round-neck-half-sleeves-shirt"
          />
        </label>

        <label className="block">
          <span className="text-sm text-white/78">Base Color</span>
          <div className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-white/4 px-3">
            <input
              type="color"
              name="baseColor"
              value={baseColor}
              onChange={(event) => setBaseColor(event.target.value)}
              className="h-8 w-12 cursor-pointer rounded border border-white/10 bg-transparent p-0"
            />
            <input
              type="text"
              value={baseColor}
              onChange={(event) => setBaseColor(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none"
              placeholder="#ffffff"
            />
          </div>
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/3 px-4 py-3">
          <input
            type="checkbox"
            name="isActive"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-white/10 text-[var(--accent)]"
          />
          <span className="text-sm text-white/78">Active template</span>
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm text-white/78">Model File (.glb)</span>
          <div className="mt-2 rounded-2xl border border-white/10 bg-white/4 p-4">
            <input
              type="file"
              name="modelFile"
              accept=".glb,model/gltf-binary"
              className="block w-full text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setModelFileName(file?.name ?? "");
              }}
            />
            <p className="mt-3 text-sm text-white/62">
              {modelFileName
                ? `Selected file: ${modelFileName}`
                : currentModelPath
                  ? `Current file: ${getFileNameFromPath(currentModelPath)}`
                  : "Upload a .glb model file."}
            </p>
          </div>
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm text-white/78">UV Layout Image</span>
          <div className="mt-2 rounded-2xl border border-white/10 bg-white/4 p-4">
            <input
              type="file"
              name="uvFile"
              accept=".png,.jpg,.jpeg,image/png,image/jpeg"
              className="block w-full text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  setUvPreviewSrc(currentUvLayoutPath);
                  return;
                }

                setUvPreviewSrc((previous) => {
                  if (previous.startsWith("blob:")) {
                    URL.revokeObjectURL(previous);
                  }

                  return URL.createObjectURL(file);
                });
              }}
            />
            <p className="mt-3 text-sm text-white/62">
              {currentUvLayoutPath
                ? `Current file: ${getFileNameFromPath(currentUvLayoutPath)}`
                : "Upload a PNG or JPG UV layout image."}
            </p>
            {uvPreviewSrc ? (
              <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={uvPreviewSrc}
                  alt="UV layout preview"
                  className="max-h-72 w-full rounded-xl object-contain"
                />
              </div>
            ) : null}
          </div>
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

function getFileNameFromPath(value: string) {
  const parts = value.split("/");
  return parts[parts.length - 1] || value;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
