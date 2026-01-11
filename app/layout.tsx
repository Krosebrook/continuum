import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Continuum - AI-Powered Opportunity Discovery",
  description: "Save your most precious resource for the important stuff. Automated opportunity research, qualification, and prioritization powered by AI.",
  keywords: ["opportunity discovery", "sales leads", "AI research", "business development", "lead generation", "sales automation"],
  authors: [{ name: "Continuum" }],
  openGraph: {
    title: "Continuum - AI-Powered Opportunity Discovery",
    description: "Save your most precious resource for the important stuff. AI-powered research that finds and qualifies opportunities for you.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://continuum.vercel.app",
    siteName: "Continuum",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Continuum - AI-Powered Opportunity Discovery",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Continuum - AI-Powered Opportunity Discovery",
    description: "Save your most precious resource for the important stuff.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
