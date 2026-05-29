"use client";

import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useStudioStore } from "@/store/studioStore";

export function StudioUrlPreloader() {
  const searchParams = useSearchParams();
  const products = useStudioStore((state) => state.products);
  const templates = useStudioStore((state) => state.templates);
  const productsStatus = useStudioStore((state) => state.productsStatus);
  const templatesStatus = useStudioStore((state) => state.templatesStatus);
  const selectedProduct = useStudioStore((state) => state.selectedProduct);
  const selectedTemplate = useStudioStore((state) => state.selectedTemplate);
  const loadProducts = useStudioStore((state) => state.loadProducts);
  const setSelectedProduct = useStudioStore((state) => state.setSelectedProduct);
  const setSelectedTemplate = useStudioStore((state) => state.setSelectedTemplate);

  const appliedKeyRef = useRef<string | null>(null);

  const designToken = normalizeParam(searchParams.get("design"));
  const productSlug = normalizeParam(searchParams.get("product"));
  const templateSlug = normalizeParam(searchParams.get("template"));
  const preloadKey = useMemo(() => {
    if (!productSlug) {
      return null;
    }

    return `${productSlug}:${templateSlug}`;
  }, [productSlug, templateSlug]);

  useEffect(() => {
    if (designToken) {
      return;
    }

    if (!preloadKey || !productSlug || appliedKeyRef.current === preloadKey) {
      return;
    }

    let cancelled = false;

    const applyPreload = async () => {
      if (productsStatus === "idle") {
        await loadProducts();
        if (cancelled) {
          return;
        }
      }

      if (useStudioStore.getState().productsStatus === "loading") {
        return;
      }

      const latestProductsState = useStudioStore.getState();
      if (
        latestProductsState.productsStatus !== "loaded" &&
        latestProductsState.products.length === 0
      ) {
        return;
      }

      const matchingProduct = latestProductsState.products.find(
        (product) => product.id === productSlug,
      );

      if (!matchingProduct) {
        console.warn("Studio URL preload skipped invalid product slug.", {
          productSlug,
          templateSlug: templateSlug || null,
        });
        appliedKeyRef.current = preloadKey;
        return;
      }

      if (latestProductsState.selectedProduct !== productSlug) {
        await latestProductsState.setSelectedProduct(productSlug);
        if (cancelled) {
          return;
        }
      }

      if (!templateSlug) {
        appliedKeyRef.current = preloadKey;
        return;
      }

      const latestTemplatesState = useStudioStore.getState();
      if (latestTemplatesState.templatesStatus === "loading") {
        return;
      }

      if (
        latestTemplatesState.templatesStatus !== "loaded" &&
        latestTemplatesState.templates.length === 0
      ) {
        return;
      }

      const matchingTemplate = latestTemplatesState.templates.find(
        (template) =>
          template.productId === productSlug &&
          template.templateId === templateSlug,
      );

      if (!matchingTemplate) {
        console.warn("Studio URL preload skipped invalid template slug.", {
          productSlug,
          templateSlug,
        });
        appliedKeyRef.current = preloadKey;
        return;
      }

      if (latestTemplatesState.selectedTemplate !== templateSlug) {
        await latestTemplatesState.setSelectedTemplate(templateSlug);
        if (cancelled) {
          return;
        }
      }

      appliedKeyRef.current = preloadKey;
    };

    void applyPreload();

    return () => {
      cancelled = true;
    };
  }, [
    designToken,
    loadProducts,
    preloadKey,
    productSlug,
    products,
    productsStatus,
    selectedProduct,
    selectedTemplate,
    setSelectedProduct,
    setSelectedTemplate,
    templateSlug,
    templates,
    templatesStatus,
  ]);

  return null;
}

function normalizeParam(value: string | null) {
  const normalized = value?.trim().toLowerCase() ?? "";
  return normalized.length > 0 ? normalized : "";
}
