import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UpClick Labs | Answer Engine Optimization Agency",
  description:
    "Get your brand mentioned by AI. UpClick Labs helps businesses optimize for ChatGPT, Perplexity, Claude, and other AI search engines.",
  keywords: [
    "AEO",
    "Answer Engine Optimization",
    "AI SEO",
    "ChatGPT optimization",
    "Perplexity optimization",
    "UpClick Labs",
    "AI search optimization",
  ],
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "UpClick Labs",
  url: "https://upclicklabs.com",
  logo: "https://upclicklabs.com/upclick logos/upclick logo white no background.svg",
  description:
    "UpClick Labs is an Answer Engine Optimization (AEO) agency that helps businesses get mentioned by AI search engines like ChatGPT, Perplexity, and Claude.",
  email: "hello@upclicklabs.com",
  sameAs: [],
  contactPoint: {
    "@type": "ContactPoint",
    email: "hello@upclicklabs.com",
    contactType: "customer service",
  },
  areaServed: "Worldwide",
  serviceType: ["Answer Engine Optimization", "AEO", "AI Search Optimization"],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "UpClick Labs",
  url: "https://upclicklabs.com",
  description:
    "Get your brand mentioned by AI. UpClick Labs helps businesses optimize for ChatGPT, Perplexity, Claude, and other AI search engines.",
  publisher: {
    "@type": "Organization",
    name: "UpClick Labs",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
