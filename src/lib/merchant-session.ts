import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

/**
 * Merchant session — short-lived JWT stored in an httpOnly cookie.
 *
 * The cookie identifies a Shopify shop that completed OAuth. It is the
 * SOLE source of truth for merchant identity in `/merchant/**` pages and
 * `/api/merchant/**` + `/api/billing/**` API routes.
 *
 * Do not trust `?shop=` query params anywhere. The cookie is signed and
 * cannot be forged; the URL is user-controlled.
 *
 * SameSite is `none` because the app runs inside the Shopify Admin
 * iframe. `secure: true` is therefore mandatory.
 *
 * NOTE: the session intentionally carries only stable identifiers
 * (shopId, shopDomain). It does NOT carry `plan` — plan can change
 * mid-session via Razorpay webhooks, and a snapshot in the cookie would
 * go stale. Callers that need the plan should fetch it from the DB via
 * `requireMerchantShop()`.
 */

const COOKIE_NAME = "ps_merchant";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type MerchantSession = {
  shopId: string;
  shopDomain: string;
};

function getSecret(): Uint8Array {
  const raw = process.env.MERCHANT_SESSION_SECRET ?? process.env.AUTH_SECRET;
  if (!raw) {
    throw new Error(
      "MERCHANT_SESSION_SECRET (or AUTH_SECRET) must be set to sign merchant sessions",
    );
  }
  return new TextEncoder().encode(raw);
}

/** Sign a session JWT for the given merchant. */
export async function signMerchantSession(
  session: MerchantSession,
): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

/** Verify a session JWT, returning the session payload or null. */
export async function verifyMerchantSession(
  token: string,
): Promise<MerchantSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    if (
      typeof payload.shopId === "string" &&
      typeof payload.shopDomain === "string"
    ) {
      return {
        shopId: payload.shopId,
        shopDomain: payload.shopDomain,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/** Sign + set the cookie in one step (server components / route handlers). */
export async function mintMerchantCookie(
  session: MerchantSession,
): Promise<void> {
  const token = await signMerchantSession(session);
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "none", // required for Shopify iframe context
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

/** Read + verify the cookie from the current request context. */
export async function readMerchantSession(): Promise<MerchantSession | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyMerchantSession(token);
}

export const MERCHANT_COOKIE_NAME = COOKIE_NAME;
