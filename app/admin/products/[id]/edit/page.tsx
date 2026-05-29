import Link from "next/link";
import { notFound } from "next/navigation";
import { updateProductAction } from "@/actions/admin-products";
import { AdminProductForm } from "@/components/admin/AdminProductForm";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type EditProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminEditProductPage({
  params,
}: EditProductPageProps) {
  const session = await requireAdminSession();
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: {
      id,
    },
  });

  if (!product) {
    notFound();
  }

  const boundUpdateProductAction = updateProductAction.bind(null, product.id);

  return (
    <AdminShell
      title="Edit Product"
      description="Update catalog naming, slug, and active status without affecting the rest of the studio stack."
      currentPath="/admin/products"
      userLabel={session.user.email}
      actions={
        <Link
          href="/admin/products"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/4 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/7"
        >
          Back to Products
        </Link>
      }
    >
      <div className="rounded-3xl border border-white/10 bg-white/3 p-6">
        <AdminProductForm
          action={boundUpdateProductAction}
          submitLabel="Save Changes"
          initialValues={{
            name: product.name,
            slug: product.slug,
            isActive: product.isActive,
          }}
        />
      </div>
    </AdminShell>
  );
}
