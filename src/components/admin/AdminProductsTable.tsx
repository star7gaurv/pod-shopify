"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { updateProductStatusAction } from "@/actions/admin-products";

type AdminProductsTableProduct = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  templates: Array<{
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
  }>;
};

type AdminProductsTableProps = {
  products: AdminProductsTableProduct[];
};

export function AdminProductsTable({ products }: AdminProductsTableProps) {
  const [viewProductId, setViewProductId] = useState<string | null>(null);
  const [toggleProductId, setToggleProductId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const viewProduct =
    products.find((product) => product.id === viewProductId) ?? null;
  const toggleProduct =
    products.find((product) => product.id === toggleProductId) ?? null;

  const orderedProducts = useMemo(
    () => [...products].sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [products],
  );

  useEffect(() => {
    const isAnyModalOpen = Boolean(viewProduct || toggleProduct);
    if (!isAnyModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [toggleProduct, viewProduct]);

  const handleToggleStatus = () => {
    if (!toggleProduct) {
      return;
    }

    setToggleError(null);
    setFeedbackMessage(null);

    startTransition(async () => {
      const result = await updateProductStatusAction(
        toggleProduct.id,
        !toggleProduct.isActive,
      );

      if (!result.success) {
        setToggleError(result.message ?? "We couldn't update this product right now.");
        return;
      }

      setToggleProductId(null);
      setFeedbackMessage(
        toggleProduct.isActive
          ? "Product deactivated successfully."
          : "Product activated successfully.",
      );
    });
  };

  return (
    <>
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/3">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/8">
            <thead className="bg-white/4">
              <tr className="text-left text-xs uppercase tracking-[0.22em] text-white/45">
                <th className="px-5 py-4 font-medium">Name</th>
                <th className="px-5 py-4 font-medium">Slug</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Created</th>
                <th className="px-5 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {orderedProducts.map((product) => (
                <tr key={product.id} className="text-sm text-white/78">
                  <td className="px-5 py-4 font-semibold text-white">
                    {product.name}
                  </td>
                  <td className="px-5 py-4 font-mono text-white/62">
                    {product.slug}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge isActive={product.isActive} />
                  </td>
                  <td className="px-5 py-4 text-white/62">
                    {formatDate(product.createdAt)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFeedbackMessage(null);
                          setViewProductId(product.id);
                        }}
                        className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/4 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/7"
                      >
                        View
                      </button>
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/4 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/7"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setFeedbackMessage(null);
                          setToggleError(null);
                          setToggleProductId(product.id);
                        }}
                        className={[
                          "inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold transition",
                          product.isActive
                            ? "border-amber-400/25 bg-amber-500/10 text-amber-100 hover:border-amber-300/40 hover:bg-amber-500/16"
                            : "border-emerald-400/25 bg-emerald-500/10 text-emerald-100 hover:border-emerald-300/40 hover:bg-emerald-500/16",
                        ].join(" ")}
                      >
                        {product.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {orderedProducts.length === 0 ? (
          <div className="px-5 py-8 text-sm text-white/58">
            No products have been created yet.
          </div>
        ) : null}
      </div>

      {feedbackMessage ? (
        <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {feedbackMessage}
        </div>
      ) : null}

      {viewProduct ? (
        <AdminModal onClose={() => setViewProductId(null)}>
          <div className="space-y-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-white/45">
                Product Overview
              </p>
              <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">
                {viewProduct.name}
              </h2>
              <p className="mt-2 text-sm text-white/62">
                Review the product metadata and linked templates without leaving
                the listing.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InfoCard label="Product Name" value={viewProduct.name} />
              <InfoCard label="Slug" value={viewProduct.slug} mono />
              <InfoCard
                label="Status"
                value={<StatusBadge isActive={viewProduct.isActive} />}
              />
              <InfoCard
                label="Created"
                value={formatDateTime(viewProduct.createdAt)}
              />
              <InfoCard
                label="Updated"
                value={formatDateTime(viewProduct.updatedAt)}
              />
              <InfoCard
                label="Templates"
                value={`${viewProduct.templates.length} template${
                  viewProduct.templates.length === 1 ? "" : "s"
                }`}
              />
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Associated Templates
                  </p>
                  <p className="mt-1 text-sm text-white/58">
                    {viewProduct.templates.length} template
                    {viewProduct.templates.length === 1 ? "" : "s"} linked to this
                    product.
                  </p>
                </div>
              </div>

              {viewProduct.templates.length > 0 ? (
                <div className="mt-4 grid gap-3">
                  {viewProduct.templates.map((template) => (
                    <div
                      key={template.id}
                      className="rounded-2xl border border-white/8 bg-[rgba(255,255,255,0.03)] px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-white">
                            {template.name}
                          </p>
                          <p className="mt-1 font-mono text-xs text-white/45">
                            {template.slug}
                          </p>
                        </div>
                        <span
                          className={[
                            "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                            template.isActive
                              ? "bg-emerald-500/16 text-emerald-200"
                              : "bg-rose-500/14 text-rose-100",
                          ].join(" ")}
                        >
                          {template.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/2 px-4 py-5 text-sm text-white/55">
                  No templates are associated with this product yet.
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setViewProductId(null)}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/4 px-5 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/7"
              >
                Close
              </button>
            </div>
          </div>
        </AdminModal>
      ) : null}

      {toggleProduct ? (
        <AdminModal onClose={() => !isPending && setToggleProductId(null)}>
          <div className="space-y-5">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-white/45">
                Confirm Status Change
              </p>
              <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">
                {toggleProduct.isActive
                  ? "Deactivate this product?"
                  : "Activate this product?"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/62">
                {toggleProduct.isActive
                  ? "Inactive products remain in the admin panel, but they disappear from the live studio product selector."
                  : "Active products become available in the live studio product selector again."}
              </p>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
              <p className="text-sm font-semibold text-white">
                {toggleProduct.name}
              </p>
              <p className="mt-1 font-mono text-xs text-white/48">
                {toggleProduct.slug}
              </p>
            </div>

            {toggleError ? (
              <div className="rounded-2xl border border-red-400/25 bg-red-950/20 px-4 py-3 text-sm text-red-100">
                {toggleError}
              </div>
            ) : null}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setToggleProductId(null)}
                disabled={isPending}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/4 px-5 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/7 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={isPending}
                className={[
                  "inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-2 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(255,74,61,0.24)] transition disabled:cursor-not-allowed disabled:opacity-50",
                  toggleProduct.isActive
                    ? "bg-linear-to-b from-amber-400/90 to-amber-500 hover:-translate-y-0.5"
                    : "bg-linear-to-b from-emerald-400/90 to-emerald-500 hover:-translate-y-0.5",
                ].join(" ")}
              >
                {isPending
                  ? "Updating..."
                  : toggleProduct.isActive
                    ? "Deactivate"
                    : "Activate"}
              </button>
            </div>
          </div>
        </AdminModal>
      ) : null}
    </>
  );
}

function AdminModal({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(2,6,23,0.72)] px-4 py-6 backdrop-blur-md">
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div className="relative z-10 w-full max-w-3xl rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,17,28,0.98),rgba(4,10,17,0.98))] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] lg:p-7">
        {children}
      </div>
    </div>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
        isActive
          ? "border-emerald-400/25 bg-emerald-500/16 text-emerald-200"
          : "border-rose-300/16 bg-rose-500/14 text-rose-100",
      ].join(" ")}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function InfoCard({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-white/42">{label}</p>
      <div
        className={[
          "mt-2 text-sm text-white/78",
          mono ? "font-mono" : "",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}
