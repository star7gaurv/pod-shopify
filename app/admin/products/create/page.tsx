import Link from "next/link";
import { AdminProductForm } from "@/components/admin/AdminProductForm";
import { AdminShell } from "@/components/admin/AdminShell";
import { createProductAction } from "@/actions/admin-products";
import { requireAdminSession } from "@/lib/admin-auth";

export default async function AdminCreateProductPage() {
  const session = await requireAdminSession();

  return (
    <AdminShell
      title="Create Product"
      description="Add a new product to the catalog with a clean name, URL-friendly slug, and active status."
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
          action={createProductAction}
          submitLabel="Create Product"
          initialValues={{
            name: "",
            slug: "",
            isActive: true,
          }}
        />
      </div>
    </AdminShell>
  );
}
