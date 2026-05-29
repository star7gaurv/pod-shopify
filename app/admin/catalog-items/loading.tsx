import { AdminPageLoading } from "@/components/admin/AdminPageLoading";

export default function AdminCatalogItemsLoading() {
  return (
    <AdminPageLoading
      title="Loading catalog items..."
      description="Fetching public catalog records and preparing the catalog workspace."
    />
  );
}
