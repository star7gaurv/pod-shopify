"use server";

import { revalidatePath } from "next/cache";
import { requireAdminActionSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import type { TemplateSizeChartFormState } from "@/lib/admin/template-size-chart-form";

export async function createSizeChartAction(
  templateId: string,
  _prevState: TemplateSizeChartFormState,
  formData: FormData,
): Promise<TemplateSizeChartFormState> {
  await requireAdminActionSession();

  const parsed = parseSizeChartFormData(formData);
  if ("message" in parsed) {
    return parsed;
  }

  try {
    await prisma.templateSizeChart.create({
      data: {
        templateId,
        ...parsed,
      },
    });
  } catch (error) {
    return handleSizeChartMutationError(error);
  }

  revalidateTemplateSizeChartPaths(templateId);
  return {
    message: "",
  };
}

export async function updateSizeChartAction(
  templateId: string,
  sizeChartId: string,
  _prevState: TemplateSizeChartFormState,
  formData: FormData,
): Promise<TemplateSizeChartFormState> {
  await requireAdminActionSession();

  const parsed = parseSizeChartFormData(formData);
  if ("message" in parsed) {
    return parsed;
  }

  try {
    const entry = await prisma.templateSizeChart.findUnique({
      where: {
        id: sizeChartId,
      },
      select: {
        id: true,
        templateId: true,
      },
    });

    if (!entry || entry.templateId !== templateId) {
      return {
        message: "We couldn't find that size entry for this template.",
      };
    }

    await prisma.templateSizeChart.update({
      where: {
        id: sizeChartId,
      },
      data: parsed,
    });
  } catch (error) {
    return handleSizeChartMutationError(error);
  }

  revalidateTemplateSizeChartPaths(templateId);
  return {
    message: "",
  };
}

export async function deleteSizeChartAction(
  templateId: string,
  sizeChartId: string,
): Promise<void> {
  await requireAdminActionSession();

  const entry = await prisma.templateSizeChart.findUnique({
    where: {
      id: sizeChartId,
    },
    select: {
      id: true,
      templateId: true,
    },
  });

  if (!entry || entry.templateId !== templateId) {
    return;
  }

  await prisma.templateSizeChart.delete({
    where: {
      id: sizeChartId,
    },
  });

  revalidateTemplateSizeChartPaths(templateId);
}

function parseSizeChartFormData(
  formData: FormData,
):
  | {
      name: string;
      description: string;
      sortOrder: number;
    }
  | TemplateSizeChartFormState {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sortOrderRaw = String(formData.get("sortOrder") ?? "").trim();

  if (!name) {
    return {
      message: "Size name is required.",
    };
  }

  if (!description) {
    return {
      message: "Size description is required.",
    };
  }

  if (!sortOrderRaw) {
    return {
      message: "Sort order is required.",
    };
  }

  const sortOrderNumber = Number(sortOrderRaw);
  if (!Number.isInteger(sortOrderNumber)) {
    return {
      message: "Sort order must be a whole number.",
    };
  }

  return {
    name,
    description,
    sortOrder: sortOrderNumber,
  };
}

function handleSizeChartMutationError(
  error: unknown,
): TemplateSizeChartFormState {
  console.error("Template size chart mutation failed.", error);
  return {
    message: "We couldn't save this size chart entry. Please try again.",
  };
}

function revalidateTemplateSizeChartPaths(templateId: string) {
  revalidatePath("/admin/templates");
  revalidatePath(`/admin/templates/${templateId}/edit`);
}
