"use client";

import { useEffect, useState, useCallback } from "react";

type Order = {
  id: string;
  orderNumber: string;
  shopifyOrderNumber?: string;
  customerName: string;
  customerEmail?: string;
  quantity: number;
  totalPrice: string;
  status: string;
  fulfillmentStatus: string;
  createdAt: string;
  product: { name: string };
  template: { name: string };
  design: { shareToken: string; previewImagePath?: string };
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-900/40 text-yellow-300",
  processing: "bg-blue-900/40 text-blue-300",
  completed: "bg-green-900/40 text-green-300",
  cancelled: "bg-red-900/40 text-red-300",
};

const FULFILLMENT_COLORS: Record<string, string> = {
  pending: "text-yellow-400",
  sent_to_printer: "text-blue-400",
  fulfilled: "text-green-400",
  failed: "text-red-400",
};

export default function MerchantOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadOrders = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/merchant/orders?page=${p}`);
      const data = (await res.json()) as { orders: Order[]; total: number; page: number; pages: number };
      setOrders(data.orders ?? []);
      setTotal(data.total ?? 0);
      setPage(data.page ?? 1);
      setPages(data.pages ?? 1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders(1);
  }, [loadOrders]);

  async function updateStatus(orderId: string, status: string) {
    setUpdating(orderId);
    await fetch("/api/merchant/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    });
    setUpdating(null);
    void loadOrders(page);
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Orders</h1>
          <p className="text-gray-500 text-sm mt-1">{total} total print orders</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-900 border border-white/8 rounded-2xl p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">📭</p>
          <p>No orders yet.</p>
          <p className="text-sm mt-1">Orders appear here when customers customize and buy products from your store.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="bg-gray-900 border border-white/8 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    {order.design.previewImagePath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={order.design.previewImagePath}
                        alt="Design preview"
                        className="w-14 h-14 rounded-xl object-cover bg-gray-800"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gray-800 flex items-center justify-center text-2xl">🎨</div>
                    )}
                    <div>
                      <p className="font-semibold text-white">
                        #{order.shopifyOrderNumber ?? order.orderNumber}
                      </p>
                      <p className="text-gray-400 text-sm">{order.customerName}</p>
                      <p className="text-gray-500 text-xs">{order.product.name} · {order.template.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="text-right">
                      <p className="text-white font-bold">₹{Number(order.totalPrice).toFixed(2)}</p>
                      <p className="text-gray-500 text-xs">qty: {order.quantity}</p>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status] ?? "bg-gray-700 text-gray-300"}`}>
                      {order.status}
                    </span>

                    <span className={`text-xs font-mono ${FULFILLMENT_COLORS[order.fulfillmentStatus] ?? "text-gray-400"}`}>
                      {order.fulfillmentStatus.replace(/_/g, " ")}
                    </span>

                    <select
                      value={order.status}
                      disabled={updating === order.id}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className="h-9 rounded-lg border border-white/10 bg-gray-800 px-2 text-xs text-white outline-none focus:border-pink-500 disabled:opacity-50"
                    >
                      <option value="pending">pending</option>
                      <option value="processing">processing</option>
                      <option value="completed">completed</option>
                      <option value="cancelled">cancelled</option>
                    </select>

                    <a
                      href={`/studio?design=${order.design.shareToken}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 transition-colors"
                    >
                      View Design
                    </a>
                  </div>
                </div>
                <p className="text-gray-600 text-xs mt-3">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => loadOrders(page - 1)}
                disabled={page <= 1}
                className="px-4 py-2 rounded-xl bg-gray-800 text-sm disabled:opacity-40 hover:bg-gray-700 transition-colors"
              >
                ← Prev
              </button>
              <span className="text-gray-500 text-sm">
                Page {page} of {pages}
              </span>
              <button
                onClick={() => loadOrders(page + 1)}
                disabled={page >= pages}
                className="px-4 py-2 rounded-xl bg-gray-800 text-sm disabled:opacity-40 hover:bg-gray-700 transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
