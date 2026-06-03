import Link from "next/link";

export const metadata = {
  title: "Open Print Studio from your Shopify admin",
};

/**
 * Fallback landing page shown when someone hits `/merchant/**` outside
 * the Shopify embedded-app context (no merchant cookie, no valid Shopify
 * session token). Middleware redirects here.
 *
 * The merchant app cannot meaningfully render outside Shopify's iframe —
 * but bouncing them to the public marketing homepage with no explanation
 * was confusing. This page tells them what's happening and offers a way
 * to start a new install.
 */
export default function MerchantWelcomePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center">
        <div className="text-pink-400 font-bold text-lg tracking-tight mb-2">
          Print Studio
        </div>
        <h1 className="text-2xl font-black mb-3">
          Open this app from your Shopify admin
        </h1>
        <p className="text-gray-400 text-sm leading-relaxed">
          The merchant dashboard is part of the Shopify embedded-app
          experience and needs to be opened from{" "}
          <span className="text-white">Apps → Print Studio</span> inside your
          store&apos;s admin.
        </p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-gray-900 p-5 text-left">
          <p className="text-sm font-semibold text-white mb-3">
            Don&apos;t have it installed yet?
          </p>
          <form
            method="GET"
            action="/api/shopify/install"
            className="flex items-stretch gap-2"
          >
            <input
              name="shop"
              type="text"
              required
              placeholder="your-store.myshopify.com"
              pattern="^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$"
              className="flex-1 rounded-xl border border-white/10 bg-gray-800 px-3 text-sm text-white outline-none focus:border-pink-500"
            />
            <button
              type="submit"
              className="rounded-xl bg-pink-500 hover:bg-pink-600 px-4 text-sm font-semibold text-white transition-colors"
            >
              Install
            </button>
          </form>
        </div>

        <Link
          href="/"
          className="mt-6 inline-block text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
