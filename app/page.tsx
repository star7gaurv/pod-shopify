import type { Metadata } from "next";
import { HomeAnnouncementBar } from "@/components/home/HomeAnnouncementBar";
import { HomeFooter } from "@/components/home/HomeFooter";
import { HomeHeroCarousel } from "@/components/home/HomeHeroCarousel";
import { HomeHowItWorks } from "@/components/home/HomeHowItWorks";
import { HomePerfectFor } from "@/components/home/HomePerfectFor";
import { HomeProductCatalog } from "@/components/home/HomeProductCatalog";
import { HomeSectionIntro } from "@/components/home/HomeSectionIntro";
import { HomeSatisfactionGuarantee } from "@/components/home/HomeSatisfactionGuarantee";
import { HomeTestimonials } from "@/components/home/HomeTestimonials";
import { HomeFinalCta } from "@/components/home/HomeFinalCta";
import { HashScrollHandler } from "@/components/layout/HashScrollHandler";
import { Navbar } from "@/components/layout/Navbar";
import { getPublicUrl } from "@/lib/r2";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: siteConfig.homeMetaTitle,
  description: siteConfig.homeMetaDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${siteConfig.homeMetaTitle} | ${siteConfig.name}`,
    description:
      "Choose your product, customize colors, logos, names, and numbers, then submit a clear design for production.",
    url: "/",
    images: [
      {
        url: siteConfig.homeOgImageUrl,
        alt: `${siteConfig.name} logo`,
      },
    ],
  },
  twitter: {
    title: `${siteConfig.homeMetaTitle} | ${siteConfig.name}`,
    description: siteConfig.homeMetaDescription,
    images: [siteConfig.homeOgImageUrl],
  },
};

export default function HomePage() {
  const firstCarouselImageUrl = getPublicUrl(
    "assets/carousels/679676578_122165568980685151_2949976358340040749_n.jpg",
  );

  return (
    <main className="min-h-screen bg-[#030913] text-white">
      <HashScrollHandler />
      <HomeAnnouncementBar />
      <Navbar currentPath="/" variant="home" />
      <HomeHeroCarousel firstSlideImageUrl={firstCarouselImageUrl} />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <HomeSectionIntro />
        <HomeProductCatalog />
        <HomeHowItWorks />
        <HomeSatisfactionGuarantee />
        <HomeTestimonials />
        <HomePerfectFor />
        <HomeFinalCta />
      </div>
      <HomeFooter />
    </main>
  );
}
