"use client";

import Link from "next/link";

export default function MerchantSettings() {
  const appUrl = "https://pod.star7gaurav.in";

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Integration guide for your Shopify store</p>
      </div>

      <div className="space-y-5">
        {/* Install URL */}
        <div className="bg-gray-900 border border-white/8 rounded-2xl p-6">
          <p className="font-semibold text-white mb-3">📎 App Install URL</p>
          <p className="text-gray-400 text-sm mb-3">Share this URL to let other Shopify merchants install your app:</p>
          <code className="block bg-gray-800 rounded-xl p-3 text-pink-300 text-sm break-all">
            {appUrl}/api/shopify/install?shop=MERCHANT.myshopify.com
          </code>
        </div>

        {/* Theme Extension Setup */}
        <div className="bg-gray-900 border border-white/8 rounded-2xl p-6">
          <p className="font-semibold text-white mb-3">🎨 Add Design Studio to Product Pages</p>
          <ol className="text-gray-400 text-sm space-y-2 list-decimal list-inside">
            <li>In your Shopify admin, go to <strong className="text-white">Online Store → Themes</strong></li>
            <li>Click <strong className="text-white">Customize</strong> on your active theme</li>
            <li>Navigate to a Product page template</li>
            <li>Click <strong className="text-white">Add block</strong> and choose <strong className="text-white">Design Studio</strong></li>
            <li>Save the theme</li>
          </ol>
          <Link
            href="/merchant/products"
            className="mt-4 inline-block text-pink-400 text-sm hover:underline"
          >
            → Connect products to templates first
          </Link>
        </div>

        {/* Webhook info */}
        <div className="bg-gray-900 border border-white/8 rounded-2xl p-6">
          <p className="font-semibold text-white mb-3">🔔 Webhooks (auto-configured)</p>
          <p className="text-gray-400 text-sm mb-3">These webhooks are registered automatically when the app is installed:</p>
          <ul className="space-y-2 text-sm font-mono">
            {[
              { topic: "orders/create", url: "/api/shopify/webhooks/orders-create" },
              { topic: "app/uninstalled", url: "/api/shopify/webhooks/app-uninstalled" },
              { topic: "customers/data_request", url: "/api/shopify/webhooks/gdpr" },
              { topic: "customers/redact", url: "/api/shopify/webhooks/gdpr" },
              { topic: "shop/redact", url: "/api/shopify/webhooks/gdpr" },
            ].map(({ topic, url }) => (
              <li key={topic} className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span className="text-gray-300">{topic}</span>
                <span className="text-gray-600">→</span>
                <span className="text-gray-500 truncate">{appUrl}{url}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div className="bg-gray-900 border border-white/8 rounded-2xl p-6">
          <p className="font-semibold text-white mb-2">💬 Support</p>
          <p className="text-gray-400 text-sm">
            Need help? Email{" "}
            <a href="mailto:support@pod.star7gaurav.in" className="text-pink-400 hover:underline">
              support@pod.star7gaurav.in
            </a>{" "}
            or visit the admin panel.
          </p>
        </div>
      </div>
    </div>
  );
}
