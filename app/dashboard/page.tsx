import { prisma } from "@/lib/prisma";
import { requireDashboardShop } from "@/lib/dashboard-auth";

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-gray-900 border border-white/10 rounded-2xl p-6">
      <p className="text-gray-500 text-xs uppercase tracking-widest font-mono">{label}</p>
      <p className="text-3xl font-black text-white mt-2">{value}</p>
      {sub && <p className="text-gray-500 text-sm mt-1">{sub}</p>}
    </div>
  );
}

export default async function DashboardOverview() {
  const shop = await requireDashboardShop();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalOrders, pendingOrders, monthOrders, totalDesigns, subscription] =
    await Promise.all([
      prisma.order.count({ where: { shopId: shop.id } }),
      prisma.order.count({ where: { shopId: shop.id, status: "pending" } }),
      prisma.order.findMany({
        where: { shopId: shop.id, createdAt: { gte: startOfMonth } },
        select: { totalPrice: true },
      }),
      prisma.design.count({ where: { shopId: shop.id } }),
      prisma.subscription.findUnique({
        where: { shopId: shop.id },
        select: { status: true, trialEndsAt: true, currentPeriodEnd: true },
      }),
    ]);

  const monthRevenue = monthOrders
    .reduce((sum, o) => sum + Number(o.totalPrice), 0)
    .toFixed(2);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black">Overview</h1>
          <p className="text-gray-500 text-sm mt-1">{shop.shopDomain}</p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase bg-gray-800 text-gray-300 capitalize">
          {shop.plan} plan
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Orders" value={totalOrders} />
        <StatCard label="Pending" value={pendingOrders} sub="need fulfillment" />
        <StatCard label="This Month" value={monthOrders.length} sub="orders" />
        <StatCard label="Revenue (MTD)" value={`₹${monthRevenue}`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard label="Designs Saved" value={totalDesigns} />
        <StatCard
          label="Subscription"
          value={subscription?.status ?? "inactive"}
          sub={
            subscription?.trialEndsAt && subscription.status !== "active"
              ? `Trial ends ${new Date(subscription.trialEndsAt).toLocaleDateString()}`
              : subscription?.currentPeriodEnd
                ? `Renews ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                : undefined
          }
        />
      </div>
    </div>
  );
}
