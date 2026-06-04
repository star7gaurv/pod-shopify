import type { UploadedAsset } from "@/store/studioStore";
import type {
  StudioProduct,
  StudioProductId,
  StudioTemplateDefinition,
  StudioTemplateId,
  StudioTemplateSummary,
} from "@/types/templates";

export type StudioSavedDesign = {
  id: string;
  shareToken: string;
  publicPath: string;
  productId: StudioProductId;
  templateId: StudioTemplateId;
  selectedMaterialId: string | null;
  baseColor: string;
  canvasJson: string;
  previewImageUrl: string | null;
  isFeatured: boolean;
  isLocked: boolean;
  parentDesignId: string | null;
  uploadedAssets: UploadedAsset[];
  product: StudioProduct;
  templateSummary: StudioTemplateSummary;
  template: StudioTemplateDefinition;
};

export type SaveStudioDesignPayload = {
  /**
   * The storefront shop the customer is designing on (e.g.
   * `acme.myshopify.com`), read from `?shop=` in the embedded studio URL.
   * Used to attribute the design to a shop and to enforce the free-tier
   * design limit. Unsigned and storefront-public — it only scopes a count,
   * grants no privileged access.
   */
  shop: string | null;
  currentDesignId: string | null;
  currentShareToken: string | null;
  isLocked: boolean;
  isFeatured: boolean;
  parentDesignId: string | null;
  productId: StudioProductId;
  templateId: StudioTemplateId;
  selectedMaterialId: string | null;
  baseColor: string;
  canvasJson: string;
  previewDataUrl: string | null;
  uploadedAssets: UploadedAsset[];
};
