import { AEOStrength, AEORecommendation } from "../../email-templates";
import {
  TechnicalAnalysis,
  TechnicalDetails,
  PageSpeedResult,
  SSLResult,
  SitemapResult,
  RobotsResult,
  LlmsTxtResult,
} from "../types";
import { ParsedPage, getSchemaTypes, findSchemaByType } from "../cheerio-parser";

interface TechnicalApiData {
  psiData: PageSpeedResult | null;
  sslData: SSLResult | null;
  sitemapData: SitemapResult;
  robotsData: RobotsResult;
  llmsData: LlmsTxtResult;
  headers: Record<string, string>;
}

export function analyzeTechnical(
  page: ParsedPage,
  url: string,
  apiData: TechnicalApiData
): TechnicalAnalysis {
  const strengths: AEOStrength[] = [];
  const recommendations: AEORecommendation[] = [];
  let score = 0;

  const { $, jsonLdBlocks } = page;
  const { psiData, sslData, sitemapData, robotsData, llmsData } = apiData;
  const details: TechnicalDetails = {};

  // ─── Schema Markup (0.75 pts base + 0.5 pts depth) ───
  const schemaTypes = getSchemaTypes(jsonLdBlocks);
  const hasJsonLd = jsonLdBlocks.length > 0;
  const hasMicrodata = $("[itemscope]").length > 0;
  const hasSchemaMarkup = hasJsonLd || hasMicrodata;

  const hasFAQSchema = schemaTypes.includes("FAQPage") || schemaTypes.includes("QAPage");
  const hasArticleSchema = schemaTypes.includes("Article") || schemaTypes.includes("BlogPosting") || schemaTypes.includes("NewsArticle");
  const hasOrganizationSchema = schemaTypes.includes("Organization") || schemaTypes.includes("LocalBusiness");
  const hasWebSiteSchema = schemaTypes.includes("WebSite");
  const hasBreadcrumbSchema = schemaTypes.includes("BreadcrumbList");

  if (hasSchemaMarkup) {
    score += 0.75;
    const typeList = schemaTypes.length > 0 ? schemaTypes.join(", ") : "detected";
    strengths.push({
      category: "Technical",
      title: "Schema Markup Implemented",
      description: `Your site uses structured data (${typeList}) that helps AI understand your content.`,
    });

    // Depth bonus for multiple schema types
    const diverseSchemas = [hasFAQSchema, hasArticleSchema, hasOrganizationSchema, hasWebSiteSchema, hasBreadcrumbSchema].filter(Boolean).length;
    if (diverseSchemas >= 3) {
      score += 0.5;
      strengths.push({
        category: "Technical",
        title: "Rich Schema Coverage",
        description: `${diverseSchemas} different schema types found — comprehensive structured data coverage.`,
      });
    } else if (!hasFAQSchema && !hasArticleSchema) {
      recommendations.push({
        category: "Technical",
        title: "Add More Schema Types",
        description: "Add FAQ Schema to Q&A content and Article Schema to blog posts for better AI recognition.",
        why: "73% of page-one results use schema markup. Multiple schema types improve AI content understanding.",
      });
    }
  } else {
    recommendations.push({
      category: "Technical",
      title: "Implement Schema Markup",
      description:
        "Add Schema.org structured data using JSON-LD format. Start with Organization, FAQ, and Article schemas.",
      why: "Schema markup helps AI systems understand your content type and relationships. Sites with schema are significantly more likely to be cited.",
    });
  }

  // ─── HTTPS + SSL Health (0.5 pts + 0.25 pts) ───
  const isHttps = url.startsWith("https://");

  if (isHttps) {
    score += 0.5;
    strengths.push({
      category: "Technical",
      title: "Secure HTTPS Connection",
      description: "Your site uses HTTPS, essential for trust with both users and AI systems.",
    });

    if (sslData) {
      details.sslValid = sslData.isValid;
      details.sslDaysRemaining = sslData.daysRemaining;
      if (sslData.isValid && sslData.daysRemaining > 30) {
        score += 0.25;
      } else if (sslData.daysRemaining <= 30) {
        recommendations.push({
          category: "Technical",
          title: "SSL Certificate Expiring Soon",
          description: `Your SSL certificate expires in ${sslData.daysRemaining} days. Renew it immediately.`,
          why: "An expired SSL certificate will break trust signals and may prevent AI systems from accessing your site.",
        });
      }
    }
  } else {
    recommendations.push({
      category: "Technical",
      title: "Enable HTTPS",
      description: "Your site is not using HTTPS. Secure your site with an SSL certificate immediately.",
      why: "AI systems prioritize secure, trustworthy sources. HTTP sites may be skipped entirely.",
    });
  }

  // ─── Mobile Viewport (0.25 pts) ───
  const hasViewport = psiData?.audits.viewport ?? $('meta[name="viewport"]').length > 0;

  if (hasViewport) {
    score += 0.25;
    strengths.push({
      category: "Technical",
      title: "Mobile-Responsive",
      description: "Your site is configured for mobile devices.",
    });
  } else {
    recommendations.push({
      category: "Technical",
      title: "Add Mobile Viewport",
      description: "Add a mobile viewport meta tag for proper display on all devices.",
      why: "AI systems favor accessible sites that work well for all users.",
    });
  }

  // ─── Sitemap (0.5 pts) — Direct fetch ───
  details.sitemapFound = sitemapData.exists;
  details.sitemapUrlCount = sitemapData.urlCount;

  if (sitemapData.exists) {
    score += 0.5;
    const urlInfo = sitemapData.urlCount ? ` with ${sitemapData.urlCount} URLs` : "";
    const lastmodInfo = sitemapData.hasLastmod ? " and lastmod dates" : "";
    strengths.push({
      category: "Technical",
      title: "XML Sitemap Found",
      description: `Your site has an XML sitemap${urlInfo}${lastmodInfo}, helping AI crawlers discover all your content.`,
    });
  } else {
    recommendations.push({
      category: "Technical",
      title: "Create XML Sitemap",
      description: "Create an XML sitemap at /sitemap.xml with lastmod dates. Reference it in your robots.txt.",
      why: "Sitemaps help AI crawlers efficiently discover and prioritize your content.",
    });
  }

  // ─── Robots.txt (0.25 pts) ───
  details.robotsTxtFound = robotsData.exists;

  if (robotsData.exists) {
    score += 0.25;
    if (robotsData.hasSitemapDirective) {
      strengths.push({
        category: "Technical",
        title: "Robots.txt Configured",
        description: "Your robots.txt is properly configured with a Sitemap directive.",
      });
    }
  }

  // ─── AI Bot Crawlability (0.5 pts) — NEW ───
  details.aiBotsCrawlable = robotsData.allowsAllCrawlers;
  details.blockedAiBots = robotsData.blockedBots;

  if (robotsData.exists && robotsData.blockedBots.length > 0) {
    recommendations.push({
      category: "Technical",
      title: "AI Bots Are Blocked",
      description: `Your robots.txt blocks these AI crawlers: ${robotsData.blockedBots.join(", ")}. This prevents AI systems from indexing your content.`,
      why: "Blocking AI crawlers means your content won't be available for AI systems to cite. Consider allowing GPTBot, ClaudeBot, and PerplexityBot.",
    });
  } else if (robotsData.exists && robotsData.allowsAllCrawlers) {
    score += 0.5;
    strengths.push({
      category: "Technical",
      title: "AI Bots Allowed",
      description: "Your robots.txt allows AI crawlers (GPTBot, ClaudeBot, PerplexityBot) to access your content.",
    });
  }

  // ─── Canonical Tag (0.25 pts) ───
  const canonical = $('link[rel="canonical"]').attr("href");
  if (canonical) {
    score += 0.25;
    strengths.push({
      category: "Technical",
      title: "Canonical Tags",
      description: "Your site uses canonical tags to prevent duplicate content issues.",
    });
  }

  // ─── Open Graph (0.25 pts) ───
  const ogTitle = $('meta[property="og:title"]').attr("content");
  const ogDesc = $('meta[property="og:description"]').attr("content");
  const ogImage = $('meta[property="og:image"]').attr("content");
  const ogCompleteness = [ogTitle, ogDesc, ogImage].filter(Boolean).length;

  if (ogCompleteness >= 2) {
    score += 0.25;
    strengths.push({
      category: "Technical",
      title: "Open Graph Tags",
      description: `${ogCompleteness}/3 essential OG tags present (title, description, image) for rich content metadata.`,
    });
  } else if (ogCompleteness > 0) {
    recommendations.push({
      category: "Technical",
      title: "Complete Open Graph Tags",
      description: "Add missing OG tags (og:title, og:description, og:image) for complete social and content metadata.",
    });
  }

  // ─── LLMs.txt (0.5 pts) — Direct fetch ───
  details.llmsTxtFound = llmsData.exists;

  if (llmsData.exists) {
    score += 0.5;
    strengths.push({
      category: "Technical",
      title: "LLMs.txt File Found",
      description: "Your site has an llms.txt file — this emerging standard helps AI systems understand your site.",
    });
  } else {
    recommendations.push({
      category: "Technical",
      title: "Consider Adding llms.txt",
      description:
        "Create an llms.txt file at your site root. This emerging standard provides AI systems with a summary of your site — like a robots.txt for LLMs.",
      why: "Early adopters of llms.txt gain an advantage as AI systems begin to recognize this standard.",
    });
  }

  // ─── Page Speed (0.5 pts) — from PSI API ───
  if (psiData) {
    details.performanceScore = psiData.performanceScore;
    details.accessibilityScore = psiData.accessibilityScore;
    details.seoScore = psiData.seoScore;
    details.coreWebVitals = {
      lcp: psiData.metrics.lcp,
      fcp: psiData.metrics.fcp,
      cls: psiData.metrics.cls,
      tbt: psiData.metrics.tbt,
    };

    if (psiData.performanceScore >= 90) {
      score += 0.5;
      strengths.push({
        category: "Technical",
        title: "Excellent Page Speed",
        description: `Performance score: ${psiData.performanceScore}/100. Fast-loading pages are prioritized by AI systems.`,
      });
    } else if (psiData.performanceScore >= 50) {
      score += 0.25;
      strengths.push({
        category: "Technical",
        title: "Acceptable Page Speed",
        description: `Performance score: ${psiData.performanceScore}/100. Improving to 90+ would strengthen AI visibility.`,
      });
    } else {
      recommendations.push({
        category: "Technical",
        title: "Improve Page Speed",
        description: `Performance score: ${psiData.performanceScore}/100. Optimize images, reduce JavaScript, and improve server response time.`,
        why: "Slow pages may timeout when AI systems try to crawl them, reducing citation likelihood.",
      });
    }

    // Accessibility score (0.25 pts)
    if (psiData.accessibilityScore >= 90) {
      score += 0.25;
      strengths.push({
        category: "Technical",
        title: "Strong Accessibility",
        description: `Accessibility score: ${psiData.accessibilityScore}/100. Accessible sites are seen as more trustworthy by AI.`,
      });
    }
  }

  return {
    score: Math.min(score, 5),
    strengths,
    recommendations,
    details,
  };
}
