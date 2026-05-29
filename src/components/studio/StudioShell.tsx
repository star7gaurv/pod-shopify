import { CenterViewer } from "@/components/studio/CenterViewer";
import { LeftPanel } from "@/components/studio/LeftPanel";
import { RightPanel } from "@/components/studio/RightPanel";
import { StudioDesignLoader } from "@/components/studio/StudioDesignLoader";
import { StudioEmbedHandler } from "@/components/studio/StudioEmbedHandler";
import { StudioLoadingOverlay } from "@/components/studio/StudioLoadingOverlay";
import { StudioOnboardingGuide } from "@/components/studio/StudioOnboardingGuide";
import { StudioUrlPreloader } from "@/components/studio/StudioUrlPreloader";
import { getPublicUrl } from "@/lib/r2";

export function StudioShell() {
  const logoUrl = getPublicUrl("assets/ssn-logo.png");

  return (
    <section className="relative overflow-x-clip px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <StudioDesignLoader />
      <StudioUrlPreloader />
      <StudioEmbedHandler />
      <StudioLoadingOverlay logoUrl={logoUrl} />
      <StudioOnboardingGuide logoUrl={logoUrl} />
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid gap-4 lg:gap-5 xl:grid-cols-[300px_minmax(0,1fr)_290px]">
          <LeftPanel />
          <CenterViewer />
          <RightPanel />
        </div>
      </div>
    </section>
  );
}
