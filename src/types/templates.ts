import type { StudioView } from "@/store/studioStore";

export type StudioProductId = string;
export type StudioTemplateId = string;

export type StudioProduct = {
  id: StudioProductId;
  name: string;
  dbId?: string;
  isActive?: boolean;
};

export type StudioTemplateSummary = {
  productId: StudioProductId;
  templateId: StudioTemplateId;
  templateName: string;
  dbId?: string;
  isActive?: boolean;
};

export type TemplateMaterial = {
  id: string;
  name: string;
  price: number;
};

export type TemplateSizeChartEntry = {
  id: string;
  name: string;
  description: string;
};

type TemplateElementBase = {
  id: string;
  role: string;
  left: number;
  top: number;
  editable: boolean;
  locked?: boolean;
};

export type TemplateTextElement = TemplateElementBase & {
  type: "text";
  role: "name" | "number" | "label" | string;
  text: string;
  width: number;
  fontSize: number;
  fill: string;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: "left" | "center" | "right";
};

export type TemplateImageElement = TemplateElementBase & {
  type: "image";
  role: "mainLogo" | "sponsorLogo" | "teamLogo" | string;
  src: string;
  width: number;
  height: number;
};

export type TemplateShapeElement = TemplateElementBase & {
  type: "shape";
  role: "background" | "accent" | "stripe" | string;
  shape: "rect";
  width: number;
  height: number;
  fill: string;
  angle?: number;
};

export type TemplateElement =
  | TemplateTextElement
  | TemplateImageElement
  | TemplateShapeElement;

export type TemplateViewDefinition = {
  garmentSvg: string;
  elements: TemplateElement[];
};

export type StudioTemplateDefinition = {
  productId: StudioProductId;
  templateId: StudioTemplateId;
  templateName: string;
  dbId?: string;
  productDbId?: string;
  baseColor: string;
  basePrice: number;
  uvLayoutImage: string;
  modelPath: string;
  materials?: TemplateMaterial[];
  sizeChart?: TemplateSizeChartEntry[];
  garment?: {
    frontSvg: string;
    backSvg: string;
    sleeveLeftSvg: string;
    sleeveRightSvg: string;
  };
  views?: Partial<Record<StudioView, TemplateViewDefinition>>;
  editable?: {
    mainLogo: boolean;
    colors: boolean;
    sponsorLogos: boolean;
  };
};
