import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function requireAdminSession() {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login");
  }

  return session;
}

export async function requireAdminActionSession() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  return session;
}
