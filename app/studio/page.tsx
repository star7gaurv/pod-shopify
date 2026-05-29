import { HomeAnnouncementBar } from "@/components/home/HomeAnnouncementBar";
import { Navbar } from "@/components/layout/Navbar";
import { StudioShell } from "@/components/studio/StudioShell";

export default function StudioPage() {
  return (
    <main className="min-h-screen">
      <HomeAnnouncementBar />
      <Navbar currentPath="/studio" variant="studio" />
      <StudioShell />
    </main>
  );
}
