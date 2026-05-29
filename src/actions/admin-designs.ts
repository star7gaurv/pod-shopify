"use server";

import { revalidatePath } from "next/cache";
import { requireAdminActionSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function toggleFeaturedDesignAction(
  designId: string,
): Promise<void> {
  await requireAdminActionSession();

  const design = await prisma.design.findUnique({
    where: {
      id: designId,
    },
    select: {
      id: true,
      
      isFeatured: true,
    },
  });

  if (!design) {
    return;
  }

  const isFeatured = !design.isFeatured;

  await prisma.design.update({
    where: {
      id: designId,
    },
    data: {
      isFeatured,
      isLocked: isFeatured,
    },
  });

  revalidatePath("/admin/designs");
}
