"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const STUDIO_ONBOARDING_STORAGE_KEY = "studio:onboarding:v2";
// This moved from a theory modal to an interactive product tour, so we intentionally
// bumped the key. If the guide changes significantly again later, we can move to v3.

const VIEWPORT_PADDING = 20;
const TOOLTIP_GAP = 18;
const TOOLTIP_WIDTH = 360;
const ESTIMATED_TOOLTIP_HEIGHT = 320;

type GuideStep = {
  target: string;
  title: string;
  description: string;
};

type HighlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type TooltipPlacement = "right" | "left" | "top" | "bottom" | "center";

type TooltipLayout = {
  top: number;
  left: number;
  width: number;
  placement: TooltipPlacement;
};

const GUIDE_STEPS: GuideStep[] = [
  {
    target: "product-select",
    title: "Choose a Product",
    description: "Start by selecting the product you want to customize.",
  },
  {
    target: "template-select",
    title: "Choose a Template",
    description: "Pick the style or model you want to design.",
  },
  {
    target: "color-swatches",
    title: "Customize Colors",
    description:
      "Choose a base color or use a custom color to match your team or brand.",
  },
  {
    target: "uploads",
    title: "Upload Logos",
    description:
      "Upload logos, graphics, and artwork to place on your design.",
  },
  {
    target: "design-canvas",
    title: "Design on the Canvas",
    description:
      "Add text, shapes, names, numbers, and logos directly on the design area.",
  },
  {
    target: "preview-3d",
    title: "Preview in 3D",
    description:
      "Check the live 3D preview before saving or ordering.",
  },
  {
    target: "save-share",
    title: "Save or Share",
    description:
      "Save your design or copy a share link so you can return to it later.",
  },
  {
    target: "order-panel",
    title: "Place Your Order",
    description:
      "Review pricing and details, then continue when you are ready to order.",
  },
];

type StudioOnboardingGuideProps = {
  logoUrl: string;
};

export function StudioOnboardingGuide({
  logoUrl,
}: StudioOnboardingGuideProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null);
  const [tooltipLayout, setTooltipLayout] = useState<TooltipLayout>({
    top: 120,
    left: VIEWPORT_PADDING,
    width: TOOLTIP_WIDTH,
    placement: "center",
  });
  const hasAutoCheckedRef = useRef(false);
  const hasAutoOpenedRef = useRef(false);
  const lastAppliedKeyRef = useRef<string | null>(null);
  const layoutTimeoutRef = useRef<number | null>(null);
  const layoutFrameRef = useRef<number | null>(null);

  const currentStep = GUIDE_STEPS[currentStepIndex];
  const progressLabel = useMemo(
    () => `Step ${currentStepIndex + 1} of ${GUIDE_STEPS.length}`,
    [currentStepIndex],
  );
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === GUIDE_STEPS.length - 1;
  const targetMissing = highlightRect === null;

  const clearScheduledLayout = useCallback(() => {
    if (layoutTimeoutRef.current !== null) {
      window.clearTimeout(layoutTimeoutRef.current);
      layoutTimeoutRef.current = null;
    }
    if (layoutFrameRef.current !== null) {
      window.cancelAnimationFrame(layoutFrameRef.current);
      layoutFrameRef.current = null;
    }
  }, []);

  const persistCompletion = useCallback(() => {
    try {
      window.localStorage.setItem(STUDIO_ONBOARDING_STORAGE_KEY, "completed");
    } catch (error) {
      console.warn("Studio onboarding localStorage write failed.", error);
    }
  }, []);

  const openGuide = useCallback((stepIndex = 0) => {
    lastAppliedKeyRef.current = null;
    setCurrentStepIndex(stepIndex);
    setIsOpen(true);
  }, []);

  const closeGuide = useCallback(
    (persist = false) => {
      if (persist) {
        persistCompletion();
      }
      clearScheduledLayout();
      lastAppliedKeyRef.current = null;
      setIsOpen(false);
      setCurrentStepIndex(0);
      setHighlightRect(null);
    },
    [clearScheduledLayout, persistCompletion],
  );

  const calculateLayout = useCallback(() => {
    const selector = `[data-tour="${currentStep.target}"]`;
    const target = document.querySelector<HTMLElement>(selector);

    if (!target) {
      const width = Math.min(TOOLTIP_WIDTH, window.innerWidth - VIEWPORT_PADDING * 2);
      setHighlightRect(null);
      setTooltipLayout({
        width,
        left: Math.max(VIEWPORT_PADDING, (window.innerWidth - width) / 2),
        top: Math.max(32, (window.innerHeight - ESTIMATED_TOOLTIP_HEIGHT) / 2),
        placement: "center",
      });
      return;
    }

    const rect = target.getBoundingClientRect();
    const width = Math.min(TOOLTIP_WIDTH, window.innerWidth - VIEWPORT_PADDING * 2);
    const paddedRect = {
      top: Math.max(VIEWPORT_PADDING, rect.top - 10),
      left: Math.max(VIEWPORT_PADDING, rect.left - 10),
      width: Math.min(
        rect.width + 20,
        window.innerWidth - VIEWPORT_PADDING * 2,
      ),
      height: Math.min(
        rect.height + 20,
        window.innerHeight - VIEWPORT_PADDING * 2,
      ),
    };

    const spaceRight = window.innerWidth - rect.right - VIEWPORT_PADDING;
    const spaceLeft = rect.left - VIEWPORT_PADDING;
    const spaceBottom = window.innerHeight - rect.bottom - VIEWPORT_PADDING;
    const spaceTop = rect.top - VIEWPORT_PADDING;

    let placement: TooltipPlacement = "center";
    if (spaceRight >= width + TOOLTIP_GAP) {
      placement = "right";
    } else if (spaceLeft >= width + TOOLTIP_GAP) {
      placement = "left";
    } else if (spaceBottom >= ESTIMATED_TOOLTIP_HEIGHT) {
      placement = "bottom";
    } else if (spaceTop >= ESTIMATED_TOOLTIP_HEIGHT) {
      placement = "top";
    }

    let nextLeft = Math.max(VIEWPORT_PADDING, (window.innerWidth - width) / 2);
    let nextTop = Math.max(32, (window.innerHeight - ESTIMATED_TOOLTIP_HEIGHT) / 2);

    if (placement === "right") {
      nextLeft = rect.right + TOOLTIP_GAP;
      nextTop = rect.top + rect.height / 2 - ESTIMATED_TOOLTIP_HEIGHT / 2;
    } else if (placement === "left") {
      nextLeft = rect.left - width - TOOLTIP_GAP;
      nextTop = rect.top + rect.height / 2 - ESTIMATED_TOOLTIP_HEIGHT / 2;
    } else if (placement === "bottom") {
      nextLeft = rect.left + rect.width / 2 - width / 2;
      nextTop = rect.bottom + TOOLTIP_GAP;
    } else if (placement === "top") {
      nextLeft = rect.left + rect.width / 2 - width / 2;
      nextTop = rect.top - ESTIMATED_TOOLTIP_HEIGHT - TOOLTIP_GAP;
    }

    setHighlightRect(paddedRect);
    setTooltipLayout({
      width,
      left: clamp(nextLeft, VIEWPORT_PADDING, window.innerWidth - width - VIEWPORT_PADDING),
      top: clamp(
        nextTop,
        VIEWPORT_PADDING,
        window.innerHeight - ESTIMATED_TOOLTIP_HEIGHT - VIEWPORT_PADDING,
      ),
      placement,
    });
  }, [currentStep.target]);

  const syncStepLayout = useCallback(
    ({
      shouldScroll,
      smoothScroll,
    }: {
      shouldScroll: boolean;
      smoothScroll: boolean;
    }) => {
      clearScheduledLayout();

      const selector = `[data-tour="${currentStep.target}"]`;
      const target = document.querySelector<HTMLElement>(selector);

      if (target && shouldScroll) {
        target.scrollIntoView({
          block: "center",
          behavior: smoothScroll ? "smooth" : "auto",
        });
      }

      const runLayout = () => {
        layoutFrameRef.current = window.requestAnimationFrame(() => {
          calculateLayout();
        });
      };

      runLayout();
      layoutTimeoutRef.current = window.setTimeout(
        runLayout,
        target && shouldScroll ? (smoothScroll ? 260 : 120) : 80,
      );
    },
    [calculateLayout, clearScheduledLayout, currentStep.target],
  );

  const advanceStep = useCallback(() => {
    if (isLastStep) {
      closeGuide(true);
      return;
    }

    setCurrentStepIndex((current) => Math.min(current + 1, GUIDE_STEPS.length - 1));
  }, [closeGuide, isLastStep]);

  useEffect(() => {
    if (hasAutoCheckedRef.current) {
      return;
    }

    hasAutoCheckedRef.current = true;
    let timeoutId: number | null = null;
    let attempts = 0;

    try {
      const hasCompleted =
        window.localStorage.getItem(STUDIO_ONBOARDING_STORAGE_KEY) === "completed";
      // To test the first-time guide again during development, clear:
      // window.localStorage.removeItem("studio:onboarding:v2")

      if (hasCompleted) {
        return;
      }

      const tryOpenGuide = () => {
        if (hasAutoOpenedRef.current) {
          return;
        }

        const hasFirstTarget = Boolean(
          document.querySelector('[data-tour="product-select"]'),
        );

        if (hasFirstTarget || attempts >= 10) {
          hasAutoOpenedRef.current = true;
          openGuide(0);
          return;
        }

        attempts += 1;
        timeoutId = window.setTimeout(tryOpenGuide, 200);
      };

      timeoutId = window.setTimeout(tryOpenGuide, 600);
    } catch (error) {
      console.warn("Studio onboarding localStorage check failed.", error);
      hasAutoOpenedRef.current = true;
      timeoutId = window.setTimeout(() => {
        openGuide(0);
      }, 600);
    }

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [openGuide]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const appliedKey = `${currentStepIndex}:${currentStep.target}`;
    if (lastAppliedKeyRef.current !== appliedKey) {
      lastAppliedKeyRef.current = appliedKey;
      syncStepLayout({ shouldScroll: true, smoothScroll: true });
    } else {
      syncStepLayout({ shouldScroll: false, smoothScroll: false });
    }

    const handleReposition = () => {
      syncStepLayout({ shouldScroll: false, smoothScroll: false });
    };

    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      clearScheduledLayout();
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [
    clearScheduledLayout,
    currentStep.target,
    currentStepIndex,
    isOpen,
    syncStepLayout,
  ]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeGuide(true);
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setCurrentStepIndex((current) => Math.max(0, current - 1));
        return;
      }

      if (event.key === "ArrowRight" || event.key === "Enter") {
        event.preventDefault();
        advanceStep();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [advanceStep, closeGuide, isOpen]);

  useEffect(() => {
    const handleOpenGuide = () => {
      openGuide(0);
    };

    window.addEventListener("studio-guide:open", handleOpenGuide);
    return () => {
      window.removeEventListener("studio-guide:open", handleOpenGuide);
    };
  }, [openGuide]);

  return (
    <>
      {isOpen ? (
        <div className="fixed inset-0 z-[9000]" aria-hidden="true">
          <div
            className={[
              "absolute inset-0 pointer-events-auto",
              targetMissing
                ? "bg-[rgba(2,6,23,0.78)] backdrop-blur-[4px]"
                : "bg-transparent",
            ].join(" ")}
          />

          {highlightRect ? (
            <div
              className="pointer-events-none fixed rounded-[28px] border border-[var(--brand-accent-border)] bg-white/[0.02] shadow-[0_0_0_1px_var(--brand-accent-border),0_0_36px_var(--brand-accent-glow)] transition-[top,left,width,height] duration-300"
              style={{
                top: highlightRect.top,
                left: highlightRect.left,
                width: highlightRect.width,
                height: highlightRect.height,
                boxShadow:
                  "0 0 0 9999px rgba(2,6,23,0.78), 0 0 0 1px var(--brand-accent-border), 0 0 36px var(--brand-accent-glow)",
              }}
            />
          ) : null}

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="studio-tour-title"
            aria-describedby="studio-tour-description"
            className="pointer-events-none fixed inset-0"
          >
            <div
              className="pointer-events-auto absolute max-h-[calc(100vh-40px)] overflow-y-auto overscroll-contain rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,18,30,0.98),rgba(4,10,17,0.99))] p-5 text-white shadow-[0_30px_90px_rgba(0,0,0,0.48)] sm:p-6"
              style={{
                width: tooltipLayout.width,
                left: tooltipLayout.left,
                top: tooltipLayout.top,
                maxWidth: `calc(100vw - ${VIEWPORT_PADDING * 2}px)`,
              }}
            >
              <TourArrow placement={tooltipLayout.placement} />

              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="brand-loader-glow flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoUrl}
                      alt="SSN Custom Apparel logo"
                      className="brand-logo-beat h-7 w-auto object-contain"
                    />
                  </div>
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/45">
                      {progressLabel}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/32">
                      Interactive Studio Guide
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => closeGuide(true)}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                >
                  Skip
                </button>
              </div>

              <h2
                id="studio-tour-title"
                className="mt-5 text-2xl font-black tracking-[-0.04em] text-white"
              >
                {currentStep.title}
              </h2>
              <p
                id="studio-tour-description"
                className="mt-3 text-sm leading-7 text-white/66"
              >
                {currentStep.description}
              </p>

              {targetMissing ? (
                <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-white/56">
                  This area will appear once the related studio panel is available.
                  You can keep moving through the guide without changing anything.
                </div>
              ) : null}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentStepIndex((current) => Math.max(0, current - 1))
                  }
                  disabled={isFirstStep}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/78 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Back
                </button>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  {!isLastStep ? (
                    <button
                      type="button"
                      onClick={advanceStep}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-linear-to-b from-[var(--accent-soft)] to-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_var(--brand-accent-shadow)] transition hover:-translate-y-0.5"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => closeGuide(true)}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-linear-to-b from-[var(--accent-soft)] to-[var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_var(--brand-accent-shadow)] transition hover:-translate-y-0.5"
                    >
                      Start Designing
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function TourArrow({ placement }: { placement: TooltipPlacement }) {
  if (placement === "center") {
    return null;
  }

  const baseClasses =
    "absolute h-4 w-4 rotate-45 border border-white/10 bg-[linear-gradient(180deg,rgba(10,18,30,0.98),rgba(4,10,17,0.99))]";

  const placementClasses =
    placement === "right"
      ? "-left-2 top-1/2 -translate-y-1/2 border-r-0 border-t-0"
      : placement === "left"
        ? "-right-2 top-1/2 -translate-y-1/2 border-b-0 border-l-0"
        : placement === "top"
          ? "bottom-[-9px] left-1/2 -translate-x-1/2 border-l-0 border-t-0"
          : "left-1/2 top-[-9px] -translate-x-1/2 border-b-0 border-r-0";

  return <span aria-hidden="true" className={`${baseClasses} ${placementClasses}`} />;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
