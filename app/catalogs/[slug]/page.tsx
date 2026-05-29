import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogItemDetail } from "@/components/catalog/CatalogItemDetail";
import { HomeAnnouncementBar } from "@/components/home/HomeAnnouncementBar";
import { HomeFooter } from "@/components/home/HomeFooter";
import { Navbar } from "@/components/layout/Navbar";
import { getCatalogItemBySlug } from "@/lib/catalog";
import { getPublicUrl } from "@/lib/r2";

const defaultCatalogSocialImageUrl = getPublicUrl("assets/ssn-logo.png");

type CatalogDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: CatalogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await getCatalogItemBySlug(slug);

  if (!item) {
    return {
      title: "Catalog Item",
      description: "Browse custom apparel and promotional products from SSN Apparels.",
      alternates: {
        canonical: `/catalogs/${slug}`,
      },
    };
  }

  const title = item.metaTitle?.trim() || item.title;
  const description = item.metaDescription?.trim() || item.shortDescription;
  const socialImage = item.ogImagePath || item.imagePath || defaultCatalogSocialImageUrl;

  return {
    title,
    description,
    alternates: {
      canonical: `/catalogs/${item.slug}`,
    },
    openGraph: {
      title: `${title} | SSN Apparels`,
      description,
      url: `/catalogs/${item.slug}`,
      images: [
        {
          url: socialImage,
          alt: `${item.title} preview image`,
        },
      ],
    },
    twitter: {
      title: `${title} | SSN Apparels`,
      description,
      images: [socialImage],
    },
  };
}

export default async function CatalogItemDetailPage({
  params,
}: CatalogDetailPageProps) {
  const { slug } = await params;
  const item = await getCatalogItemBySlug(slug);

  if (!item) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#030913] text-white">
      <HomeAnnouncementBar />
      <Navbar currentPath="/catalogs" variant="home" />
      <CatalogItemDetail item={item} />
      <HomeFooter />
    </main>
  );
}
