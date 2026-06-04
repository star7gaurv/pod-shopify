import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireDashboardShop } from "@/lib/dashboard-auth";

const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-900/40 text-yellow-300",
  processing: "bg-blue-900/40 text-blue-300",
  completed: "bg-green-900/40 text-green-300",
  cancelled: "bg-red-900/40 text-red-300",
};

export default async function DashboardOrders({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const shop = await requireDashboardShop();
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [total, orders] = await Promise.all([
    prisma.order.count({ where: { shopId: shop.id } }),
    prisma.order.findMany({
      where: { shopId: shop.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        orderNumber: true,
        shopifyOrderNumber: true,
        customerName: true,
        quantity: true,
        totalPrice: true,
        status: true,
        fulfillmentStatus: true,
        createdAt: true,
        product: { select: { name: true } },
        template: { select: { name: true } },
        design: { select: { shareToken: true, previewImagePath: true } },
      },
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="text-2xl font-black mb-1">Orders</h1>
      <p className="text-gray-500 text-sm mb-8">{total} total print orders</p>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p>No orders yet.</p>
          <p className="text-sm mt-1">
            Orders appear here when customers customize and buy products from your store.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-gray-900 border border-white/10 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  {order.design?.previewImagePath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={order.design.previewImagePath}
                      alt="Design preview"
                      className="w-14 h-14 rounded-xl object-cover bg-gray-800"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gray-800 flex items-center justify-center text-2xl">
                      🎨
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-white">
                      #{order.shopifyOrderNumber ?? order.orderNumber}
                    </p>
                    <p className="text-gray-400 text-sm">{order.customerName}</p>
                    <p className="text-gray-500 text-xs">
                      {order.product.name} · {order.template.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="text-right">
                    <p className="text-white font-bold">₹{Number(order.totalPrice).toFixed(2)}</p>
                    <p className="text-gray-500 text-xs">qty: {order.quantity}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      STATUS_COLORS[order.status] ?? "bg-gray-700 text-gray-300"
                    }`}
                  >
                    {order.status}
                  </span>
                  <span className="text-xs font-mono text-gray-400">
                    {order.fulfillmentStatus.replace(/_/g, " ")}
                  </span>
                  {order.design?.shareToken && (
                    <a
                      href={`/studio?design=${order.design.shareToken}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 transition-colors"
                    >
                      View Design
                    </a>
                  )}
                </div>
              </div>
              <p className="text-gray-600 text-xs mt-3">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <PageLink page={page - 1} disabled={page <= 1} label="← Prev" />
          <span className="text-gray-500 text-sm">
            Page {page} of {pages}
          </span>
          <PageLink page={page + 1} disabled={page >= pages} label="Next →" />
        </div>
      )}
    </div>
  );
}

function PageLink({
  page,
  disabled,
  label,
}: {
  page: number;
  disabled: boolean;
  label: string;
}) {
  if (disabled) {
    return (
      <span className="px-4 py-2 rounded-xl bg-gray-800 text-sm opacity-40">{label}</span>
    );
  }
  return (
    <Link
      href={`/dashboard/orders?page=${page}`}
      className="px-4 py-2 rounded-xl bg-gray-800 text-sm hover:bg-gray-700 transition-colors"
    >
      {label}
    </Link>
  );
}
