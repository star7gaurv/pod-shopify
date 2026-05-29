"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdminActionSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import type { TemplateMaterialFormState } from "@/lib/admin/template-material-form";

export async function createMaterialAction(
  templateId: string,
  _prevState: TemplateMaterialFormState,
  formData: FormData,
): Promise<TemplateMaterialFormState> {
  await requireAdminActionSession();

  const parsed = parseMaterialFormData(formData);
  if ("message" in parsed) {
    return parsed;
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (parsed.isDefault) {
        await tx.templateMaterial.updateMany({
          where: {
            templateId,
          },
          data: {
            isDefault: false,
          },
        });
      }

      await tx.templateMaterial.create({
        data: {
          templateId,
          ...parsed,
        },
      });
    });
  } catch (error) {
    return handleMaterialMutationError(error);
  }

  revalidateTemplateMaterialPaths(templateId);
  return {
    message: "",
  };
}

export async function updateMaterialAction(
  templateId: string,
  materialId: string,
  _prevState: TemplateMaterialFormState,
  formData: FormData,
): Promise<TemplateMaterialFormState> {
  await requireAdminActionSession();

  const parsed = parseMaterialFormData(formData);
  if ("message" in parsed) {
    return parsed;
  }

  try {
    const material = await prisma.templateMaterial.findUnique({
      where: {
        id: materialId,
      },
      select: {
        id: true,
        templateId: true,
      },
    });

    if (!material || material.templateId !== templateId) {
      return {
        message: "We couldn't find that material for this template.",
      };
    }

    await prisma.$transaction(async (tx) => {
      if (parsed.isDefault) {
        await tx.templateMaterial.updateMany({
          where: {
            templateId,
            id: {
              not: materialId,
            },
          },
          data: {
            isDefault: false,
          },
        });
      }

      await tx.templateMaterial.update({
        where: {
          id: materialId,
        },
        data: parsed,
      });
    });
  } catch (error) {
    return handleMaterialMutationError(error);
  }

  revalidateTemplateMaterialPaths(templateId);
  return {
    message: "",
  };
}

export async function deleteMaterialAction(
  templateId: string,
  materialId: string,
): Promise<void> {
  await requireAdminActionSession();

  const material = await prisma.templateMaterial.findUnique({
    where: {
      id: materialId,
    },
    select: {
      id: true,
      templateId: true,
    },
  });

  if (!material || material.templateId !== templateId) {
    return;
  }

  await prisma.templateMaterial.delete({
    where: {
      id: materialId,
    },
  });

  revalidateTemplateMaterialPaths(templateId);
}

function parseMaterialFormData(
  formData: FormData,
):
  | {
      name: string;
      price: Prisma.Decimal;
      isDefault: boolean;
      isActive: boolean;
    }
  | TemplateMaterialFormState {
  const name = String(formData.get("name") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const isDefault = formData.get("isDefault") === "on";
  const isActive = formData.get("isActive") === "on";

  if (!name) {
    return {
      message: "Material name is required.",
    };
  }

  if (!priceRaw) {
    return {
      message: "Material price is required.",
    };
  }

  const priceNumber = Number(priceRaw);
  if (!Number.isFinite(priceNumber) || priceNumber < 0) {
    return {
      message: "Material price must be a valid positive number.",
    };
  }

  return {
    name,
    price: new Prisma.Decimal(priceNumber),
    isDefault,
    isActive,
  };
}

function handleMaterialMutationError(
  error: unknown,
): TemplateMaterialFormState {
  console.error("Template material mutation failed.", error);
  return {
    message: "We couldn't save this material. Please try again.",
  };
}

function revalidateTemplateMaterialPaths(templateId: string) {
  revalidatePath("/admin/templates");
  revalidatePath(`/admin/templates/${templateId}/edit`);
}
