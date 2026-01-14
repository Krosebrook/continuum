import type { Metadata } from "next";
import "./globals.css";

// Note: Font configuration moved to globals.css for better reliability
// in restricted network environments (CI/CD, air-gapped systems)
// Using system fonts with Inter as preferred font family via @import in CSS

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://continuum.vercel.app"),
  title: "Continuum - AI-Powered Opportunity Discovery",
  description: "Save your most precious resource for the important stuff. Automated opportunity research, qualification, and prioritization powered by AI.",
  keywords: ["opportunity discovery", "sales leads", "AI research", "business development", "lead generation", "sales automation"],
  authors: [{ name: "Continuum" }],
  openGraph: {
    title: "Continuum - AI-Powered Opportunity Discovery",
    description: "Save your most precious resource for the important stuff. AI-powered research that finds and qualifies opportunities for you.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://continuum.vercel.app",
    siteName: "Continuum",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Continuum - AI-Powered Opportunity Discovery",
    description: "Save your most precious resource for the important stuff.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
