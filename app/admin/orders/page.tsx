import { AdminOrderActions } from "@/components/admin/AdminOrderActions";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminSession } from "@/lib/admin-auth";
import { buildStudioDesignPath } from "@/lib/designs";
import {
  getOrderStatusBadgeClassName,
  getOrderStatusLabel,
} from "@/lib/orders";
import { prisma } from "@/lib/prisma";

export default async function AdminOrdersPage() {
  const session = await requireAdminSession();
  const orders = await prisma.order.findMany({
    include: {
      design: true,
      product: true,
      template: {
        include: {
          materials: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <AdminShell
      title="Orders"
      description="Review guest checkout orders, customer details, linked designs, and current order status from one place."
      currentPath="/admin/orders"
      userLabel={session.user.email}
    >
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/3">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/8">
            <thead className="bg-white/4">
              <tr className="text-left text-xs uppercase tracking-[0.22em] text-white/45">
                <th className="px-5 py-4 font-medium">Order Number</th>
                <th className="px-5 py-4 font-medium">Customer Name</th>
                <th className="px-5 py-4 font-medium">Phone</th>
                <th className="px-5 py-4 font-medium">Email</th>
                <th className="px-5 py-4 font-medium">Product</th>
                <th className="px-5 py-4 font-medium">Template</th>
                <th className="px-5 py-4 font-medium">Material</th>
                <th className="px-5 py-4 font-medium">Quantity</th>
                <th className="px-5 py-4 font-medium">Total Price</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Created At</th>
                <th className="px-5 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {orders.map((order) => {
                const materialName =
                  order.template.materials.find(
                    (material) => material.id === order.materialId,
                  )?.name ?? "—";

                return (
                  <tr key={order.id} className="text-sm text-white/78">
                    <td className="px-5 py-4 font-mono text-white">
                      {order.orderNumber}
                    </td>
                    <td className="px-5 py-4 font-semibold text-white">
                      {order.customerName}
                    </td>
                    <td className="px-5 py-4">{order.customerPhone}</td>
                    <td className="px-5 py-4 text-white/62">
                      {order.customerEmail ?? "—"}
                    </td>
                    <td className="px-5 py-4">{order.product.name}</td>
                    <td className="px-5 py-4 text-white">{order.template.name}</td>
                    <td className="px-5 py-4">{materialName}</td>
                    <td className="px-5 py-4">{order.quantity}</td>
                    <td className="px-5 py-4 font-semibold text-white">
                      ${Number(order.totalPrice)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={[
                          "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                          getOrderStatusBadgeClassName(order.status),
                        ].join(" ")}
                      >
                        {getOrderStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-white/62">
                      {order.createdAt.toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <AdminOrderActions
                        orderId={order.id}
                        designPath={buildStudioDesignPath(order.design.shareToken)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {orders.length === 0 ? (
          <div className="px-5 py-8 text-sm text-white/58">
            No orders have been placed yet.
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
