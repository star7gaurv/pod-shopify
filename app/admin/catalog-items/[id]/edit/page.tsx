import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminCatalogItemForm } from "@/components/admin/AdminCatalogItemForm";
import { updateCatalogItemAction } from "@/actions/admin-catalog-items";

type EditCatalogItemPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminEditCatalogItemPage({
  params,
}: EditCatalogItemPageProps) {
  const session = await requireAdminSession();
  const { id } = await params;
  const [catalogItem, products, templates] = await Promise.all([
    prisma.catalogItem.findUnique({
      where: {
        id,
      },
    }),
    prisma.product.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    }),
    prisma.template.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    }),
  ]);

  if (!catalogItem) {
    notFound();
  }

  const boundUpdateCatalogItemAction = updateCatalogItemAction.bind(
    null,
    catalogItem.id,
  );

  return (
    <AdminShell
      title="Edit Catalog Item"
      description="Update public catalog content and its optional studio linkage without affecting the studio engine models directly."
      currentPath="/admin/catalog-items"
      userLabel={session.user.email}
      actions={
        <Link
          href="/admin/catalog-items"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/4 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/7"
        >
          Back to Catalog Items
        </Link>
      }
    >
      <div className="rounded-3xl border border-white/10 bg-white/3 p-6">
        <AdminCatalogItemForm
          action={boundUpdateCatalogItemAction}
          submitLabel="Save Changes"
          products={products.map((product) => ({
            id: product.id,
            name: product.name,
            slug: product.slug,
            isActive: product.isActive,
          }))}
          templates={templates.map((template) => ({
            id: template.id,
            name: template.name,
            slug: template.slug,
            productId: template.productId,
            isActive: template.isActive,
          }))}
          initialValues={{
            title: catalogItem.title,
            slug: catalogItem.slug,
            shortDescription: catalogItem.shortDescription,
            description: catalogItem.description ?? "",
            imagePath: catalogItem.imagePath ?? "",
            ogImagePath: catalogItem.ogImagePath ?? "",
            studioProductId: catalogItem.studioProductId ?? "",
            studioTemplateId: catalogItem.studioTemplateId ?? "",
            isActive: catalogItem.isActive,
            isFeatured: catalogItem.isFeatured,
            sortOrder: catalogItem.sortOrder,
            metaTitle: catalogItem.metaTitle ?? "",
            metaDescription: catalogItem.metaDescription ?? "",
          }}
        />
      </div>
    </AdminShell>
  );
}
