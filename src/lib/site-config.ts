import { getPublicUrl } from "@/lib/r2";

const DEFAULT_SITE_URL = "https://3d-studio-ten.vercel.app";
const DEFAULT_SITE_NAME = "SSN Apparels";
const DEFAULT_SITE_LOGO_PATH = "assets/ssn-logo.png";
const DEFAULT_ANNOUNCEMENT_TEXT =
  "Custom Apparel & Promotional Products — Free Shipping on Every Order";
const DEFAULT_CONTACT_PHONE = "+1 000-000-0000";
const DEFAULT_CONTACT_EMAIL = "hello@example.com";
const DEFAULT_CONTACT_ADDRESS = "";
const DEFAULT_FOOTER_DESCRIPTION =
  "Custom apparel design and production workflow for teams, events, and businesses.";
const DEFAULT_HOME_META_TITLE = "Design Custom Apparel Online";
const DEFAULT_HOME_META_DESCRIPTION =
  "Design custom shirts, polos, flags, tents, bags, and branded apparel online. Customize colors, logos, names, and numbers before production.";
const DEFAULT_HOME_OG_IMAGE_PATH = "assets/ssn-logo.png";

function getEnvValue(value: string | undefined, fallback: string) {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : fallback;
}

function resolveAssetUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return getPublicUrl(path);
}

const siteUrl = getEnvValue(process.env.NEXT_PUBLIC_SITE_URL, DEFAULT_SITE_URL);
const name = getEnvValue(process.env.NEXT_PUBLIC_SITE_NAME, DEFAULT_SITE_NAME);
const logoPath = getEnvValue(
  process.env.NEXT_PUBLIC_SITE_LOGO_PATH,
  DEFAULT_SITE_LOGO_PATH,
);
const homeOgImagePath = getEnvValue(
  process.env.NEXT_PUBLIC_HOME_OG_IMAGE_PATH,
  DEFAULT_HOME_OG_IMAGE_PATH,
);

export const siteConfig = {
  siteUrl,
  name,
  logoPath,
  logoUrl: resolveAssetUrl(logoPath),
  announcementText: getEnvValue(
    process.env.NEXT_PUBLIC_ANNOUNCEMENT_TEXT,
    DEFAULT_ANNOUNCEMENT_TEXT,
  ),
  phone: getEnvValue(
    process.env.NEXT_PUBLIC_CONTACT_PHONE,
    DEFAULT_CONTACT_PHONE,
  ),
  email: getEnvValue(
    process.env.NEXT_PUBLIC_CONTACT_EMAIL,
    DEFAULT_CONTACT_EMAIL,
  ),
  address: getEnvValue(
    process.env.NEXT_PUBLIC_CONTACT_ADDRESS,
    DEFAULT_CONTACT_ADDRESS,
  ),
  footerDescription: getEnvValue(
    process.env.NEXT_PUBLIC_FOOTER_DESCRIPTION,
    DEFAULT_FOOTER_DESCRIPTION,
  ),
  homeMetaTitle: getEnvValue(
    process.env.NEXT_PUBLIC_HOME_META_TITLE,
    DEFAULT_HOME_META_TITLE,
  ),
  homeMetaDescription: getEnvValue(
    process.env.NEXT_PUBLIC_HOME_META_DESCRIPTION,
    DEFAULT_HOME_META_DESCRIPTION,
  ),
  homeOgImagePath,
  homeOgImageUrl: resolveAssetUrl(homeOgImagePath),
} as const;
