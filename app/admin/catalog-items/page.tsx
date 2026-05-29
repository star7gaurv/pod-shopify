import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminCatalogItemsTable } from "@/components/admin/AdminCatalogItemsTable";

export default async function AdminCatalogItemsPage() {
  const session = await requireAdminSession();
  const catalogItems = await prisma.catalogItem.findMany({
    include: {
      studioProduct: {
        select: {
          name: true,
        },
      },
      studioTemplate: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [
      {
        sortOrder: "asc",
      },
      {
        createdAt: "desc",
      },
    ],
  });

  return (
    <AdminShell
      title="Catalog Items"
      description="Manage public-facing catalog records that will power the homepage catalog and future products pages without changing the studio engine models."
      currentPath="/admin/catalog-items"
      userLabel={session.user.email}
      actions={
        <Link
          href="/admin/catalog-items/create"
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-linear-to-b from-[var(--accent-soft)] to-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(255,74,61,0.24)] transition hover:-translate-y-0.5"
        >
          Create Catalog Item
        </Link>
      }
    >
      <AdminCatalogItemsTable
        items={catalogItems.map((item) => ({
          id: item.id,
          imagePath: item.imagePath,
          ogImagePath: item.ogImagePath,
          title: item.title,
          slug: item.slug,
          shortDescription: item.shortDescription,
          description: item.description,
          studioProductName: item.studioProduct?.name ?? null,
          studioTemplateName: item.studioTemplate?.name ?? null,
          isActive: item.isActive,
          isFeatured: item.isFeatured,
          sortOrder: item.sortOrder,
          metaTitle: item.metaTitle,
          metaDescription: item.metaDescription,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        }))}
      />
    </AdminShell>
  );
}
