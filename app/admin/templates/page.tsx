import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export default async function AdminTemplatesPage() {
  const session = await requireAdminSession();
  const templates = await prisma.template.findMany({
    include: {
      product: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <AdminShell
      title="Templates"
      description="Manage product-linked templates, pricing foundations, and the model or UV paths that drive the studio."
      currentPath="/admin/templates"
      userLabel={session.user.email}
      actions={
        <Link
          href="/admin/templates/create"
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-linear-to-b from-[var(--accent-soft)] to-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(255,74,61,0.24)] transition hover:-translate-y-0.5"
        >
          Create Template
        </Link>
      }
    >
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/3">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/8">
            <thead className="bg-white/4">
              <tr className="text-left text-xs uppercase tracking-[0.22em] text-white/45">
                <th className="px-5 py-4 font-medium">Name</th>
                <th className="px-5 py-4 font-medium">Slug</th>
                <th className="px-5 py-4 font-medium">Product</th>
                <th className="px-5 py-4 font-medium">Base Price</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Created</th>
                <th className="px-5 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {templates.map((template) => (
                <tr key={template.id} className="text-sm text-white/78">
                  <td className="px-5 py-4 font-semibold text-white">
                    {template.name}
                  </td>
                  <td className="px-5 py-4 font-mono text-white/62">
                    {template.slug}
                  </td>
                  <td className="px-5 py-4">{template.product.name}</td>
                  <td className="px-5 py-4">${Number(template.basePrice)}</td>
                  <td className="px-5 py-4">
                    <span
                      className={[
                        "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                        template.isActive
                          ? "bg-emerald-500/16 text-emerald-200"
                          : "bg-white/8 text-white/55",
                      ].join(" ")}
                    >
                      {template.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-white/62">
                    {template.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/templates/${template.id}/edit`}
                      className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/4 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/7"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {templates.length === 0 ? (
          <div className="px-5 py-8 text-sm text-white/58">
            No templates have been created yet.
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
