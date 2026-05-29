"use server";

import { revalidatePath } from "next/cache";
import { requireAdminActionSession } from "@/lib/admin-auth";
import {
  type OrderStatusFormState,
} from "@/lib/admin/order-status-form";
import { isOrderStatus } from "@/lib/orders";
import { prisma } from "@/lib/prisma";

export async function updateOrderStatusAction(
  orderId: string,
  _prevState: OrderStatusFormState,
  formData: FormData,
): Promise<OrderStatusFormState> {
  await requireAdminActionSession();

  const statusValue = String(formData.get("status") ?? "").trim();
  if (!isOrderStatus(statusValue)) {
    return {
      message: "Please choose a valid order status.",
      success: false,
    };
  }

  try {
    await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: statusValue,
      },
    });
  } catch (error) {
    console.error("Order status update failed.", error);
    return {
      message: "We couldn't update this order status. Please try again.",
      success: false,
    };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);

  return {
    message: "Order status updated successfully.",
    success: true,
  };
}
