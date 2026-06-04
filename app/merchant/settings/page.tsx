"use client";

import {
  BlockStack,
  Card,
  InlineStack,
  Layout,
  List,
  Page,
  Text,
} from "@shopify/polaris";
import { OpenDashboardButton } from "../_open-dashboard";

export default function MerchantSettings() {
  const webhooks = [
    "orders/create",
    "app/uninstalled",
    "customers/data_request",
    "customers/redact",
    "shop/redact",
  ];

  return (
    <Page title="Settings" subtitle="Set up the design studio on your storefront.">
      <Layout>
        {/* Theme block setup */}
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                Add the Design Studio to product pages
              </Text>
              <List type="number">
                <List.Item>
                  In Shopify admin, go to <b>Online Store → Themes</b>.
                </List.Item>
                <List.Item>
                  Click <b>Customize</b> on your active theme.
                </List.Item>
                <List.Item>Open a product page template.</List.Item>
                <List.Item>
                  Click <b>Add block</b> and choose <b>Design Studio</b>.
                </List.Item>
                <List.Item>Save the theme.</List.Item>
              </List>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Fulfillment routing */}
        <Layout.Section>
          <Card>
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                Print fulfillment
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                Orders route automatically by destination: India → Printrove,
                everywhere else → Printful. No setup needed.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Webhooks */}
        <Layout.Section>
          <Card>
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                Webhooks
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                These are registered automatically on install:
              </Text>
              <List>
                {webhooks.map((w) => (
                  <List.Item key={w}>{w}</List.Item>
                ))}
              </List>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Dashboard + support */}
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center" gap="300">
                <BlockStack gap="100">
                  <Text as="h2" variant="headingMd">
                    Reports, account & billing
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Manage your subscription and view detailed analytics in the full dashboard.
                  </Text>
                </BlockStack>
                <OpenDashboardButton>Open full dashboard</OpenDashboardButton>
              </InlineStack>
              <Text as="p" variant="bodySm" tone="subdued">
                Need help? Email support@pod.star7gaurav.in
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
