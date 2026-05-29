import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminSession } from "@/lib/admin-auth";

export default async function AdminDashboardPage() {
  const session = await requireAdminSession();

  return (
    <AdminShell
      title="Welcome Admin"
      description="Manage products now, and use this same workspace as we expand into templates, materials, and order management."
      currentPath="/admin/dashboard"
      userLabel={session.user.email}
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/3 p-6 lg:col-span-2">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-white/45">
              Session
            </p>
            <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-white">
              Your admin workspace is ready
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/62">
              Signed in as {session.user.email}
              {session.user.role ? ` (${session.user.role})` : ""}.
            </p>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/3 p-6">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-white/45">
            Next
          </p>
          <h2 className="mt-3 text-xl font-black tracking-[-0.03em] text-white">
            Start with products
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/62">
            Create and edit the product catalog here, then we can extend this admin area into templates and pricing flows.
          </p>
        </div>
      </div>
    </AdminShell>
  );
}
