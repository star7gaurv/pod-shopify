"use client";

import { FabricCanvas } from "@/components/studio/FabricCanvas";
import { useStudioStore } from "@/store/studioStore";

export function CenterViewer() {
  const selectedTemplate = useStudioStore((state) => state.selectedTemplate);
  const currentTemplate = useStudioStore((state) => state.currentTemplate);
  const templateStatus = useStudioStore((state) => state.templateStatus);
  const templateError = useStudioStore((state) => state.templateError);
  const setSelectedTemplate = useStudioStore((state) => state.setSelectedTemplate);
  const hasUvLayout = Boolean(currentTemplate?.uvLayoutImage);

  return (
    <section
      data-tour="design-canvas"
      className="border border-white/8 bg-linear-to-b from-[rgba(8,17,28,0.98)] to-[rgba(4,10,17,0.96)] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] sm:p-5 lg:p-6"
    >

      <div className="relative grid min-h-[420px] place-items-center overflow-hidden border border-white/8 bg-[radial-gradient(circle_at_50%_25%,rgba(255,255,255,0.1),transparent_14%),linear-gradient(180deg,rgba(15,22,33,0.98),rgba(5,10,18,0.98))] p-3 sm:min-h-[560px] sm:p-6 lg:min-h-[640px]">
        <div className="absolute left-[18%] top-[-50px] h-[280px] w-[110px] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.34),rgba(255,255,255,0.04)_42%,transparent_72%)] opacity-90 blur-[3px] [clip-path:polygon(35%_0%,65%_0%,100%_100%,0%_100%)]" />
        <div className="absolute left-[46%] top-[-50px] h-[280px] w-[110px] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.34),rgba(255,255,255,0.04)_42%,transparent_72%)] opacity-90 blur-[3px] [clip-path:polygon(35%_0%,65%_0%,100%_100%,0%_100%)]" />
        <div className="absolute left-[74%] top-[-50px] h-[280px] w-[110px] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.34),rgba(255,255,255,0.04)_42%,transparent_72%)] opacity-90 blur-[3px] [clip-path:polygon(35%_0%,65%_0%,100%_100%,0%_100%)]" />

        <div className="relative z-10 w-full">
          {currentTemplate && hasUvLayout ? (
            <FabricCanvas />
          ) : currentTemplate && !hasUvLayout ? (
            <div className="mx-auto grid min-h-[520px] max-w-[520px] place-items-center rounded-[32px] border border-amber-400/25 bg-amber-950/20 px-8 text-center">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-amber-200/60">
                  UV layout missing
                </p>
                <h3 className="mt-4 text-2xl font-black tracking-[-0.03em] text-white">
                  This template needs a UV layout image
                </h3>
                <p className="mt-3 text-sm leading-6 text-white/58">
                  Upload a UV layout in the template editor before using this design
                  canvas.
                </p>
              </div>
            </div>
          ) : templateStatus === "loading" && selectedTemplate ? (
            <div className="mx-auto grid min-h-[520px] max-w-[520px] place-items-center rounded-[32px] border border-white/8 bg-white/[0.03] px-8 text-center">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-white/45">
                  Loading template
                </p>
                <h3 className="mt-4 text-2xl font-black tracking-[-0.03em] text-white">
                  Preparing your design canvas
                </h3>
                <p className="mt-3 text-sm leading-6 text-white/58">
                  We&apos;re loading the UV layout, pricing, materials, and size chart
                  from the database now.
                </p>
              </div>
            </div>
          ) : templateStatus === "error" && selectedTemplate ? (
            <div className="mx-auto grid min-h-[520px] max-w-[520px] place-items-center rounded-[32px] border border-red-400/25 bg-red-950/20 px-8 text-center">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-red-200/60">
                  Template unavailable
                </p>
                <h3 className="mt-4 text-2xl font-black tracking-[-0.03em] text-white">
                  We couldn&apos;t load this template
                </h3>
                <p className="mt-3 text-sm leading-6 text-white/58">
                  {templateError ?? "Please try selecting the template again."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedTemplate) {
                      void setSelectedTemplate(selectedTemplate);
                    }
                  }}
                  className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/4 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/7"
                >
                  Retry loading template
                </button>
              </div>
            </div>
          ) : (
            <div className="mx-auto grid min-h-[520px] max-w-[520px] place-items-center rounded-[32px] border border-white/8 bg-white/[0.03] px-8 text-center">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.28em] text-white/45">
                  Ready when you are
                </p>
                <h3 className="mt-4 text-2xl font-black tracking-[-0.03em] text-white">
                  Select a product and template to begin
                </h3>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
