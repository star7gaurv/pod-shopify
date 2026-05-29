import Link from "next/link";
import { notFound } from "next/navigation";
import { updateTemplateAction } from "@/actions/admin-templates";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTemplateForm } from "@/components/admin/AdminTemplateForm";
import { AdminTemplateMaterialsManager } from "@/components/admin/AdminTemplateMaterialsManager";
import { AdminTemplateSizeChartManager } from "@/components/admin/AdminTemplateSizeChartManager";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type EditTemplatePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminEditTemplatePage({
  params,
}: EditTemplatePageProps) {
  const session = await requireAdminSession();
  const { id } = await params;
  const [template, products] = await Promise.all([
    prisma.template.findUnique({
      where: {
        id,
      },
      include: {
        materials: {
          orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        },
        sizeCharts: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  if (!template) {
    notFound();
  }

  const boundUpdateTemplateAction = updateTemplateAction.bind(null, template.id);

  return (
    <AdminShell
      title="Edit Template"
      description="Update template metadata, pricing, product assignment, and model or UV paths without affecting the rest of the admin system."
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
          action={boundUpdateTemplateAction}
          submitLabel="Save Changes"
          products={products}
          initialValues={{
            productId: template.productId,
            name: template.name,
            slug: template.slug,
            basePrice: String(Number(template.basePrice)),
            baseColor: template.baseColor,
            modelPath: template.modelPath,
            uvLayoutPath: template.uvLayoutPath,
            isActive: template.isActive,
          }}
        />
      </div>

      <AdminTemplateMaterialsManager
        templateId={template.id}
        materials={template.materials.map((material) => ({
          id: material.id,
          name: material.name,
          price: String(Number(material.price)),
          isDefault: material.isDefault,
          isActive: material.isActive,
        }))}
      />

      <AdminTemplateSizeChartManager
        templateId={template.id}
        entries={template.sizeCharts.map((entry) => ({
          id: entry.id,
          name: entry.name,
          description: entry.description,
          sortOrder: entry.sortOrder,
        }))}
      />
    </AdminShell>
  );
}
