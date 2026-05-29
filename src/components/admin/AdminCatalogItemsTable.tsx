"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { updateCatalogItemStatusAction } from "@/actions/admin-catalog-items";

type AdminCatalogItemsTableItem = {
  id: string;
  imagePath: string | null;
  ogImagePath: string | null;
  title: string;
  slug: string;
  shortDescription: string;
  description: string | null;
  studioProductName: string | null;
  studioTemplateName: string | null;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
};

type AdminCatalogItemsTableProps = {
  items: AdminCatalogItemsTableItem[];
};

export function AdminCatalogItemsTable({
  items,
}: AdminCatalogItemsTableProps) {
  const [viewItemId, setViewItemId] = useState<string | null>(null);
  const [toggleItemId, setToggleItemId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const viewItem = items.find((item) => item.id === viewItemId) ?? null;
  const toggleItem = items.find((item) => item.id === toggleItemId) ?? null;
  const orderedItems = useMemo(
    () =>
      [...items].sort((left, right) => {
        if (left.sortOrder !== right.sortOrder) {
          return left.sortOrder - right.sortOrder;
        }
        return right.createdAt.localeCompare(left.createdAt);
      }),
    [items],
  );

  useEffect(() => {
    const isAnyModalOpen = Boolean(viewItem || toggleItem);
    if (!isAnyModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [toggleItem, viewItem]);

  const handleToggleStatus = () => {
    if (!toggleItem) {
      return;
    }

    setToggleError(null);
    setFeedbackMessage(null);

    startTransition(async () => {
      const result = await updateCatalogItemStatusAction(
        toggleItem.id,
        !toggleItem.isActive,
      );

      if (!result.success) {
        setToggleError(
          result.message ?? "We couldn't update this catalog item right now.",
        );
        return;
      }

      setToggleItemId(null);
      setFeedbackMessage(
        toggleItem.isActive
          ? "Catalog item deactivated successfully."
          : "Catalog item activated successfully.",
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
                <th className="px-5 py-4 font-medium">Image</th>
                <th className="px-5 py-4 font-medium">Title</th>
                <th className="px-5 py-4 font-medium">Slug</th>
                <th className="px-5 py-4 font-medium">Studio Product</th>
                <th className="px-5 py-4 font-medium">Studio Template</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Featured</th>
                <th className="px-5 py-4 font-medium">Sort</th>
                <th className="px-5 py-4 font-medium">Updated</th>
                <th className="px-5 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {orderedItems.map((item) => (
                <tr key={item.id} className="text-sm text-white/78">
                  <td className="px-5 py-4">
                    {item.imagePath ? (
                      <div className="h-14 w-14 overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imagePath}
                          alt="Catalog item thumbnail"
                          className="h-full w-full rounded-xl object-cover"
                        />
                      </div>
                    ) : (
                      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/3 px-2 text-center text-[11px] font-medium leading-4 text-white/42">
                        No image
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 font-semibold text-white">
                    {item.title}
                  </td>
                  <td className="px-5 py-4 font-mono text-white/62">
                    {item.slug}
                  </td>
                  <td className="px-5 py-4 text-white/68">
                    {item.studioProductName ?? "--"}
                  </td>
                  <td className="px-5 py-4 text-white/68">
                    {item.studioTemplateName ?? "--"}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge isActive={item.isActive} />
                  </td>
                  <td className="px-5 py-4">
                    <FeaturedBadge isFeatured={item.isFeatured} />
                  </td>
                  <td className="px-5 py-4 text-white/62">{item.sortOrder}</td>
                  <td className="px-5 py-4 text-white/62">
                    {formatDate(item.updatedAt)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFeedbackMessage(null);
                          setViewItemId(item.id);
                        }}
                        className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/4 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/7"
                      >
                        View
                      </button>
                      <Link
                        href={`/admin/catalog-items/${item.id}/edit`}
                        className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/4 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/7"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setFeedbackMessage(null);
                          setToggleError(null);
                          setToggleItemId(item.id);
                        }}
                        className={[
                          "inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold transition",
                          item.isActive
                            ? "border-amber-400/25 bg-amber-500/10 text-amber-100 hover:border-amber-300/40 hover:bg-amber-500/16"
                            : "border-emerald-400/25 bg-emerald-500/10 text-emerald-100 hover:border-emerald-300/40 hover:bg-emerald-500/16",
                        ].join(" ")}
                      >
                        {item.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {orderedItems.length === 0 ? (
          <div className="px-5 py-8 text-sm text-white/58">
            No catalog items have been created yet.
          </div>
        ) : null}
      </div>

      {feedbackMessage ? (
        <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {feedbackMessage}
        </div>
      ) : null}

      {viewItem ? (
        <AdminModal onClose={() => setViewItemId(null)}>
          <div className="space-y-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-white/45">
                Catalog Item Overview
              </p>
              <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">
                {viewItem.title}
              </h2>
              <p className="mt-2 text-sm text-white/62">
                Review public-facing catalog metadata and studio linkage without
                leaving the listing.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <ImagePreviewCard
                label="Catalog Image"
                imagePath={viewItem.imagePath}
                alt="Catalog item image preview"
                emptyLabel="No catalog image uploaded"
              />
              <ImagePreviewCard
                label="Social Preview Image"
                imagePath={viewItem.ogImagePath}
                alt="Catalog item social preview"
                emptyLabel="No social preview image uploaded"
              />
              <InfoCard label="Title" value={viewItem.title} />
              <InfoCard label="Slug" value={viewItem.slug} mono />
              <InfoCard
                label="Status"
                value={<StatusBadge isActive={viewItem.isActive} />}
              />
              <InfoCard
                label="Featured"
                value={<FeaturedBadge isFeatured={viewItem.isFeatured} />}
              />
              <InfoCard label="Sort Order" value={String(viewItem.sortOrder)} />
              <InfoCard
                label="Studio Product"
                value={viewItem.studioProductName ?? "--"}
              />
              <InfoCard
                label="Studio Template"
                value={viewItem.studioTemplateName ?? "--"}
              />
              <InfoCard
                label="Created"
                value={formatDateTime(viewItem.createdAt)}
              />
              <InfoCard
                label="Updated"
                value={formatDateTime(viewItem.updatedAt)}
              />
              <InfoCard
                label="Meta Title"
                value={viewItem.metaTitle ?? "--"}
              />
            </div>

            <div className="grid gap-4">
              <InfoCard label="Short Description" value={viewItem.shortDescription} />
              <InfoCard
                label="Description"
                value={
                  viewItem.description ? (
                    <div
                      className="space-y-3 leading-6 text-white/78 [&_a]:text-[var(--accent)] [&_a]:underline [&_h1]:text-2xl [&_h1]:font-black [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:m-0 [&_ul]:space-y-2"
                      dangerouslySetInnerHTML={{ __html: viewItem.description }}
                    />
                  ) : (
                    "--"
                  )
                }
              />
              <InfoCard
                label="Meta Description"
                value={viewItem.metaDescription ?? "--"}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setViewItemId(null)}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/4 px-5 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/7"
              >
                Close
              </button>
            </div>
          </div>
        </AdminModal>
      ) : null}

      {toggleItem ? (
        <AdminModal onClose={() => !isPending && setToggleItemId(null)}>
          <div className="space-y-5">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-white/45">
                Confirm Status Change
              </p>
              <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">
                {toggleItem.isActive
                  ? "Deactivate this catalog item?"
                  : "Activate this catalog item?"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/62">
                {toggleItem.isActive
                  ? "Inactive catalog items remain in the admin panel, but they will be hidden from future public catalog surfaces."
                  : "Active catalog items become available to future public catalog surfaces again."}
              </p>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
              <p className="text-sm font-semibold text-white">
                {toggleItem.title}
              </p>
              <p className="mt-1 font-mono text-xs text-white/48">
                {toggleItem.slug}
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
                onClick={() => setToggleItemId(null)}
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
                  toggleItem.isActive
                    ? "bg-linear-to-b from-amber-400/90 to-amber-500 hover:-translate-y-0.5"
                    : "bg-linear-to-b from-emerald-400/90 to-emerald-500 hover:-translate-y-0.5",
                ].join(" ")}
              >
                {isPending
                  ? "Updating..."
                  : toggleItem.isActive
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

function ImagePreviewCard({
  label,
  imagePath,
  alt,
  emptyLabel,
}: {
  label: string;
  imagePath: string | null;
  alt: string;
  emptyLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-white/42">{label}</p>
      {imagePath ? (
        <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePath}
            alt={alt}
            className="max-h-56 w-full rounded-xl object-contain"
          />
        </div>
      ) : (
        <div className="mt-3 rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-10 text-center text-sm text-white/45">
          {emptyLabel}
        </div>
      )}
    </div>
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[rgba(2,6,23,0.72)] px-4 py-6 backdrop-blur-md">
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-3xl items-start justify-center py-2">
        <div className="max-h-[calc(100vh-3rem)] w-full overflow-y-auto overscroll-contain rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,17,28,0.98),rgba(4,10,17,0.98))] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] lg:p-7">
          {children}
        </div>
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

function FeaturedBadge({ isFeatured }: { isFeatured: boolean }) {
  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
        isFeatured
          ? "border-fuchsia-400/25 bg-fuchsia-500/16 text-fuchsia-200"
          : "border-white/10 bg-white/6 text-white/55",
      ].join(" ")}
    >
      {isFeatured ? "Featured" : "Standard"}
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
