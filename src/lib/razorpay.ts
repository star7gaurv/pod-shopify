import Razorpay from "razorpay";
import crypto from "node:crypto";

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay credentials not configured");
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export const PLANS = {
  starter: process.env.RAZORPAY_PLAN_STARTER ?? "",
  pro: process.env.RAZORPAY_PLAN_PRO ?? "",
} as const;

export type PlanKey = keyof typeof PLANS;

export async function createSubscription(planKey: PlanKey, shopDomain: string) {
  const rz = getRazorpay();
  const planId = PLANS[planKey];
  if (!planId) throw new Error(`Razorpay plan ID not configured for: ${planKey}`);

  const subscription = await rz.subscriptions.create({
    plan_id: planId,
    total_count: 120, // 10 years of monthly billing
    quantity: 1,
    // 14-day trial: start billing after trial
    start_at: Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60,
    notes: { shopDomain },
  });

  return subscription;
}

export async function cancelSubscription(subscriptionId: string) {
  const rz = getRazorpay();
  return rz.subscriptions.cancel(subscriptionId);
}

/** Verify Razorpay payment signature for one-time payments. */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET ?? "";
  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

/** Verify Razorpay webhook signature. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
