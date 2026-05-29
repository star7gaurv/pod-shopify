import { AdminPageLoading } from "@/components/admin/AdminPageLoading";

export default function AdminOrdersLoading() {
  return (
    <AdminPageLoading
      title="Loading orders..."
      description="Fetching placed orders, customer details, and saved design links."
    />
  );
}
