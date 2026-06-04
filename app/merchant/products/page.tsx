"use client";

import { useEffect, useState } from "react";
import {
  Badge,
  Banner,
  BlockStack,
  Card,
  InlineStack,
  Layout,
  Page,
  ResourceItem,
  ResourceList,
  Select,
  SkeletonBodyText,
  Text,
  Thumbnail,
} from "@shopify/polaris";

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
  const [shopifyProducts, setShopifyProducts] = useState<ShopifyProduct[]>([]);
  const [templates, setTemplates] = useState<StudioTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [savedMap, setSavedMap] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/merchant/products")
      .then((r) => r.json())
      .then((d: { shopifyProducts: ShopifyProduct[]; templates: StudioTemplate[] }) => {
        setShopifyProducts(d.shopifyProducts ?? []);
        setTemplates(d.templates ?? []);
      })
      .catch(() => setError("Failed to load products"))
      .finally(() => setLoading(false));
  }, []);

  async function handleMap(product: ShopifyProduct, templateSlug: string) {
    if (!templateSlug) return;
    const template = templates.find((t) => t.slug === templateSlug);
    if (!template) return;

    setSaving(product.id);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/merchant/products", {
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
      setSuccess(`"${product.title}" connected to "${template.name}"`);
    } catch {
      setError("Failed to save mapping");
    } finally {
      setSaving(null);
    }
  }

  const templateOptions = [
    { label: "Select a template…", value: "" },
    ...templates.map((t) => ({
      label: `${t.product.name} → ${t.name}`,
      value: t.slug,
    })),
  ];

  return (
    <Page
      title="Products"
      subtitle="Connect each Shopify product to a print template. The 3D design studio appears on the products you connect."
    >
      <Layout>
        {(error || success) && (
          <Layout.Section>
            {error && (
              <Banner tone="critical" onDismiss={() => setError(null)}>
                {error}
              </Banner>
            )}
            {success && (
              <Banner tone="success" onDismiss={() => setSuccess(null)}>
                {success}
              </Banner>
            )}
          </Layout.Section>
        )}

        <Layout.Section>
          <Card padding="0">
            {loading ? (
              <div style={{ padding: 16 }}>
                <SkeletonBodyText lines={6} />
              </div>
            ) : shopifyProducts.length === 0 ? (
              <div style={{ padding: 24 }}>
                <BlockStack gap="200" inlineAlign="center">
                  <Text as="p" variant="bodyMd" tone="subdued">
                    No products found in your Shopify store.
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Add products in your Shopify admin, then come back here.
                  </Text>
                </BlockStack>
              </div>
            ) : (
              <ResourceList
                resourceName={{ singular: "product", plural: "products" }}
                items={shopifyProducts}
                renderItem={(product) => {
                  const mapped = savedMap[product.id];
                  return (
                    <ResourceItem
                      id={String(product.id)}
                      onClick={() => {}}
                      media={
                        <Thumbnail
                          source={
                            product.images[0]?.src ??
                            "https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"
                          }
                          alt={product.title}
                          size="small"
                        />
                      }
                    >
                      <InlineStack align="space-between" blockAlign="center" gap="400">
                        <BlockStack gap="0">
                          <InlineStack gap="200" blockAlign="center">
                            <Text as="span" variant="bodyMd" fontWeight="semibold">
                              {product.title}
                            </Text>
                            {mapped && <Badge tone="success">Connected</Badge>}
                          </InlineStack>
                          <Text as="span" variant="bodySm" tone="subdued">
                            {product.handle}
                          </Text>
                        </BlockStack>
                        <div style={{ minWidth: 240 }}>
                          <Select
                            label="Template"
                            labelHidden
                            options={templateOptions}
                            value={mapped ?? ""}
                            disabled={saving === product.id}
                            onChange={(value) => handleMap(product, value)}
                          />
                        </div>
                      </InlineStack>
                    </ResourceItem>
                  );
                }}
              />
            )}
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                How it works
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                1. Connect each Shopify product to a print template above.
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                2. In your theme editor, add the “Design Studio” block to your product page.
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                3. Customers get a “Customize this product” button and design in the 3D studio.
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                4. At checkout the design is captured and routed to print automatically.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
