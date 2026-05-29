export type TemplateSizeChartFormState = {
  message: string;
};

export const INITIAL_TEMPLATE_SIZE_CHART_FORM_STATE: TemplateSizeChartFormState =
  {
    message: "",
  };

export type AdminTemplateSizeChartEntry = {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
};
