export type TemplateMaterialFormState = {
  message: string;
};

export const INITIAL_TEMPLATE_MATERIAL_FORM_STATE: TemplateMaterialFormState = {
  message: "",
};

export type AdminTemplateMaterial = {
  id: string;
  name: string;
  price: string;
  isDefault: boolean;
  isActive: boolean;
};
