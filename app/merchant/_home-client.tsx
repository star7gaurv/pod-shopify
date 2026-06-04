"use client";

import { useEffect, useState } from "react";
import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  InlineStack,
  Layout,
  Page,
  ProgressBar,
  SkeletonBodyText,
  Text,
  Thumbnail,
} from "@shopify/polaris";
import { OpenDashboardButton } from "./_open-dashboard";

type RecentOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  totalPrice: string;
  createdAt: string;
  productName: string;
  designToken: string | null;
  previewImagePath: string | null;
};

type Home = {
  shopDomain: string;
  plan: string;
  subscription: {
    status: string;
    trialEndsAt?: string;
    currentPeriodEnd?: string;
  } | null;
  designsUsed: number;
  designLimit: number;
  mappedProducts: number;
  pendingOrders: number;
  recentOrders: RecentOrder[];
};

const STATUS_TONE: Record<
  string,
  "success" | "attention" | "info" | "critical" | undefined
> = {
  completed: "success",
  processing: "info",
  pending: "attention",
  cancelled: "critical",
};

export function HomeClient() {
  const [data, setData] = useState<Home | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/merchant/home")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Home | null) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  const isPaid = data ? data.plan !== "free" : false;
  const subStatus = data?.subscription?.status;
  const needsPlan =
    !!data && !isPaid && (subStatus === "cancelled" || subStatus === "halted" || !data.subscription);

  const checklist = data
    ? [
        { label: "Connect a product to a print template", done: data.mappedProducts > 0, href: "/merchant/products" },
        { label: "Add the Design Studio block in your theme editor", done: false, href: "/merchant/settings" },
        { label: "Start your plan to go live", done: isPaid || (!!data.subscription && subStatus !== "cancelled" && subStatus !== "halted"), href: null },
      ]
    : [];

  return (
    <Page
      title="Print Studio"
      subtitle={data?.shopDomain}
      primaryAction={{ content: "Connect products", url: "/merchant/products" }}
      secondaryActions={[
        { content: "Preview studio", url: "/studio", external: true },
      ]}
    >
      <Layout>
        {needsPlan && (
          <Layout.Section>
            <Banner tone="warning" title="Your plan isn't active">
              <InlineStack gap="300" blockAlign="center">
                <Text as="p" variant="bodyMd">
                  Subscribe to keep the design studio live on your storefront after the free designs run out.
                </Text>
                <OpenDashboardButton to="/dashboard/billing" variant="primary">
                  Manage subscription
                </OpenDashboardButton>
              </InlineStack>
            </Banner>
          </Layout.Section>
        )}

        {/* Setup checklist */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Setup
              </Text>
              {loading ? (
                <SkeletonBodyText lines={3} />
              ) : (
                <BlockStack gap="300">
                  {checklist.map((step) => (
                    <InlineStack key={step.label} align="space-between" blockAlign="center" gap="300">
                      <InlineStack gap="200" blockAlign="center">
                        <Badge tone={step.done ? "success" : undefined}>
                          {step.done ? "Done" : "To do"}
                        </Badge>
                        <Text as="span" variant="bodyMd">
                          {step.label}
                        </Text>
                      </InlineStack>
                      {!step.done && step.href && (
                        <Button variant="plain" url={step.href}>
                          Set up
                        </Button>
                      )}
                    </InlineStack>
                  ))}
                </BlockStack>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Free designs counter */}
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingMd">
                  Designs
                </Text>
                {data && (
                  <Badge tone={isPaid ? "success" : undefined}>
                    {isPaid ? `${data.plan} plan` : "Free plan"}
                  </Badge>
                )}
              </InlineStack>
              {loading || !data ? (
                <SkeletonBodyText lines={2} />
              ) : isPaid ? (
                <Text as="p" variant="bodyMd" tone="subdued">
                  {data.designsUsed} designs saved · unlimited on your current plan.
                </Text>
              ) : (
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd">
                    {Math.min(data.designsUsed, data.designLimit)} of {data.designLimit} free designs used
                  </Text>
                  <ProgressBar
                    progress={Math.min(100, (data.designsUsed / data.designLimit) * 100)}
                    tone={data.designsUsed >= data.designLimit ? "critical" : "primary"}
                    size="small"
                  />
                  {data.designsUsed >= data.designLimit && (
                    <Text as="p" variant="bodySm" tone="critical">
                      Free design limit reached — subscribe to let customers keep saving designs.
                    </Text>
                  )}
                </BlockStack>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Recent orders snippet */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingMd">
                  Recent orders
                </Text>
                <OpenDashboardButton to="/dashboard/orders" variant="tertiary">
                  View all orders
                </OpenDashboardButton>
              </InlineStack>
              {loading ? (
                <SkeletonBodyText lines={4} />
              ) : !data || data.recentOrders.length === 0 ? (
                <Text as="p" variant="bodyMd" tone="subdued">
                  No orders yet. They appear here when a customer customizes and buys a product.
                </Text>
              ) : (
                <BlockStack gap="300">
                  {data.recentOrders.map((o) => (
                    <InlineStack key={o.id} align="space-between" blockAlign="center" gap="300">
                      <InlineStack gap="300" blockAlign="center">
                        <Thumbnail
                          source={o.previewImagePath ?? "https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"}
                          alt="Design preview"
                          size="small"
                        />
                        <BlockStack gap="0">
                          <Text as="span" variant="bodyMd" fontWeight="semibold">
                            #{o.orderNumber}
                          </Text>
                          <Text as="span" variant="bodySm" tone="subdued">
                            {o.customerName} · {o.productName}
                          </Text>
                        </BlockStack>
                      </InlineStack>
                      <InlineStack gap="300" blockAlign="center">
                        <Text as="span" variant="bodyMd">
                          ₹{o.totalPrice}
                        </Text>
                        <Badge tone={STATUS_TONE[o.status]}>{o.status}</Badge>
                      </InlineStack>
                    </InlineStack>
                  ))}
                </BlockStack>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Full dashboard pointer */}
        <Layout.Section>
          <Box paddingBlockEnd="400">
            <Card>
              <InlineStack align="space-between" blockAlign="center" gap="300">
                <BlockStack gap="100">
                  <Text as="h2" variant="headingMd">
                    Reports & billing
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Revenue, full order history, and your subscription live in the dashboard.
                  </Text>
                </BlockStack>
                <OpenDashboardButton>Open full dashboard</OpenDashboardButton>
              </InlineStack>
            </Card>
          </Box>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
