import { Hero } from "@/components/sections/hero";
import { Problem } from "@/components/sections/problem";
import { About } from "@/components/sections/about";
import { WhatIsAeo } from "@/components/sections/what-is-aeo";
import { Benefits } from "@/components/sections/benefits";
import { Services } from "@/components/sections/services";
import { AssessmentTool } from "@/components/sections/assessment-tool";
import { Faq } from "@/components/sections/faq";

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is AEO (Answer Engine Optimization)?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "AEO is the practice of optimizing your content and website to be discovered, understood, and cited by AI-powered answer engines like ChatGPT, Perplexity, Claude, and Google's AI Overviews.",
      },
    },
    {
      "@type": "Question",
      name: "How is AEO different from SEO?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "While SEO focuses on ranking in traditional search results, AEO focuses on being cited and recommended by AI systems. AEO optimizes for structured answers, authoritative content, and AI-readable formats.",
      },
    },
    {
      "@type": "Question",
      name: "How long does it take to see results?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Some clients see improvements in AI mentions within 4-6 weeks, while comprehensive AEO strategies typically show significant results within 3-6 months.",
      },
    },
    {
      "@type": "Question",
      name: "Can you guarantee AI mentions?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "While we can't guarantee specific mentions, we optimize your content to maximize the likelihood of being cited based on how LLMs process and recommend content.",
      },
    },
    {
      "@type": "Question",
      name: "What does the assessment include?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Our assessment analyzes Content (30%), Technical (25%), Authority (25%), and Measurement (20%). You receive a maturity score from 1-5 for each category with specific recommendations.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need to stop doing SEO?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. AEO complements SEO rather than replacing it. Many AEO best practices also benefit traditional SEO. We recommend an integrated approach.",
      },
    },
  ],
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  serviceType: "Answer Engine Optimization",
  provider: {
    "@type": "Organization",
    name: "UpClick Labs",
    url: "https://upclicklabs.com",
  },
  description:
    "UpClick Labs provides Answer Engine Optimization services to help businesses get mentioned by AI search engines like ChatGPT, Perplexity, Claude, and Google Gemini.",
  areaServed: "Worldwide",
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "AEO Services",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "AI Visibility Monitoring",
          description:
            "Track where and how AI mentions your brand across ChatGPT, Perplexity, Claude, and other AI platforms.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Content Optimization",
          description:
            "Create AI-optimized content at scale with proper structure, schema markup, and question-answer formatting.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Technical AEO",
          description:
            "Implement schema markup, structured data, and AI crawler optimization for better AI visibility.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "AEO Analytics & Reporting",
          description:
            "Measure AI-driven traffic, brand mentions, and visibility with comprehensive reporting.",
        },
      },
    ],
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceSchema),
        }}
      />
      <Hero />
      <Problem />
      <About />
      <WhatIsAeo />
      <Benefits />
      <Services />
      <AssessmentTool />
      <Faq />
    </>
  );
}
