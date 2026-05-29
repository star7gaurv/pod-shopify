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
