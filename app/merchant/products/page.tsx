"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type ShopifyProduct = {
  id: number;
  title: string;
  handle: string;
  images: Array<{ src: string }>;
};

type StudioTemplate = {
  id: string;
  name: string;
  slug: string;
  product: { name: string; slug: string };
};

export default function MerchantProducts() {
  const searchParams = useSearchParams();
  const shop = searchParams.get("shop") ?? "";

  const [shopifyProducts, setShopifyProducts] = useState<ShopifyProduct[]>([]);
  const [templates, setTemplates] = useState<StudioTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [savedMap, setSavedMap] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!shop) return;
    fetch(`/api/merchant/products?shop=${shop}`)
      .then((r) => r.json())
      .then((d: { shopifyProducts: ShopifyProduct[]; templates: StudioTemplate[] }) => {
        setShopifyProducts(d.shopifyProducts ?? []);
        setTemplates(d.templates ?? []);
      })
      .catch(() => setError("Failed to load products"))
      .finally(() => setLoading(false));
  }, [shop]);

  async function handleMap(product: ShopifyProduct, templateSlug: string) {
    if (!templateSlug) return;
    const template = templates.find((t) => t.slug === templateSlug);
    if (!template) return;

    setSaving(product.id);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/merchant/products?shop=${shop}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopifyProductId: product.id,
          productSlug: template.product.slug,
          templateSlug: template.slug,
        }),
      });
      if (!res.ok) throw new Error("Mapping failed");
      setSavedMap((m) => ({ ...m, [product.id]: templateSlug }));
      setSuccess(`"${product.title}" mapped to "${template.name}"`);
    } catch {
      setError("Failed to save mapping");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black">Connect Products</h1>
        <p className="text-gray-500 text-sm mt-1">
          Link each Shopify product to a print template. The 3D design studio will appear on that product&apos;s page.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/40 border border-red-700/50 rounded-xl text-red-300 text-sm">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-900/40 border border-green-700/50 rounded-xl text-green-300 text-sm">
          ✓ {success}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-900 border border-white/8 rounded-2xl p-5 h-20 animate-pulse" />
          ))}
        </div>
      ) : shopifyProducts.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">📦</p>
          <p>No products found in your Shopify store.</p>
          <p className="text-sm mt-1">Add products in your Shopify admin, then come back here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shopifyProducts.map((product) => {
            const mapped = savedMap[product.id];
            return (
              <div
                key={product.id}
                className="bg-gray-900 border border-white/8 rounded-2xl p-5 flex items-center gap-4"
              >
                {product.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.images[0].src}
                    alt={product.title}
                    className="w-14 h-14 rounded-xl object-cover bg-gray-800 flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gray-800 flex-shrink-0 flex items-center justify-center text-2xl">
                    👕
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{product.title}</p>
                  <p className="text-gray-500 text-sm">{product.handle}</p>
                </div>

                <div className="flex items-center gap-3">
                  {mapped && (
                    <span className="text-green-400 text-sm">✓ Mapped</span>
                  )}
                  <select
                    defaultValue=""
                    onChange={(e) => handleMap(product, e.target.value)}
                    disabled={saving === product.id}
                    className="h-10 rounded-xl border border-white/10 bg-gray-800 px-3 text-sm text-white outline-none focus:border-pink-500 disabled:opacity-50"
                  >
                    <option value="">Select template…</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.slug}>
                        {t.product.name} → {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 p-5 bg-blue-900/20 border border-blue-700/30 rounded-2xl">
        <p className="text-blue-300 font-semibold text-sm mb-2">How does this work?</p>
        <ol className="text-blue-200/70 text-sm space-y-1 list-decimal list-inside">
          <li>Map each Shopify product to a print template above.</li>
          <li>Go to your Shopify theme editor and add the &quot;Design Studio&quot; block to your product page.</li>
          <li>Customers will see a &quot;Customize This Product&quot; button and can design using the 3D studio.</li>
          <li>When they checkout, the design is captured and sent to print automatically.</li>
        </ol>
      </div>
    </div>
  );
}
