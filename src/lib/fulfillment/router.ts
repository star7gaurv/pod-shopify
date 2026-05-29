/**
 * Fulfillment router: choose Printrove (India) or Printful (international)
 * based on the customer's country code.
 *
 * Falls back to whichever API key is configured when only one is available.
 */

import { createPrintfulOrder, type PrintfulOrderInput } from "./printful";
import { createPrintroveOrder, type PrintroveOrderInput } from "./printrove";

const INDIA_COUNTRY_CODES = new Set(["IN", "IND", "India"]);

export type FulfillmentInput = {
  orderId: string;
  countryCode: string;          // e.g. "IN" or "US"
  printFileUrl: string;         // Public URL to print-ready PNG export
  // Printful-specific
  printfulVariantId?: number;
  // Printrove-specific
  printroveProductSku?: string;
  quantity: number;
  customer: {
    name: string;
    phone: string;
    email?: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
};

export type FulfillmentResult = {
  provider: "printful" | "printrove" | "none";
  externalOrderId?: string;
  raw?: unknown;
  error?: string;
};

export async function routeToFulfillment(input: FulfillmentInput): Promise<FulfillmentResult> {
  const hasPrintrove = Boolean(process.env.PRINTROVE_API_KEY);
  const hasPrintful = Boolean(process.env.PRINTFUL_API_KEY);
  const isIndia = INDIA_COUNTRY_CODES.has(input.countryCode);

  // India → Printrove (if configured), else Printful
  // International → Printful (if configured), else Printrove
  const preferPrintrove = isIndia && hasPrintrove;
  const preferPrintful = !isIndia && hasPrintful;

  if (preferPrintrove || (!preferPrintful && hasPrintrove)) {
    if (!input.printroveProductSku) {
      return { provider: "none", error: "Printrove SKU not configured for this product" };
    }
    try {
      const result = await createPrintroveOrder({
        orderId: input.orderId,
        productSku: input.printroveProductSku,
        quantity: input.quantity,
        printFileUrl: input.printFileUrl,
        customerName: input.customer.name,
        customerPhone: input.customer.phone,
        customerEmail: input.customer.email,
        shippingAddress: {
          line1: input.customer.address1,
          line2: input.customer.address2,
          city: input.customer.city,
          state: input.customer.state,
          pincode: input.customer.zip,
          country: input.customer.country,
        },
      });
      const raw = result as Record<string, unknown>;
      return { provider: "printrove", externalOrderId: String(raw.id ?? raw.order_id ?? ""), raw };
    } catch (err) {
      console.error("Printrove fulfillment failed, attempting Printful fallback:", err);
      // fall through to Printful if available
    }
  }

  if (hasPrintful) {
    if (!input.printfulVariantId) {
      return { provider: "none", error: "Printful variant ID not configured for this product" };
    }
    try {
      const pfInput: PrintfulOrderInput = {
        externalId: input.orderId,
        recipient: {
          name: input.customer.name,
          email: input.customer.email,
          address1: input.customer.address1,
          city: input.customer.city,
          state_code: input.customer.state,
          country_code: input.customer.country,
          zip: input.customer.zip,
        },
        items: [
          {
            variant_id: input.printfulVariantId,
            quantity: input.quantity,
            files: [{ url: input.printFileUrl, type: "default" }],
          },
        ],
      };
      const result = await createPrintfulOrder(pfInput);
      const raw = result as Record<string, unknown>;
      return { provider: "printful", externalOrderId: String(raw.id ?? ""), raw };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      return { provider: "printful", error: msg };
    }
  }

  return { provider: "none", error: "No print partner configured (set PRINTFUL_API_KEY or PRINTROVE_API_KEY)" };
}
