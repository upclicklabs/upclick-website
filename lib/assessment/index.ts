import * as cheerio from "cheerio";
import { AEOReport } from "../email-templates";
import { fetchWebsite, extractInternalLinks, fetchMultiplePages, normalizeUrl } from "./fetcher";
import { parsePage, ParsedPage } from "./cheerio-parser";
import { analyzeContent } from "./analyzers/content";
import { analyzeTechnical } from "./analyzers/technical";
import { analyzeAuthority } from "./analyzers/authority";
import { analyzeMeasurement } from "./analyzers/measurement";
import {
  getMaturityLevel,
  calculateOverallScore,
  generatePillarSummaries,
  generateTopPriorities,
} from "./scoring";

// API clients
import { callPageSpeedInsights } from "./apis/pagespeed";
import { checkSSLCertificate } from "./apis/ssl-checker";
import { fetchSitemapXml } from "./apis/sitemap-checker";
import { fetchRobotsTxt } from "./apis/robots-checker";
import { fetchLlmsTxt } from "./apis/llms-txt-checker";
import { searchKnowledgeGraph } from "./apis/knowledge-graph";
import { searchRedditMentions } from "./apis/reddit-checker";

export async function analyzeWebsite(url: string): Promise<AEOReport> {
  // Ensure URL has protocol
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  const normalizedUrl = normalizeUrl(url);
  const baseUrl = new URL(normalizedUrl).origin;
  const hostname = new URL(normalizedUrl).hostname.replace("www.", "");

  console.log(`Starting AEO analysis for ${normalizedUrl}`);

  // ═══════════════════════════════════════════════════════════════
  // PHASE 1: Fire all independent requests in parallel
  // ═══════════════════════════════════════════════════════════════
  const [
    htmlResult,
    psiResult,
    robotsResult,
    sitemapResult,
    llmsResult,
    sslResult,
    kgResult,
    redditResult,
  ] = await Promise.allSettled([
    fetchWebsite(normalizedUrl),
    callPageSpeedInsights(normalizedUrl),
    fetchRobotsTxt(baseUrl),
    fetchSitemapXml(baseUrl),
    fetchLlmsTxt(baseUrl),
    checkSSLCertificate(new URL(normalizedUrl).hostname),
    searchKnowledgeGraph(hostname),
    searchRedditMentions(hostname),
  ]);

  // HTML fetch is required; others are optional
  if (htmlResult.status === "rejected") {
    throw new Error(`Failed to fetch website: ${htmlResult.reason}`);
  }

  const { html, headers, url: resolvedUrl } = htmlResult.value;

  // Extract optional results (graceful degradation)
  const psiData = psiResult.status === "fulfilled" ? psiResult.value : null;
  const robotsData = robotsResult.status === "fulfilled"
    ? robotsResult.value
    : { exists: false, hasSitemapDirective: false, blockedBots: [] as string[], allowsAllCrawlers: true, content: "" };
  const sitemapData = sitemapResult.status === "fulfilled"
    ? sitemapResult.value
    : { exists: false };
  const llmsData = llmsResult.status === "fulfilled"
    ? llmsResult.value
    : { exists: false };
  const sslData = sslResult.status === "fulfilled" ? sslResult.value : null;
  const knowledgeGraphData = kgResult.status === "fulfilled" ? kgResult.value : null;
  const redditData = redditResult.status === "fulfilled"
    ? redditResult.value
    : { hasMentions: false, postCount: 0, subreddits: [] as string[], recentMentions: 0 };

  console.log("API results collected:", {
    psi: !!psiData,
    robots: robotsData.exists,
    sitemap: sitemapData.exists,
    llms: llmsData.exists,
    ssl: !!sslData,
    kg: !!knowledgeGraphData?.found,
    reddit: redditData.postCount,
  });

  // ═══════════════════════════════════════════════════════════════
  // PHASE 2: Parse HTML and extract links
  // ═══════════════════════════════════════════════════════════════
  const homePage = parsePage(html, resolvedUrl);
  const $ = homePage.$;

  // Extract internal links to priority pages
  const additionalLinks = extractInternalLinks($, resolvedUrl);
  console.log(`Found ${additionalLinks.length} priority pages to crawl:`, additionalLinks);

  // ═══════════════════════════════════════════════════════════════
  // PHASE 3: Crawl additional pages
  // ═══════════════════════════════════════════════════════════════
  const additionalPages = new Map<string, ParsedPage>();

  if (additionalLinks.length > 0) {
    const rawPages = await fetchMultiplePages(additionalLinks);
    for (const [pageUrl, pageHtml] of rawPages) {
      additionalPages.set(pageUrl, parsePage(pageHtml, pageUrl));
    }
    console.log(`Analyzed ${additionalPages.size + 1} pages total`);
  }

  // ═══════════════════════════════════════════════════════════════
  // PHASE 4: Run all pillar analyses
  // ═══════════════════════════════════════════════════════════════
  const contentAnalysis = analyzeContent(homePage, additionalPages);
  const technicalAnalysis = analyzeTechnical(homePage, resolvedUrl, {
    psiData,
    sslData,
    sitemapData,
    robotsData,
    llmsData,
    headers,
  });
  const authorityAnalysis = analyzeAuthority(homePage, additionalPages, {
    knowledgeGraphData,
    redditData,
  });
  const measurementAnalysis = analyzeMeasurement(homePage);

  // ═══════════════════════════════════════════════════════════════
  // PHASE 5: Compile results
  // ═══════════════════════════════════════════════════════════════
  const allStrengths = [
    ...contentAnalysis.strengths,
    ...technicalAnalysis.strengths,
    ...authorityAnalysis.strengths,
    ...measurementAnalysis.strengths,
  ];

  const recommendationsByPillar = {
    Content: contentAnalysis.recommendations,
    Technical: technicalAnalysis.recommendations,
    Authority: authorityAnalysis.recommendations,
    Measurement: measurementAnalysis.recommendations,
  };

  const overallScore = calculateOverallScore(
    contentAnalysis.score,
    technicalAnalysis.score,
    authorityAnalysis.score,
    measurementAnalysis.score
  );

  const maturity = getMaturityLevel(overallScore);

  const pillarSummaries = generatePillarSummaries(
    contentAnalysis.score,
    technicalAnalysis.score,
    authorityAnalysis.score,
    measurementAnalysis.score,
    allStrengths,
    recommendationsByPillar,
    resolvedUrl
  );

  const topPriorities = generateTopPriorities(recommendationsByPillar);

  console.log("Analysis complete:", {
    overall: overallScore,
    content: contentAnalysis.score,
    technical: technicalAnalysis.score,
    authority: authorityAnalysis.score,
    measurement: measurementAnalysis.score,
    maturity: maturity.level,
    strengths: allStrengths.length,
  });

  return {
    url: resolvedUrl,
    scores: {
      content: Math.round(contentAnalysis.score * 10) / 10,
      technical: Math.round(technicalAnalysis.score * 10) / 10,
      authority: Math.round(authorityAnalysis.score * 10) / 10,
      measurement: Math.round(measurementAnalysis.score * 10) / 10,
      overall: overallScore,
    },
    maturityLevel: maturity.level,
    maturityDescription: maturity.description,
    strengths: allStrengths,
    recommendationsByPillar,
    pillarSummaries,
    topPriorities,
    analyzedAt: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    // Detailed analysis data from APIs and Cheerio
    technicalDetails: technicalAnalysis.details,
    contentDetails: contentAnalysis.details,
    authorityDetails: authorityAnalysis.details,
    measurementDetails: measurementAnalysis.details,
  };
}
