import { create } from "zustand";
import type { StudioSavedDesign } from "@/types/designs";
import type {
  StudioProduct,
  StudioProductId,
  StudioTemplateDefinition,
  StudioTemplateId,
  StudioTemplateSummary,
} from "@/types/templates";

export type StudioView = "front" | "back" | "sleeves";
export type UvViewportFocus = StudioView | "atlas";

export type UploadedAsset = {
  id: string;
  name: string;
  url: string;
  type: string;
  r2Key?: string | null;
  status?: "uploading" | "ready" | "error";
  errorMessage?: string | null;
};

export type CanvasAction =
  | {
      id: number;
      type: "addImage";
      asset: UploadedAsset;
    }
  | {
      id: number;
      type: "addText" | "addRectangle" | "addCircle" | "addLine";
    };

export type CanvasActionRequest =
  | {
      type: "addImage";
      asset: UploadedAsset;
    }
  | {
      type: "addText" | "addRectangle" | "addCircle" | "addLine";
    };

type StudioStore = {
  products: StudioProduct[];
  templates: StudioTemplateSummary[];
  currentTemplate: StudioTemplateDefinition | null;
  currentDesign: StudioSavedDesign | null;
  selectedProduct: StudioProductId | "";
  selectedTemplate: StudioTemplateId | "";
  selectedMaterialId: string | "";
  productsStatus: "idle" | "loading" | "loaded" | "error";
  templatesStatus: "idle" | "loading" | "loaded" | "error";
  templateStatus: "idle" | "loading" | "loaded" | "error";
  designStatus: "idle" | "loading" | "saving" | "loaded" | "error";
  loadingStep: string;
  loadingProgress: number;
  isDesignLoading: boolean;
  isStudioPreparing: boolean;
  studioLoadingError: string | null;
  productsError: string | null;
  templatesError: string | null;
  templateError: string | null;
  designError: string | null;
  /** True when a save was rejected because the shop hit its free-design cap. */
  designLimitReached: boolean;
  activeView: StudioView;
  uvViewportFocus: UvViewportFocus;
  showUvGuide: boolean;
  baseColor: string;
  uploadedAssets: UploadedAsset[];
  canvasAction: CanvasAction | null;
  frontCanvasJson: string | null;
  backCanvasJson: string | null;
  sleevesCanvasJson: string | null;
  previewTextures: {
    uv: string | null;
    front: string | null;
    back: string | null;
    sleeveLeft: string | null;
    sleeveRight: string | null;
  };
  exportDesign: (() => void) | null;
  prepareDesignSave: (() => Promise<void> | void) | null;
  beginStudioPreparation: (options?: {
    step?: string;
    progress?: number;
    isDesignLoading?: boolean;
  }) => void;
  updateStudioPreparation: (step: string, progress: number) => void;
  finishStudioPreparation: (step?: string) => void;
  failStudioPreparation: (message: string) => void;
  loadProducts: () => Promise<void>;
  loadDesignByShareToken: (shareToken: string) => Promise<void>;
  saveCurrentDesign: () => Promise<StudioSavedDesign | null>;
  setSelectedProduct: (value: StudioProductId | "") => Promise<void>;
  setSelectedTemplate: (value: StudioTemplateId | "") => Promise<void>;
  setSelectedMaterialId: (value: string | "") => void;
  setActiveView: (value: StudioView) => void;
  setUvViewportFocus: (value: UvViewportFocus) => void;
  setShowUvGuide: (value: boolean) => void;
  setBaseColor: (value: string) => void;
  addUploadedAsset: (asset: Omit<UploadedAsset, "id">) => string;
  updateUploadedAsset: (
    assetId: string,
    patch: Partial<Omit<UploadedAsset, "id">>,
  ) => void;
  removeUploadedAsset: (assetId: string) => void;
  queueCanvasAction: (action: CanvasActionRequest) => void;
  setCanvasJson: (view: StudioView, json: string | null) => void;
  setPreviewTexture: (
    target: "uv" | "front" | "back" | "sleeveLeft" | "sleeveRight",
    value: string | null,
  ) => void;
  setExportHandlers: (handlers: {
    exportDesign: (() => void) | null;
    prepareDesignSave?: (() => Promise<void> | void) | null;
  }) => void;
};

export const useStudioStore = create<StudioStore>((set) => ({
  products: [],
  templates: [],
  currentTemplate: null,
  currentDesign: null,
  selectedProduct: "",
  selectedTemplate: "",
  selectedMaterialId: "",
  productsStatus: "idle",
  templatesStatus: "idle",
  templateStatus: "idle",
  designStatus: "idle",
  loadingStep: "Initializing studio",
  loadingProgress: 0,
  isDesignLoading: false,
  isStudioPreparing: false,
  studioLoadingError: null,
  productsError: null,
  templatesError: null,
  templateError: null,
  designError: null,
  designLimitReached: false,
  activeView: "front",
  uvViewportFocus: "atlas",
  showUvGuide: true,
  baseColor: "#f8fafc",
  uploadedAssets: [],
  canvasAction: null,
  frontCanvasJson: null,
  backCanvasJson: null,
  sleevesCanvasJson: null,
  previewTextures: {
    uv: null,
    front: null,
    back: null,
    sleeveLeft: null,
    sleeveRight: null,
  },
  exportDesign: null,
  prepareDesignSave: null,
  beginStudioPreparation: (options) =>
    set({
      loadingStep: options?.step ?? "Initializing studio",
      loadingProgress: options?.progress ?? 10,
      isDesignLoading: options?.isDesignLoading ?? false,
      isStudioPreparing: true,
      studioLoadingError: null,
    }),
  updateStudioPreparation: (step, progress) =>
    set((state) => ({
      loadingStep: step,
      loadingProgress: Math.max(state.loadingProgress, Math.min(progress, 99)),
      isStudioPreparing: true,
      studioLoadingError: null,
    })),
  finishStudioPreparation: (step = "Finalizing design") =>
    set({
      loadingStep: step,
      loadingProgress: 100,
      isDesignLoading: false,
      isStudioPreparing: false,
      studioLoadingError: null,
    }),
  failStudioPreparation: (message) =>
    set({
      isStudioPreparing: false,
      isDesignLoading: false,
      studioLoadingError: message,
    }),
  loadProducts: async () => {
    const loadingState = useStudioStore.getState();
    if (!loadingState.isStudioPreparing) {
      loadingState.beginStudioPreparation({
        step: "Initializing studio",
        progress: 10,
        isDesignLoading: false,
      });
    } else {
      loadingState.updateStudioPreparation("Loading product data", 25);
    }

    set({
      productsStatus: "loading",
      productsError: null,
    });

    try {
      const response = await fetch("/api/products", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load products.");
      }

      const payload = (await response.json()) as {
        products: StudioProduct[];
      };

      set({
        products: payload.products,
        productsStatus: "loaded",
        productsError: null,
      });

      const nextState = useStudioStore.getState();
      if (!nextState.isDesignLoading && !nextState.selectedTemplate) {
        nextState.finishStudioPreparation("Finalizing design");
      } else if (nextState.isStudioPreparing) {
        nextState.updateStudioPreparation("Loading template and materials", 45);
      }
    } catch (error) {
      console.error("Failed to load studio products.", error);
      const message =
        error instanceof Error ? error.message : "Failed to load products.";
      set({
        products: [],
        productsStatus: "error",
        productsError: message,
      });
      useStudioStore.getState().failStudioPreparation(message);
    }
  },
  loadDesignByShareToken: async (shareToken) => {
    if (!shareToken) {
      return;
    }

    const currentState = useStudioStore.getState();
    if (
      currentState.currentDesign?.shareToken === shareToken &&
      currentState.currentTemplate &&
      currentState.frontCanvasJson
    ) {
      currentState.finishStudioPreparation("Finalizing design");
      set({
        designStatus: "loaded",
        designError: null,
      });
      return;
    }

    useStudioStore.getState().beginStudioPreparation({
      step: "Initializing studio",
      progress: 10,
      isDesignLoading: true,
    });

    set({
      productsStatus: "loading",
      designStatus: "loading",
      designError: null,
      templateStatus: "loading",
      templatesStatus: "loading",
      studioLoadingError: null,
    });

    try {
      const response = await fetch(`/api/designs/${encodeURIComponent(shareToken)}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load saved design.");
      }

      const payload = (await response.json()) as {
        design: StudioSavedDesign;
      };

      useStudioStore.getState().updateStudioPreparation("Loading saved design", 25);

      if (payload.design.shareToken !== shareToken) {
        useStudioStore.getState().finishStudioPreparation("Finalizing design");
        return;
      }

      set((state) => {
        const mergedProducts = mergeProducts(state.products, payload.design.product);
        const mergedTemplates = mergeTemplates(
          state.templates,
          payload.design.templateSummary,
        );

        return {
          products: mergedProducts,
          templates: mergedTemplates,
          currentDesign: payload.design,
          currentTemplate: payload.design.template,
          selectedProduct: payload.design.productId,
          selectedTemplate: payload.design.templateId,
          selectedMaterialId: payload.design.selectedMaterialId ?? "",
          baseColor: payload.design.baseColor,
          frontCanvasJson: payload.design.canvasJson,
          backCanvasJson: null,
          sleevesCanvasJson: null,
          uploadedAssets: payload.design.uploadedAssets,
          activeView: "front",
          uvViewportFocus: "atlas",
          showUvGuide: true,
          productsStatus: "loaded",
          templateStatus: "loaded",
          templatesStatus: "loaded",
          designStatus: "loaded",
          loadingStep: "Loading template and materials",
          loadingProgress: 45,
          designError: null,
          templateError: null,
          templatesError: null,
          previewTextures: {
            uv: null,
            front: null,
            back: null,
            sleeveLeft: null,
            sleeveRight: null,
          },
        };
      });
    } catch (error) {
      console.error("Failed to load saved design.", error);
      const message =
        error instanceof Error ? error.message : "Failed to load saved design.";
      set({
        currentDesign: null,
        productsStatus: "error",
        designStatus: "error",
        designError: message,
        templateStatus: "error",
        templateError: message,
      });
      useStudioStore.getState().failStudioPreparation(message);
    } finally {
      const latestState = useStudioStore.getState();
      if (
        latestState.isStudioPreparing &&
        latestState.currentDesign?.shareToken === shareToken &&
        latestState.currentTemplate &&
        latestState.frontCanvasJson &&
        latestState.designStatus === "loaded"
      ) {
        latestState.finishStudioPreparation("Finalizing design");
      }
    }
  },
  saveCurrentDesign: async () => {
    const prepareDesignSave = useStudioStore.getState().prepareDesignSave;
    if (prepareDesignSave) {
      await prepareDesignSave();
    }

    const state = useStudioStore.getState();
    if (!state.selectedProduct || !state.selectedTemplate || !state.currentTemplate) {
      set({
        designStatus: "error",
        designError: "Select a product and template before saving.",
      });
      return null;
    }

    const canvasJson =
      state.frontCanvasJson ?? state.backCanvasJson ?? state.sleevesCanvasJson;
    if (!canvasJson) {
      set({
        designStatus: "error",
        designError: "There is no design on the canvas to save yet.",
      });
      return null;
    }

    set({
      designStatus: "saving",
      designError: null,
      designLimitReached: false,
    });

    const payload = {
      shop:
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("shop")
          : null,
      currentDesignId: state.currentDesign?.id ?? null,
      currentShareToken: state.currentDesign?.shareToken ?? null,
      isLocked: state.currentDesign?.isLocked ?? false,
      isFeatured: state.currentDesign?.isFeatured ?? false,
      parentDesignId: state.currentDesign?.parentDesignId ?? null,
      productId: state.selectedProduct,
      templateId: state.selectedTemplate,
      selectedMaterialId: state.selectedMaterialId || null,
      baseColor: state.baseColor,
      canvasJson,
      previewDataUrl: state.previewTextures.uv ?? state.previewTextures.front ?? null,
      uploadedAssets: state.uploadedAssets
        .filter((asset) => (asset.status ?? "ready") === "ready")
        .map((asset) => ({
          id: asset.id,
          name: asset.name,
          url: asset.url,
          type: asset.type,
          r2Key: asset.r2Key ?? null,
        })),
    };

    const currentDesign = state.currentDesign;
    const shouldCreateNew =
      !currentDesign ||
      currentDesign.isLocked ||
      currentDesign.isFeatured;

    try {
      const response = await fetch(
        shouldCreateNew
          ? "/api/designs"
          : `/api/designs/${encodeURIComponent(currentDesign.shareToken)}`,
        {
          method: shouldCreateNew ? "POST" : "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as
          | { error?: string; message?: string }
          | null;
        // Free-tier design cap — surface a friendly, distinct state instead
        // of a generic error so the embed can prompt an upgrade.
        if (
          response.status === 402 ||
          errorPayload?.error === "design_limit_reached"
        ) {
          set({
            designStatus: "error",
            designLimitReached: true,
            designError:
              errorPayload?.message ??
              "This store has reached its free design limit.",
          });
          return null;
        }
        throw new Error(errorPayload?.error || "Failed to save design.");
      }

      const result = (await response.json()) as {
        design: StudioSavedDesign;
      };

      set((currentState) => ({
        currentDesign: result.design,
        selectedProduct: result.design.productId,
        selectedTemplate: result.design.templateId,
        selectedMaterialId: result.design.selectedMaterialId ?? "",
        currentTemplate: result.design.template,
        baseColor: result.design.baseColor,
        uploadedAssets: result.design.uploadedAssets,
        previewTextures: currentState.previewTextures,
        designStatus: "loaded",
        designError: null,
      }));

      return result.design;
    } catch (error) {
      console.error("Failed to save current design.", error);
      set({
        designStatus: "error",
        designError:
          error instanceof Error ? error.message : "Failed to save design.",
      });
      return null;
    }
  },
  setSelectedProduct: async (value) => {
    set({
      selectedProduct: value,
      selectedTemplate: "",
      selectedMaterialId: "",
      templates: [],
      currentTemplate: null,
      currentDesign: null,
      templatesStatus: value ? "loading" : "idle",
      templateStatus: "idle",
      designStatus: "idle",
      templatesError: null,
      templateError: null,
      designError: null,
      activeView: "front",
      uvViewportFocus: "atlas",
      showUvGuide: true,
      baseColor: "#f8fafc",
      uploadedAssets: [],
      canvasAction: null,
      frontCanvasJson: null,
      backCanvasJson: null,
      sleevesCanvasJson: null,
      previewTextures: {
        uv: null,
        front: null,
        back: null,
        sleeveLeft: null,
        sleeveRight: null,
      },
    });

    if (!value) {
      return;
    }

    try {
      const response = await fetch(
        `/api/templates?productSlug=${encodeURIComponent(value)}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to load templates.");
      }

      const payload = (await response.json()) as {
        templates: StudioTemplateSummary[];
      };

      if (useStudioStore.getState().selectedProduct !== value) {
        return;
      }

      set({
        templates: payload.templates,
        templatesStatus: "loaded",
        templatesError: null,
      });
    } catch (error) {
      console.error("Failed to load studio templates.", error);

      if (useStudioStore.getState().selectedProduct !== value) {
        return;
      }

      set({
        templates: [],
        templatesStatus: "error",
        templatesError:
          error instanceof Error ? error.message : "Failed to load templates.",
      });
    }
  },
  setSelectedTemplate: async (value) => {
    set({
      selectedTemplate: value,
      selectedMaterialId: "",
      currentTemplate: null,
      currentDesign: null,
      templateStatus: value ? "loading" : "idle",
      designStatus: "idle",
      templateError: null,
      designError: null,
      activeView: "front",
      uvViewportFocus: "atlas",
      showUvGuide: true,
      baseColor: "#f8fafc",
      canvasAction: null,
      frontCanvasJson: null,
      backCanvasJson: null,
      sleevesCanvasJson: null,
      previewTextures: {
        uv: null,
        front: null,
        back: null,
        sleeveLeft: null,
        sleeveRight: null,
      },
    });

    if (!value) {
      return;
    }

    try {
      const response = await fetch(
        `/api/templates/${encodeURIComponent(value)}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to load template details.");
      }

      const payload = (await response.json()) as {
        template: StudioTemplateDefinition;
      };

      if (useStudioStore.getState().selectedTemplate !== value) {
        return;
      }

      const defaultMaterial =
        payload.template.materials?.[0] ?? null;

      set({
        currentTemplate: payload.template,
        selectedMaterialId: defaultMaterial?.id ?? "",
        templateStatus: "loaded",
        templateError: null,
        baseColor: payload.template.baseColor || "#f8fafc",
      });
    } catch (error) {
      console.error("Failed to load studio template details.", error);

      if (useStudioStore.getState().selectedTemplate !== value) {
        return;
      }

      set({
        currentTemplate: null,
        selectedMaterialId: "",
        templateStatus: "error",
        templateError:
          error instanceof Error
            ? error.message
            : "Failed to load template details.",
        baseColor: "#f8fafc",
      });
    }
  },
  setSelectedMaterialId: (value) => set({ selectedMaterialId: value }),
  setActiveView: (value) => set({ activeView: value, uvViewportFocus: value }),
  setUvViewportFocus: (value) => set({ uvViewportFocus: value }),
  setShowUvGuide: (value) => set({ showUvGuide: value }),
  setBaseColor: (value) => set({ baseColor: value }),
  addUploadedAsset: (asset) => {
    const assetId = `asset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    set((state) => ({
      uploadedAssets: [
        ...state.uploadedAssets,
        {
          ...asset,
          id: assetId,
        },
      ],
    }));
    return assetId;
  },
  updateUploadedAsset: (assetId, patch) =>
    set((state) => ({
      uploadedAssets: state.uploadedAssets.map((asset) =>
        asset.id === assetId
          ? {
              ...asset,
              ...patch,
            }
          : asset,
      ),
    })),
  removeUploadedAsset: (assetId) =>
    set((state) => ({
      uploadedAssets: state.uploadedAssets.filter((asset) => asset.id !== assetId),
    })),
  queueCanvasAction: (action) =>
    set((state) => ({
      canvasAction: {
        ...action,
        id: (state.canvasAction?.id ?? 0) + 1,
      } as CanvasAction,
    })),
  setCanvasJson: (view, json) =>
    set(
      view === "front"
        ? { frontCanvasJson: json }
        : view === "back"
          ? { backCanvasJson: json }
          : { sleevesCanvasJson: json },
    ),
  setPreviewTexture: (target, value) =>
    set((state) => ({
      previewTextures: {
        ...state.previewTextures,
        [target]: value,
      },
    })),
  setExportHandlers: ({ exportDesign, prepareDesignSave = null }) =>
    set({ exportDesign, prepareDesignSave }),
}));

function mergeProducts(
  products: StudioProduct[],
  incoming: StudioProduct,
) {
  const withoutIncoming = products.filter((product) => product.id !== incoming.id);
  return [...withoutIncoming, incoming].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

function mergeTemplates(
  templates: StudioTemplateSummary[],
  incoming: StudioTemplateSummary,
) {
  const withoutIncoming = templates.filter(
    (template) => template.templateId !== incoming.templateId,
  );
  return [...withoutIncoming, incoming].sort((left, right) =>
    left.templateName.localeCompare(right.templateName),
  );
}
