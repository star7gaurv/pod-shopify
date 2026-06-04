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
    // Reject purpose-scoped tokens (e.g. dashboard-login hand-off JWTs).
    // Both token types carry shopId + shopDomain, so checking for a `purpose`
    // field is the discriminant — a dashboard token must never be accepted as
    // a persistent embedded-app session cookie.
    if (typeof payload.purpose === "string") return null;
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

// ─── External-dashboard hand-off ────────────────────────────────────────────
//
// The embedded app already proved the merchant's identity (verified Shopify
// session → ps_merchant cookie). To open the external dashboard — which lives
// outside the iframe and can't see that cookie — we mint a short-lived,
// purpose-scoped token the merchant carries in a new tab. The dashboard's
// NextAuth "merchant-token" provider verifies it and starts its own session.
//
// Lifetime is deliberately tiny (2 min) so a leaked link can't be replayed
// for long. (True single-use would need a server-side jti store — a sensible
// follow-up, not required for this hand-off.)

const DASHBOARD_TOKEN_PURPOSE = "dashboard-login";

/** Mint a one-time token that authenticates a merchant into `/dashboard`. */
export async function signDashboardToken(
  session: MerchantSession,
): Promise<string> {
  return new SignJWT({ ...session, purpose: DASHBOARD_TOKEN_PURPOSE })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2m")
    .sign(getSecret());
}

/** Verify a dashboard hand-off token, returning the merchant or null. */
export async function verifyDashboardToken(
  token: string,
): Promise<MerchantSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    if (
      payload.purpose === DASHBOARD_TOKEN_PURPOSE &&
      typeof payload.shopId === "string" &&
      typeof payload.shopDomain === "string"
    ) {
      return { shopId: payload.shopId, shopDomain: payload.shopDomain };
    }
    return null;
  } catch {
    return null;
  }
}
