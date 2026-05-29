import Link from "next/link";
import { createTemplateAction } from "@/actions/admin-templates";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTemplateForm } from "@/components/admin/AdminTemplateForm";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export default async function AdminCreateTemplatePage() {
  const session = await requireAdminSession();
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <AdminShell
      title="Create Template"
      description="Add a studio template, link it to a product, and define the model, UV layout, color, and price defaults."
      currentPath="/admin/templates"
      userLabel={session.user.email}
      actions={
        <Link
          href="/admin/templates"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/4 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/7"
        >
          Back to Templates
        </Link>
      }
    >
      <div className="rounded-3xl border border-white/10 bg-white/3 p-6">
        <AdminTemplateForm
          action={createTemplateAction}
          submitLabel="Create Template"
          products={products}
          initialValues={{
            productId: products[0]?.id ?? "",
            name: "",
            slug: "",
            basePrice: "",
            baseColor: "#ffffff",
            modelPath: "",
            uvLayoutPath: "",
            isActive: true,
          }}
        />
      </div>
    </AdminShell>
  );
}
