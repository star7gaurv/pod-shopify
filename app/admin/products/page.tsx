import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { AdminProductsTable } from "@/components/admin/AdminProductsTable";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminProductsPage() {
  const session = await requireAdminSession();
  const products = await prisma.product.findMany({
    include: {
      templates: {
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <AdminShell
      title="Products"
      description="Manage active catalog products that power the studio product selector and future storefront flows."
      currentPath="/admin/products"
      userLabel={session.user.email}
      actions={
        <Link
          href="/admin/products/create"
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-linear-to-b from-[var(--accent-soft)] to-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(255,74,61,0.24)] transition hover:-translate-y-0.5"
        >
          Create Product
        </Link>
      }
    >
      <AdminProductsTable
        products={products.map((product) => ({
          id: product.id,
          name: product.name,
          slug: product.slug,
          isActive: product.isActive,
          createdAt: product.createdAt.toISOString(),
          updatedAt: product.updatedAt.toISOString(),
          templates: product.templates.map((template) => ({
            id: template.id,
            name: template.name,
            slug: template.slug,
            isActive: template.isActive,
          })),
        }))}
      />
    </AdminShell>
  );
}
