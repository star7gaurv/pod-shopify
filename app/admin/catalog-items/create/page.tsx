import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminCatalogItemForm } from "@/components/admin/AdminCatalogItemForm";
import { createCatalogItemAction } from "@/actions/admin-catalog-items";

export default async function AdminCreateCatalogItemPage() {
  const session = await requireAdminSession();
  const [products, templates] = await Promise.all([
    prisma.product.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    }),
    prisma.template.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    }),
  ]);

  return (
    <AdminShell
      title="Create Catalog Item"
      description="Create a public-facing catalog record and optionally map it to an existing studio product and template."
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
          action={createCatalogItemAction}
          submitLabel="Create Catalog Item"
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
            title: "",
            slug: "",
            shortDescription: "",
            description: "",
            imagePath: "",
            ogImagePath: "",
            studioProductId: "",
            studioTemplateId: "",
            isActive: true,
            isFeatured: false,
            sortOrder: 0,
            metaTitle: "",
            metaDescription: "",
          }}
        />
      </div>
    </AdminShell>
  );
}
