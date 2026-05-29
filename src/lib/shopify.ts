import crypto from "node:crypto";

const SCOPES = process.env.SHOPIFY_SCOPES ?? "read_products,write_products,read_orders,write_orders,read_themes";

export function getShopifyApiKey() {
  const key = process.env.SHOPIFY_API_KEY;
  if (!key) throw new Error("SHOPIFY_API_KEY not configured");
  return key;
}

export function getShopifyApiSecret() {
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) throw new Error("SHOPIFY_API_SECRET not configured");
  return secret;
}

export function getAppUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SITE_URL not configured");
  return url.replace(/\/$/, "");
}

/** Build the Shopify OAuth authorization URL for a given shop domain. */
export function buildInstallUrl(shop: string, state: string) {
  const redirectUri = `${getAppUrl()}/api/shopify/callback`;
  const params = new URLSearchParams({
    client_id: getShopifyApiKey(),
    scope: SCOPES,
    redirect_uri: redirectUri,
    state,
    "grant_options[]": "per-user",
  });
  return `https://${shop}/admin/oauth/authorize?${params}`;
}

/** Exchange an authorization code for a permanent access token. */
export async function exchangeToken(shop: string, code: string): Promise<string> {
  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: getShopifyApiKey(),
      client_secret: getShopifyApiSecret(),
      code,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

/** Verify the HMAC signature on an incoming Shopify request. */
export function verifyHmac(params: URLSearchParams): boolean {
  const hmac = params.get("hmac");
  if (!hmac) return false;

  const filtered = new URLSearchParams();
  for (const [key, value] of params.entries()) {
    if (key !== "hmac") filtered.set(key, value);
  }

  // Sort and encode per Shopify spec
  const message = [...filtered.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  const digest = crypto.createHmac("sha256", getShopifyApiSecret()).update(message).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmac));
}

/** Verify the HMAC on an incoming Shopify webhook (raw body). */
export function verifyWebhookHmac(rawBody: string, hmacHeader: string): boolean {
  const digest = crypto
    .createHmac("sha256", getShopifyApiSecret())
    .update(rawBody, "utf8")
    .digest("base64");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmacHeader));
}

/** Validate that a shop domain looks legitimate. */
export function isValidShopDomain(shop: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/.test(shop);
}

/** Make an authenticated call to the Shopify Admin API (REST). */
export async function shopifyApiCall(
  shop: string,
  accessToken: string,
  path: string,
  options: RequestInit = {},
) {
  const res = await fetch(`https://${shop}/admin/api/2024-07/${path}`, {
    ...options,
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify API ${path} failed: ${res.status} ${text}`);
  }

  return res.json();
}

/** Register a webhook on a merchant's store. */
export async function registerWebhook(
  shop: string,
  accessToken: string,
  topic: string,
  address: string,
) {
  return shopifyApiCall(shop, accessToken, "webhooks.json", {
    method: "POST",
    body: JSON.stringify({
      webhook: { topic, address, format: "json" },
    }),
  });
}

/** Register all required webhooks on install. */
export async function registerAllWebhooks(shop: string, accessToken: string) {
  const appUrl = getAppUrl();
  const webhooks = [
    { topic: "orders/create", address: `${appUrl}/api/shopify/webhooks/orders-create` },
    { topic: "app/uninstalled", address: `${appUrl}/api/shopify/webhooks/app-uninstalled` },
    // GDPR mandatory webhooks
    { topic: "customers/data_request", address: `${appUrl}/api/shopify/webhooks/gdpr` },
    { topic: "customers/redact", address: `${appUrl}/api/shopify/webhooks/gdpr` },
    { topic: "shop/redact", address: `${appUrl}/api/shopify/webhooks/gdpr` },
  ];

  const results = await Promise.allSettled(
    webhooks.map(({ topic, address }) => registerWebhook(shop, accessToken, topic, address)),
  );

  for (const [i, result] of results.entries()) {
    if (result.status === "rejected") {
      console.error(`Failed to register webhook ${webhooks[i].topic}:`, result.reason);
    }
  }
}
