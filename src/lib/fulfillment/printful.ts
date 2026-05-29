/**
 * Printful API integration.
 * Docs: https://developers.printful.com/docs/
 * Best for international orders.
 */

const PRINTFUL_BASE = "https://api.printful.com";

function getKey(): string {
  const key = process.env.PRINTFUL_API_KEY;
  if (!key) throw new Error("PRINTFUL_API_KEY not configured");
  return key;
}

async function printfulFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${PRINTFUL_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getKey()}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const data = await res.json() as { code: number; result?: unknown; error?: unknown };
  if (!res.ok || data.code >= 400) {
    throw new Error(`Printful API error ${data.code}: ${JSON.stringify(data.error)}`);
  }
  return data.result;
}

export type PrintfulOrderInput = {
  externalId: string;       // Our order ID
  recipient: {
    name: string;
    email?: string;
    address1: string;
    city: string;
    state_code?: string;
    country_code: string;
    zip: string;
  };
  items: Array<{
    variant_id: number;     // Printful variant ID
    quantity: number;
    files: Array<{ url: string; type?: string }>;
  }>;
};

export async function createPrintfulOrder(input: PrintfulOrderInput) {
  return printfulFetch("/orders", {
    method: "POST",
    body: JSON.stringify({
      external_id: input.externalId,
      recipient: input.recipient,
      items: input.items,
    }),
  });
}

export async function getPrintfulOrder(printfulOrderId: string) {
  return printfulFetch(`/orders/${printfulOrderId}`);
}

export async function getPrintfulProducts() {
  return printfulFetch("/store/products");
}
