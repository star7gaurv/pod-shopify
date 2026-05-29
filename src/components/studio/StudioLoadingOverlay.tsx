"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStudioStore } from "@/store/studioStore";

const MIN_VISIBLE_MS = 800;
const HELPFUL_MESSAGES = [
  "Please wait while we prepare your design.",
  "Large artwork files can take a moment.",
  "Preparing high-quality preview.",
  "Almost ready.",
];

type StudioLoadingOverlayProps = {
  logoUrl: string;
};

export function StudioLoadingOverlay({ logoUrl }: StudioLoadingOverlayProps) {
  const searchParams = useSearchParams();
  const loadProducts = useStudioStore((state) => state.loadProducts);
  const loadDesignByShareToken = useStudioStore((state) => state.loadDesignByShareToken);
  const loadingStep = useStudioStore((state) => state.loadingStep);
  const isDesignLoading = useStudioStore((state) => state.isDesignLoading);
  const isStudioPreparing = useStudioStore((state) => state.isStudioPreparing);
  const studioLoadingError = useStudioStore((state) => state.studioLoadingError);

  const [isVisible, setIsVisible] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const visibleSinceRef = useRef<number | null>(null);
  const designToken = searchParams.get("design");
  const shouldStayVisible = isStudioPreparing || Boolean(studioLoadingError);

  useEffect(() => {
    if (shouldStayVisible) {
      visibleSinceRef.current = Date.now();
      setIsVisible(true);
      return;
    }

    if (!isVisible) {
      return;
    }

    const elapsed = visibleSinceRef.current
      ? Date.now() - visibleSinceRef.current
      : MIN_VISIBLE_MS;
    const timeout = window.setTimeout(
      () => {
        setIsVisible(false);
        setMessageIndex(0);
      },
      Math.max(0, MIN_VISIBLE_MS - elapsed),
    );

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isVisible, shouldStayVisible]);

  useEffect(() => {
    if (!isVisible || studioLoadingError) {
      return;
    }

    const interval = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % HELPFUL_MESSAGES.length);
    }, 2400);

    return () => {
      window.clearInterval(interval);
    };
  }, [isVisible, studioLoadingError]);

  const phaseLabel = useMemo(() => {
    if (studioLoadingError) {
      return "We hit a loading issue";
    }

    if (isDesignLoading) {
      return "Saved Design";
    }

    return "Studio Workspace";
  }, [isDesignLoading, studioLoadingError]);

  if (!isVisible) {
    return null;
  }

  const handleRetry = async () => {
    if (isRetrying) {
      return;
    }

    setIsRetrying(true);
    try {
      if (designToken) {
        await loadDesignByShareToken(designToken);
        return;
      }

      await loadProducts();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[10000] bg-[rgba(2,6,23,0.72)] backdrop-blur-xl"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_28%),radial-gradient(circle_at_bottom,var(--brand-accent-surface),transparent_24%)]" />
      <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl overflow-hidden rounded-[32px] border border-white/12 bg-[linear-gradient(180deg,rgba(10,18,30,0.94),rgba(4,10,17,0.96))] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.5)]">
          <div className="brand-loader-glow mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-white/10 bg-white/4 shadow-[0_0_50px_rgba(255,255,255,0.08)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt="SSN Custom Apparel logo"
              className="brand-logo-beat h-14 w-auto object-contain"
            />
          </div>

          <p className="mt-6 text-center font-mono text-xs uppercase tracking-[0.34em] text-white/50">
            Racing Apparel Studio
          </p>
          <h2 className="mt-3 text-center text-3xl font-black tracking-[-0.04em] text-white">
            {studioLoadingError ? "We couldn&apos;t finish loading" : loadingStep}
          </h2>
          <p className="mt-3 text-center text-sm leading-6 text-white/62">
            {studioLoadingError
              ? studioLoadingError
              : HELPFUL_MESSAGES[messageIndex]}
          </p>

          <div className="mt-7 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/58">
            <p className="text-xs uppercase tracking-[0.22em] text-white/46">
              {phaseLabel}
            </p>
            {studioLoadingError ? (
              <p className="mt-2">
                Please try again. Your saved design and studio data remain intact.
              </p>
            ) : (
              <p className="mt-2">Please wait while we prepare your design.</p>
            )}
          </div>

          {studioLoadingError ? (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  void handleRetry();
                }}
                disabled={isRetrying}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-linear-to-b from-[var(--accent-soft)] to-[var(--accent)] px-6 py-3 font-semibold text-white shadow-[0_18px_40px_var(--brand-accent-shadow)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {isRetrying ? "Retrying..." : "Try Again"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
