import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthSessionProvider } from "@/components/providers/AuthSessionProvider";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  applicationName: siteConfig.name,
  title: {
    default: `${siteConfig.name} | Custom Apparel & Promotional Products`,
    template: `%s | ${siteConfig.name}`,
  },
  description: `Design custom apparel and promotional products online with ${siteConfig.name}. Customize shirts, polos, flags, tents, bags, logos, names, and numbers before production.`,
  creator: siteConfig.name,
  publisher: siteConfig.name,
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: `${siteConfig.name} | Custom Apparel & Promotional Products`,
    description: `Design custom apparel and promotional products online with ${siteConfig.name}. Customize shirts, polos, flags, tents, bags, logos, names, and numbers before production.`,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | Custom Apparel & Promotional Products`,
    description: `Design custom apparel and promotional products online with ${siteConfig.name}. Customize shirts, polos, flags, tents, bags, logos, names, and numbers before production.`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth`}
    >
      <body className="min-h-full bg-[var(--background)] font-sans text-[var(--foreground)] antialiased">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
