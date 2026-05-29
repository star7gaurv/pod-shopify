/**
 * Printrove API integration — India-first print partner.
 * Docs: https://printrove.com/pages/api-docs
 * Best for Indian orders (faster delivery, INR pricing).
 */

function getApiKey(): string {
  const key = process.env.PRINTROVE_API_KEY;
  if (!key) throw new Error("PRINTROVE_API_KEY not configured");
  return key;
}

function getBaseUrl(): string {
  return (process.env.PRINTROVE_API_URL ?? "https://api.printrove.com/api").replace(/\/$/, "");
}

async function printroveFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...options,
    headers: {
      "x-api-key": getApiKey(),
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Printrove API error ${res.status}: ${text}`);
  }

  return res.json();
}

export type PrintroveOrderInput = {
  orderId: string;
  productSku: string;        // Printrove product SKU
  quantity: number;
  printFileUrl: string;      // Public URL to the print-ready PNG
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
  };
};

export async function createPrintroveOrder(input: PrintroveOrderInput) {
  return printroveFetch("/orders", {
    method: "POST",
    body: JSON.stringify({
      order_id: input.orderId,
      product_sku: input.productSku,
      quantity: input.quantity,
      print_file_url: input.printFileUrl,
      customer: {
        name: input.customerName,
        phone: input.customerPhone,
        email: input.customerEmail ?? "",
      },
      shipping_address: input.shippingAddress,
    }),
  });
}

export async function getPrintroveOrderStatus(printroveOrderId: string) {
  return printroveFetch(`/orders/${printroveOrderId}`);
}

export async function getPrintroveProducts() {
  return printroveFetch("/products");
}
