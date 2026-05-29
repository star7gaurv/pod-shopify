import Link from "next/link";
import { notFound } from "next/navigation";
import { updateOrderStatusAction } from "@/actions/admin-orders";
import { AdminOrderStatusForm } from "@/components/admin/AdminOrderStatusForm";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminSession } from "@/lib/admin-auth";
import { buildStudioDesignPath } from "@/lib/designs";
import {
  getOrderStatusBadgeClassName,
  getOrderStatusLabel,
  isOrderStatus,
  type OrderStatus,
} from "@/lib/orders";
import { prisma } from "@/lib/prisma";

export default async function AdminOrderDetailPage(
  props: {
    params: Promise<{ id: string }>;
  },
) {
  const session = await requireAdminSession();
  const { id } = await props.params;
  const order = await prisma.order.findUnique({
    where: {
      id,
    },
    include: {
      design: true,
      product: true,
      template: {
        include: {
          materials: true,
        },
      },
      files: true,
    },
  });

  if (!order) {
    notFound();
  }

  const materialName =
    order.template.materials.find(
      (material) => material.id === order.materialId,
    )?.name ?? "—";
  const designPath = buildStudioDesignPath(order.design.shareToken);
  const currentStatus = isOrderStatus(order.status)
    ? order.status
    : ("pending" as OrderStatus);
  const boundUpdateOrderStatusAction = updateOrderStatusAction.bind(null, order.id);

  return (
    <AdminShell
      title={`Order ${order.orderNumber}`}
      description="Review customer details, linked design information, and update the order status as the job moves forward."
      currentPath="/admin/orders"
      userLabel={session.user.email}
      actions={
        <Link
          href="/admin/orders"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/10 bg-white/4 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/7"
        >
          Back to Orders
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <section className="rounded-3xl border border-white/10 bg-white/3 p-6">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-white/45">
            Customer Info
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <InfoCard label="Customer Name" value={order.customerName} />
            <InfoCard label="Phone" value={order.customerPhone} />
            <InfoCard label="Email" value={order.customerEmail ?? "—"} />
            <div className="rounded-2xl border border-white/8 bg-black/10 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                Status
              </p>
              <div className="mt-2">
                <span
                  className={[
                    "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                    getOrderStatusBadgeClassName(order.status),
                  ].join(" ")}
                >
                  {getOrderStatusLabel(order.status)}
                </span>
              </div>
            </div>
          </div>

          <p className="mt-8 font-mono text-xs uppercase tracking-[0.24em] text-white/45">
            Instructions
          </p>
          <div className="mt-4 rounded-2xl border border-white/8 bg-black/10 px-4 py-4 text-sm leading-6 text-white/72">
            {order.instructions?.trim() || "No special instructions were provided."}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/3 p-6">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-white/45">
            Order Summary
          </p>
          <div className="mt-5 grid gap-4">
            <InfoCard label="Order Number" value={order.orderNumber} />
            <InfoCard label="Product" value={order.product.name} />
            <InfoCard label="Template" value={order.template.name} />
            <InfoCard label="Material" value={materialName} />
            <InfoCard label="Quantity" value={String(order.quantity)} />
            <InfoCard
              label="Price Per Item"
              value={`$${Number(order.pricePerItem)}`}
            />
            <InfoCard label="Total Price" value={`$${Number(order.totalPrice)}`} />
            <InfoCard
              label="Created Date"
              value={order.createdAt.toLocaleString()}
            />
          </div>

          <AdminOrderStatusForm
            action={boundUpdateOrderStatusAction}
            currentStatus={currentStatus}
          />
        </section>
      </div>

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/3 p-6">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-white/45">
          Linked Saved Design
        </p>
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-white/55">Share Token</p>
            <p className="mt-1 font-mono text-sm text-white">
              {order.design.shareToken}
            </p>
          </div>
          <Link
            href={designPath}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-linear-to-b from-[var(--accent-soft)] to-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(255,74,61,0.24)] transition hover:-translate-y-0.5"
          >
            Open Saved Design
          </Link>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/3 p-6">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-white/45">
          Attached Files
        </p>
        {order.files.length > 0 ? (
          <div className="mt-5 grid gap-4">
            {order.files.map((file) => (
              <div
                key={file.id}
                className="flex flex-col gap-4 rounded-2xl border border-white/8 bg-black/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{file.fileName}</p>
                  <p className="mt-1 text-xs text-white/55">
                    {file.mimeType ?? "Unknown type"}
                    {typeof file.fileSize === "number"
                      ? ` • ${formatFileSize(file.fileSize)}`
                      : ""}
                  </p>
                </div>
                <a
                  href={file.filePath}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/4 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/7"
                >
                  Open File
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/3 px-5 py-6 text-sm text-white/58">
            No files were attached to this order.
          </div>
        )}
      </section>
    </AdminShell>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/10 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.18em] text-white/45">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
