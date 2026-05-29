import { AdminPageLoading } from "@/components/admin/AdminPageLoading";

export default function AdminDesignsLoading() {
  return (
    <AdminPageLoading
      title="Loading saved designs..."
      description="Fetching saved design links, website visibility state, and protection status."
    />
  );
}
