export type CreateStudioOrderPayload = {
  designId: string;
  productId: string;
  templateId: string;
  materialId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  instructions: string | null;
  quantity: number;
  pricePerItem: number;
  totalPrice: number;
};

export type CreateStudioOrderResponse = {
  order: {
    id: string;
    orderNumber: string;
    status: string;
  };
};
