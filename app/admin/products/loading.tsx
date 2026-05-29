import { AdminPageLoading } from "@/components/admin/AdminPageLoading";

export default function AdminProductsLoading() {
  return (
    <AdminPageLoading
      title="Loading products..."
      description="Fetching product records and preparing the products workspace."
    />
  );
}
