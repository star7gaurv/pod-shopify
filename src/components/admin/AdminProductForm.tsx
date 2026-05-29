"use client";

import { useActionState, useState } from "react";
import {
  INITIAL_PRODUCT_FORM_STATE,
  type ProductFormState,
} from "@/lib/admin/product-form";

type AdminProductFormProps = {
  action: (
    state: ProductFormState,
    formData: FormData,
  ) => Promise<ProductFormState>;
  submitLabel: string;
  initialValues?: {
    name: string;
    slug: string;
    isActive: boolean;
  };
};

export function AdminProductForm({
  action,
  submitLabel,
  initialValues,
}: AdminProductFormProps) {
  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(
    action,
    INITIAL_PRODUCT_FORM_STATE,
  );
  const [name, setName] = useState(initialValues?.name ?? "");
  const [slug, setSlug] = useState(initialValues?.slug ?? "");
  const [isActive, setIsActive] = useState(initialValues?.isActive ?? true);
  const [hasEditedSlug, setHasEditedSlug] = useState(
    Boolean(initialValues?.slug),
  );

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="text-sm text-white/78">Product Name</span>
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
            placeholder="Shirts"
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
            placeholder="shirts"
          />
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/3 px-4 py-3">
          <input
            type="checkbox"
            name="isActive"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-white/10 text-[var(--accent)]"
          />
          <span className="text-sm text-white/78">Active product</span>
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
