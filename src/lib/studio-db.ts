import type {
  Product,
  Template,
  TemplateMaterial,
  TemplateSizeChart,
} from "@prisma/client";
import type {
  StudioProduct,
  StudioTemplateDefinition,
  StudioTemplateSummary,
} from "@/types/templates";

type TemplateWithRelations = Template & {
  product: Product;
  materials: TemplateMaterial[];
  sizeCharts: TemplateSizeChart[];
};

export function mapProductToStudioProduct(product: Product): StudioProduct {
  return {
    id: product.slug,
    name: product.name,
    dbId: product.id,
    isActive: product.isActive,
  };
}

export function mapTemplateToStudioTemplateSummary(
  template: Template & { product: Product },
): StudioTemplateSummary {
  return {
    productId: template.product.slug,
    templateId: template.slug,
    templateName: template.name,
    dbId: template.id,
    isActive: template.isActive,
  };
}

export function mapTemplateToStudioTemplateDefinition(
  template: TemplateWithRelations,
): StudioTemplateDefinition {
  const materials = [...template.materials]
    .sort((left, right) => {
      if (left.isDefault === right.isDefault) {
        return left.createdAt.getTime() - right.createdAt.getTime();
      }

      return left.isDefault ? -1 : 1;
    })
    .map((material) => ({
      id: material.id,
      name: material.name,
      price: Number(material.price),
    }));

  const sizeChart = [...template.sizeCharts]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      description: entry.description,
    }));

  return {
    productId: template.product.slug,
    templateId: template.slug,
    templateName: template.name,
    dbId: template.id,
    productDbId: template.productId,
    baseColor: template.baseColor,
    basePrice: Number(template.basePrice),
    uvLayoutImage: template.uvLayoutPath,
    modelPath: template.modelPath,
    materials,
    sizeChart,
  };
}
