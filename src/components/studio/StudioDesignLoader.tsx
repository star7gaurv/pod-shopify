"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useStudioStore } from "@/store/studioStore";

export function StudioDesignLoader() {
  const searchParams = useSearchParams();
  const currentDesign = useStudioStore((state) => state.currentDesign);
  const currentTemplate = useStudioStore((state) => state.currentTemplate);
  const frontCanvasJson = useStudioStore((state) => state.frontCanvasJson);
  const loadDesignByShareToken = useStudioStore((state) => state.loadDesignByShareToken);
  const finishStudioPreparation = useStudioStore((state) => state.finishStudioPreparation);
  const activeTokenRef = useRef<string | null>(null);

  useEffect(() => {
    const designToken = searchParams.get("design");
    if (!designToken || activeTokenRef.current === designToken) {
      return;
    }

    if (
      currentDesign?.shareToken === designToken &&
      currentTemplate &&
      frontCanvasJson
    ) {
      activeTokenRef.current = designToken;
      finishStudioPreparation("Finalizing design");
      return;
    }

    activeTokenRef.current = designToken;
    void loadDesignByShareToken(designToken);
  }, [
    currentDesign?.shareToken,
    currentTemplate,
    finishStudioPreparation,
    frontCanvasJson,
    loadDesignByShareToken,
    searchParams,
  ]);

  return null;
}
