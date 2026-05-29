import Link from "next/link";
import { toggleFeaturedDesignAction } from "@/actions/admin-designs";
import { AdminShell } from "@/components/admin/AdminShell";
import { buildStudioDesignPath } from "@/lib/designs";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export default async function AdminDesignsPage() {
  const session = await requireAdminSession();
  const designs = await prisma.design.findMany({
    include: {
      product: true,
      template: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return (
    <AdminShell
      title="Saved Designs"
      description="Review saved customer designs, share public links, and mark selected ones to show on the website without risking accidental overwrites."
      currentPath="/admin/designs"
      userLabel={session.user.email}
    >
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/3">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/8">
            <thead className="bg-white/4">
              <tr className="text-left text-xs uppercase tracking-[0.22em] text-white/45">
                <th className="px-5 py-4 font-medium">Share Token</th>
                <th className="px-5 py-4 font-medium">Product</th>
                <th className="px-5 py-4 font-medium">Template</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Updated</th>
                <th className="px-5 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {designs.map((design) => {
                const publicPath = buildStudioDesignPath(design.shareToken);
                const boundToggleAction = toggleFeaturedDesignAction.bind(
                  null,
                  design.id,
                );

                return (
                  <tr key={design.id} className="text-sm text-white/78">
                    <td className="px-5 py-4 font-mono text-white/62">
                      {design.shareToken.slice(0, 8)}...
                    </td>
                    <td className="px-5 py-4">{design.product.name}</td>
                    <td className="px-5 py-4 text-white">{design.template.name}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        {design.isFeatured ? (
                          <span className="inline-flex rounded-full border border-emerald-400/25 bg-emerald-500/14 px-3 py-1 text-xs font-semibold text-emerald-200">
                            Featured
                          </span>
                        ) : null}
                        {design.isLocked ? (
                          <span className="inline-flex rounded-full border border-amber-400/25 bg-amber-500/14 px-3 py-1 text-xs font-semibold text-amber-100">
                            Locked
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-semibold text-white/70">
                            Editable
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-white/62">
                      {design.updatedAt.toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={publicPath}
                          className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/4 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/7"
                        >
                          Open
                        </Link>
                        <form action={boundToggleAction}>
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/4 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/7"
                          >
                            {design.isFeatured ? "Hide from Website" : "Show on Website"}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {designs.length === 0 ? (
          <div className="px-5 py-8 text-sm text-white/58">
            No saved designs yet.
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
