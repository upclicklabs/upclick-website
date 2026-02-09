import * as cheerio from "cheerio";
import { AEOStrength, AEORecommendation } from "../../email-templates";
import { ContentAnalysis, ContentDetails } from "../types";
import { ParsedPage, countWords } from "../cheerio-parser";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const textReadability = require("text-readability");

// ═══════════════════════════════════════════════════════════════
// Page Classification — detect what kind of page this is
// ═══════════════════════════════════════════════════════════════
type PageType = "editorial" | "product" | "informational";

function classifyPage(url: string, page: ParsedPage): PageType {
  const path = (() => {
    try { return new URL(url).pathname.toLowerCase(); }
    catch { return ""; }
  })();
  const { $, jsonLdBlocks } = page;

  // Check for blog/article schema
  const hasArticleSchema = jsonLdBlocks.some((b) => {
    const t = b["@type"];
    const types = typeof t === "string" ? [t] : Array.isArray(t) ? t : [];
    return types.some((type) =>
      ["Article", "BlogPosting", "NewsArticle", "TechArticle", "ScholarlyArticle"].includes(type)
    );
  });

  // Check for product schema
  const hasProductSchema = jsonLdBlocks.some((b) => {
    const t = b["@type"];
    const types = typeof t === "string" ? [t] : Array.isArray(t) ? t : [];
    return types.some((type) => ["Product", "ItemList", "OfferCatalog"].includes(type));
  });

  // URL path signals
  const editorialPaths = ["/blog", "/article", "/news", "/post", "/guide", "/learn", "/resource"];
  const productPaths = ["/product", "/shop", "/store", "/collection", "/catalog", "/item"];
  const isEditorialPath = editorialPaths.some((p) => path.includes(p));
  const isProductPath = productPaths.some((p) => path.includes(p));

  // Content signals for product pages
  const addToCartButtons = $("button, a").filter((_, el) => {
    const text = $(el).text().toLowerCase();
    return text.includes("add to cart") || text.includes("add to bag") || text.includes("buy now");
  }).length;
  const priceElements = $("[class*='price'], [data-price], .money, .Price").length;
  const hasProductGrid = $("[class*='product-grid'], [class*='product-list'], [class*='product-card'], [class*='ProductCard']").length > 0;

  // Classify
  if (hasArticleSchema || isEditorialPath) return "editorial";
  if (hasProductSchema || isProductPath || addToCartButtons >= 2 || priceElements >= 5 || hasProductGrid) return "product";
  return "informational";
}

// ═══════════════════════════════════════════════════════════════
// Content-area scoped Cheerio helpers
// Strip product grids, nav, footer from content analysis
// ═══════════════════════════════════════════════════════════════
function getContentArea$($: cheerio.CheerioAPI): cheerio.CheerioAPI {
  const $clone = cheerio.load($.html());
  // Remove non-content elements
  $clone(
    "script, style, nav, header, footer, aside, noscript, svg, iframe, form, " +
    "[role='navigation'], [role='banner'], [role='complementary'], [aria-hidden='true'], " +
    // Product grid elements that inflate content metrics
    "[class*='product-grid'], [class*='product-list'], [class*='product-card'], " +
    "[class*='ProductCard'], [class*='ProductGrid'], [class*='ProductList'], " +
    "[class*='collection-grid'], [class*='CollectionGrid'], " +
    "[class*='cart'], [class*='Cart'], " +
    "[class*='shopify-section-'], " +
    // Price elements
    "[class*='price'], [data-price], .money, .Price"
  ).remove();
  return $clone;
}

// Get main content text from a single page (filtered)
function getFilteredMainContent($: cheerio.CheerioAPI): string {
  const $clean = getContentArea$($);
  const content = $clean("main, article, [role='main'], .content, #content").text();
  if (content.trim().length > 100) {
    return content.replace(/\s+/g, " ").trim();
  }
  return $clean("body").text().replace(/\s+/g, " ").trim();
}

// ═══════════════════════════════════════════════════════════════
// Per-page metrics — analyze one page at a time
// ═══════════════════════════════════════════════════════════════
interface PageMetrics {
  url: string;
  type: PageType;
  wordCount: number;
  h1Count: number;
  h2Count: number;
  h3Count: number;
  imageCount: number;
  imagesWithAlt: number;
  internalLinkCount: number;
  questionHeadings: number;
  totalHeadings: number;
  listCount: number;
  dataPoints: number;
  hasFaq: boolean;
  hasTableOfContents: boolean;
  hasSummary: boolean;
  hasLastUpdated: boolean;
  hasTables: boolean;
  hasSteps: boolean;
  hasComparisons: boolean;
}

function analyzePageMetrics(url: string, page: ParsedPage): PageMetrics {
  const { $, jsonLdBlocks } = page;
  const type = classifyPage(url, page);
  const $content = getContentArea$($);
  const mainText = getFilteredMainContent($);

  // Word count from filtered content
  const wordCount = countWords(mainText);

  // Heading counts from content area only
  const h1Count = $content("main h1, article h1, [role='main'] h1").length || $content("h1").length;
  const h2Count = $content("main h2, article h2, [role='main'] h2").length || $content("h2").length;
  const h3Count = $content("main h3, article h3, [role='main'] h3").length || $content("h3").length;

  // Images from content area
  const allImages = $content("main img, article img, [role='main'] img");
  const imageCount = allImages.length > 0 ? allImages.length : $content("img").length;
  const imagesWithAlt = (allImages.length > 0 ? allImages : $content("img")).filter((_, el) => {
    const alt = $content(el).attr("alt");
    return !!(alt && alt.trim().length > 0);
  }).length;

  // Internal links from content areas only (not nav)
  let internalLinkCount = 0;
  const baseHostname = (() => {
    try { return new URL(url).hostname; }
    catch { return ""; }
  })();
  $content("main a[href], article a[href], [role='main'] a[href]").each((_, el) => {
    const href = $content(el).attr("href") || "";
    if (href.startsWith("/") || (baseHostname && href.includes(baseHostname))) {
      internalLinkCount++;
    }
  });

  // Question headings
  let questionHeadings = 0;
  let totalHeadings = 0;
  $content("h1, h2, h3, h4").each((_, el) => {
    totalHeadings++;
    if ($content(el).text().includes("?")) questionHeadings++;
  });

  // Lists
  const listCount = $content("main ul, article ul, main ol, article ol, [role='main'] ul, [role='main'] ol").length
    || $content("ul, ol").length;

  // Data points (tightened regex — excludes prices, product weights)
  // Only match: percentages, large numbers with commas (but NOT currency), multipliers
  const dataPointPattern = /\b\d+(\.\d+)?%|\b\d{1,3}(,\d{3}){2,}\b|\d+x\b/g;
  const dataPoints = (mainText.match(dataPointPattern) || []).length;

  // FAQ detection
  const hasFaqSchema = jsonLdBlocks.some(
    (b) => b["@type"] === "FAQPage" || b["@type"] === "QAPage"
  );
  const hasFaqHeading = $content("h1, h2, h3, h4")
    .filter((_, el) => {
      const text = $content(el).text().toLowerCase();
      return text.includes("faq") || text.includes("frequently asked") || text.includes("common questions");
    }).length > 0;
  const hasDetailsElements = $("details summary").length >= 2;
  const hasFaqSection = $content("section, div")
    .filter((_, el) => {
      const id = ($content(el).attr("id") || "").toLowerCase();
      const cls = ($content(el).attr("class") || "").toLowerCase();
      return id.includes("faq") || cls.includes("faq");
    }).length > 0;
  const hasFaq = hasFaqSchema || hasFaqHeading || hasDetailsElements || hasFaqSection;

  // Table of contents
  const hasTocElement = $content('[class*="toc"], [id="toc"], [class*="table-of-contents"]').length > 0;
  const hasTocHeading = $content("h2, h3, h4")
    .filter((_, el) => /table of contents|contents|in this article/i.test($content(el).text()))
    .length > 0;
  const anchorLinks = $('a[href^="#"]').length;
  const hasTableOfContents = hasTocElement || hasTocHeading || anchorLinks >= 5;

  // Summary snippets
  const hasSummary = $content("h1, h2, h3, h4, p")
    .filter((_, el) => {
      const text = $content(el).text().toLowerCase();
      return (
        text.includes("in summary") || text.includes("key takeaway") ||
        text.includes("tl;dr") || text.includes("tldr") || text.includes("bottom line")
      );
    }).length > 0;

  // Last updated
  const hasDateModified = jsonLdBlocks.some((b) => b.dateModified || b.datePublished);
  const hasTimeElement = $("time[datetime]").length > 0;
  const hasLastUpdatedText = /last updated|updated on|modified/i.test(mainText);
  const hasLastUpdated = hasDateModified || hasTimeElement || hasLastUpdatedText;

  // Structured formats
  const hasTables = $content("main table, article table").length > 0 || $content("table").length > 0;
  const hasSteps = /step \d|step-by-step/i.test(mainText);
  const hasComparisons = $content("main table th, article table th").length >= 2 ||
    /vs\.?\s|versus|compared to|comparison/i.test(mainText);

  return {
    url, type, wordCount, h1Count, h2Count, h3Count,
    imageCount, imagesWithAlt, internalLinkCount,
    questionHeadings, totalHeadings, listCount, dataPoints,
    hasFaq, hasTableOfContents, hasSummary, hasLastUpdated,
    hasTables, hasSteps, hasComparisons,
  };
}

// ═══════════════════════════════════════════════════════════════
// Main Analysis Function
// ═══════════════════════════════════════════════════════════════
export function analyzeContent(
  page: ParsedPage,
  additionalPages: Map<string, ParsedPage>
): ContentAnalysis {
  const strengths: AEOStrength[] = [];
  const recommendations: AEORecommendation[] = [];
  let score = 0;
  const details: ContentDetails = {};

  // Analyze homepage
  const homeUrl = (() => {
    try {
      const canonical = page.$('link[rel="canonical"]').attr("href");
      if (canonical) return canonical;
    } catch { /* skip */ }
    return "";
  })();

  const homeMetrics = analyzePageMetrics(homeUrl || "homepage", page);

  // Analyze additional pages individually
  const additionalMetrics: PageMetrics[] = [];
  for (const [url, additionalPage] of additionalPages) {
    additionalMetrics.push(analyzePageMetrics(url, additionalPage));
  }

  const allMetrics = [homeMetrics, ...additionalMetrics];
  const editorialPages = allMetrics.filter((m) => m.type === "editorial");
  const nonProductPages = allMetrics.filter((m) => m.type !== "product");
  // Use non-product pages for content scoring. If all pages are product pages, use all.
  const scoringPages = nonProductPages.length > 0 ? nonProductPages : allMetrics;

  // ─── FAQ Detection (1.0 pts) ───
  const anyHasFaq = allMetrics.some((m) => m.hasFaq);
  if (anyHasFaq) {
    score += 1;
    strengths.push({
      category: "Content",
      title: "FAQ Section Found",
      description: "Your site has FAQ content that AI systems love to cite when answering questions.",
    });
  } else {
    recommendations.push({
      category: "Content",
      title: "Add an FAQ Section",
      description:
        "Create a dedicated FAQ section answering the top 10 questions your customers ask. Use <details>/<summary> HTML elements or FAQ Schema markup. AI systems frequently cite FAQ content.",
      why: "95% of ChatGPT citations point to pages with well-structured Q&A content.",
    });
  }

  // ─── Heading Structure (0.75 pts) ───
  // Use homepage heading structure (not inflated by product grids)
  const h1 = homeMetrics.h1Count;
  const h2 = homeMetrics.h2Count;
  const h3 = homeMetrics.h3Count;
  const hasStructuredHeadings = h1 >= 1 && h2 >= 2;

  if (hasStructuredHeadings) {
    score += 0.75;
    strengths.push({
      category: "Content",
      title: "Good Heading Structure",
      description: `Your homepage has ${h1} H1, ${h2} H2, and ${h3} H3 headings — this helps AI understand your content hierarchy.`,
    });
  } else {
    recommendations.push({
      category: "Content",
      title: "Improve Heading Hierarchy",
      description:
        "Use a clear heading structure (H1 -> H2 -> H3) to organize your content. Each heading should clearly describe the section below it.",
      why: "Clear headings help AI systems extract and cite specific sections of your content.",
    });
  }

  // ─── Content Length (0.5-1.0 pts) ───
  // Average word count across non-product pages, not site-wide total
  const avgWordCount = scoringPages.length > 0
    ? Math.round(scoringPages.reduce((sum, m) => sum + m.wordCount, 0) / scoringPages.length)
    : homeMetrics.wordCount;
  details.mainContentWordCount = avgWordCount;

  if (avgWordCount > 1500) {
    score += 1;
    strengths.push({
      category: "Content",
      title: "Comprehensive Content",
      description: `Your pages average ~${Math.round(avgWordCount / 100) * 100} words of main content, which signals depth and authority to AI systems.`,
    });
  } else if (avgWordCount > 800) {
    score += 0.5;
    strengths.push({
      category: "Content",
      title: "Good Content Length",
      description: `Your pages average ~${Math.round(avgWordCount / 100) * 100} words of main content. Expanding to 1500+ words can improve AI citation rates.`,
    });
  } else {
    recommendations.push({
      category: "Content",
      title: "Add More Quality Content",
      description:
        "Your pages need more substantial content. Focus on answering the full journey of questions a visitor might have.",
      why: "Pages with thin content rarely get cited by AI. Aim for at least 1000 words of valuable information per page.",
    });
  }

  // ─── Meta Description (0.5 pts) ───
  // Check homepage meta (not merged across pages)
  const metaDesc = page.$('meta[name="description"]').attr("content") || "";
  if (metaDesc.length > 0) {
    score += 0.5;
    const descLength = metaDesc.length;
    if (descLength >= 120 && descLength <= 160) {
      strengths.push({
        category: "Content",
        title: "Meta Description Present",
        description: `Meta description found (${descLength} chars) — well within the recommended 120-160 character range.`,
      });
    } else {
      strengths.push({
        category: "Content",
        title: "Meta Description Present",
        description: `Meta description found (${descLength} chars). ${descLength < 120 ? "Consider expanding to 120-160 chars." : "Consider trimming to under 160 chars."}`,
      });
    }
  } else {
    recommendations.push({
      category: "Content",
      title: "Add Meta Descriptions",
      description:
        "Add a clear meta description (120-160 characters) summarizing what each page covers.",
      why: "Meta descriptions help AI systems quickly understand what your page covers.",
    });
  }

  // ─── Question-Format Headings (0.5 pts) ───
  const totalQuestionHeadings = scoringPages.reduce((sum, m) => sum + m.questionHeadings, 0);
  const homeText = getFilteredMainContent(page.$);
  const hasQuestionAnswerFormat =
    totalQuestionHeadings > 0 ||
    (/what is/i.test(homeText) && /how (to|do|does)/i.test(homeText));

  if (hasQuestionAnswerFormat) {
    score += 0.5;
    strengths.push({
      category: "Content",
      title: "Question-Based Content",
      description: "Your content uses question-answer formatting that aligns with how people ask AI assistants.",
    });
  } else {
    recommendations.push({
      category: "Content",
      title: "Use Question-Format Headings",
      description:
        "Structure some headings as questions (e.g., 'What is AEO?', 'How does it work?'). This matches how people query AI.",
      why: "AI systems look for content that directly answers the questions users are asking.",
    });
  }

  // ─── Table of Contents (0.25 pts) ───
  if (allMetrics.some((m) => m.hasTableOfContents)) {
    score += 0.25;
    strengths.push({
      category: "Content",
      title: "Table of Contents",
      description: "Your site includes a table of contents, helping both readers and AI navigate your content.",
    });
  }

  // ─── Summary Snippets (0.25 pts) ───
  if (allMetrics.some((m) => m.hasSummary)) {
    score += 0.25;
    strengths.push({
      category: "Content",
      title: "Summary Sections",
      description: "Your content includes summary sections that AI can easily extract and cite.",
    });
  }

  // ─── Last Updated Date (0.25 pts) ───
  if (allMetrics.some((m) => m.hasLastUpdated)) {
    score += 0.25;
    strengths.push({
      category: "Content",
      title: "Content Freshness Signals",
      description: "Your content shows when it was last updated — AI systems prefer fresh, current content.",
    });
  } else {
    recommendations.push({
      category: "Content",
      title: "Show Last Updated Dates",
      description:
        "Add visible 'Last Updated' dates and dateModified in schema markup. AI systems heavily favor recent content.",
      why: "65% of AI citations go to content published in the last year. 76% of ChatGPT's top-cited pages were updated within the last month.",
    });
  }

  // ─── Structured Lists (0.25 pts) ───
  const avgLists = scoringPages.reduce((sum, m) => sum + m.listCount, 0) / scoringPages.length;
  if (avgLists >= 1) {
    score += 0.25;
    strengths.push({
      category: "Content",
      title: "Structured Lists",
      description: "Your content uses bullet points and/or numbered lists that AI can easily parse and cite.",
    });
  }

  // ─── Readability Score (0.5 pts) ───
  // Use homepage content for readability (not product descriptions)
  if (homeText.length > 200) {
    try {
      const fleschScore = textReadability.fleschReadingEase(homeText);
      const gradeLevel = textReadability.fleschKincaidGrade(homeText);
      details.readabilityScore = Math.round(fleschScore * 10) / 10;
      details.readabilityGrade = Math.round(gradeLevel * 10) / 10;

      if (fleschScore >= 60 && fleschScore <= 75) {
        score += 0.5;
        strengths.push({
          category: "Content",
          title: "Optimal Readability",
          description: `Flesch Reading Ease: ${Math.round(fleschScore)} (Grade ${Math.round(gradeLevel)}). This is the sweet spot for AI citation — clear, accessible writing.`,
        });
      } else if (fleschScore >= 50 && fleschScore <= 80) {
        score += 0.25;
        strengths.push({
          category: "Content",
          title: "Good Readability",
          description: `Flesch Reading Ease: ${Math.round(fleschScore)} (Grade ${Math.round(gradeLevel)}). ${fleschScore < 60 ? "Simplifying slightly could improve AI citation rates." : "Slightly more technical depth could help."}`,
        });
      } else {
        recommendations.push({
          category: "Content",
          title: "Improve Readability",
          description: `Your content has a Flesch score of ${Math.round(fleschScore)} (Grade ${Math.round(gradeLevel)}). ${
            fleschScore < 50
              ? "Consider using shorter sentences and simpler words to make content more AI-friendly."
              : "Your content may be too simple — add more depth and technical detail."
          }`,
          why: "Research shows a 31% citation lift when content falls in the Flesch 60-75 range. This is the sweet spot where AI can easily extract and quote your content.",
        });
      }
    } catch {
      // Readability calculation failed, skip
    }
  }

  // ─── Image Alt Text Coverage (0.25 pts) ───
  // Average across non-product pages
  const totalImages = scoringPages.reduce((sum, m) => sum + m.imageCount, 0);
  const totalImagesWithAlt = scoringPages.reduce((sum, m) => sum + m.imagesWithAlt, 0);

  if (totalImages > 0) {
    const altCoverage = Math.round((totalImagesWithAlt / totalImages) * 100);
    details.imageAltCoverage = altCoverage;

    if (altCoverage >= 90) {
      score += 0.25;
      strengths.push({
        category: "Content",
        title: "Image Alt Text Coverage",
        description: `${altCoverage}% of content images have alt text (${totalImagesWithAlt}/${totalImages}). This improves accessibility and helps AI understand your visual content.`,
      });
    } else {
      recommendations.push({
        category: "Content",
        title: "Add Alt Text to Images",
        description: `Only ${altCoverage}% of content images (${totalImagesWithAlt}/${totalImages}) have alt text. Add descriptive alt text to all images.`,
        why: "Alt text helps AI systems understand and contextualize your visual content, improving overall content quality signals.",
      });
    }
  }

  // ─── Internal Linking (0.25 pts) ───
  // Average per page, not total across all pages
  const avgInternalLinks = scoringPages.reduce((sum, m) => sum + m.internalLinkCount, 0) / scoringPages.length;
  details.internalLinkCount = Math.round(avgInternalLinks);

  if (avgInternalLinks >= 3) {
    score += 0.25;
    strengths.push({
      category: "Content",
      title: "Internal Linking",
      description: `Your pages average ${Math.round(avgInternalLinks)} internal links in content areas, helping AI understand your site structure.`,
    });
  } else {
    recommendations.push({
      category: "Content",
      title: "Improve Internal Linking",
      description: "Add more internal links between related content pages with descriptive anchor text.",
      why: "Internal links help AI systems discover and understand the relationship between your content.",
    });
  }

  // ─── Data/Statistics Presence (0.25 pts) ───
  // Total data points across non-product pages (product prices excluded by regex)
  const totalDataPoints = scoringPages.reduce((sum, m) => sum + m.dataPoints, 0);
  details.dataPointCount = totalDataPoints;

  if (totalDataPoints >= 3) {
    score += 0.25;
    strengths.push({
      category: "Content",
      title: "Data-Backed Content",
      description: `Your content includes ${totalDataPoints} data points/statistics. Data-rich content gets 40% more AI citations.`,
    });
  } else {
    recommendations.push({
      category: "Content",
      title: "Add Statistics and Data",
      description: "Include specific numbers, percentages, and statistics to back up your claims. Aim for 5+ data points per page.",
      why: "Pages with data points average 5.4 AI citations vs 2.8 without. Statistics make content 40% more likely to be cited.",
    });
  }

  // ─── Content Format Detection (0.25 pts) ───
  const anyHasTables = scoringPages.some((m) => m.hasTables);
  const anyHasSteps = scoringPages.some((m) => m.hasSteps);
  const anyHasComparisons = scoringPages.some((m) => m.hasComparisons);

  if (anyHasTables || anyHasSteps || anyHasComparisons) {
    score += 0.25;
    const formats = [];
    if (anyHasTables) formats.push("tables");
    if (anyHasSteps) formats.push("step-by-step guides");
    if (anyHasComparisons) formats.push("comparisons");
    strengths.push({
      category: "Content",
      title: "Structured Content Formats",
      description: `Your content uses ${formats.join(", ")} — these formats get 2.5x more AI citations than unstructured text.`,
    });
  }

  // ─── Section Density (0.25 pts) ───
  // Check homepage section density
  const homeHeadingCount = homeMetrics.h2Count + homeMetrics.h3Count;
  if (homeHeadingCount >= 3 && homeMetrics.wordCount > 300) {
    const avgWordsPerSection = Math.round(homeMetrics.wordCount / (homeHeadingCount + 1));
    details.sectionDensity = avgWordsPerSection;

    if (avgWordsPerSection >= 100 && avgWordsPerSection <= 200) {
      score += 0.25;
      strengths.push({
        category: "Content",
        title: "Optimal Section Length",
        description: `Average section length: ~${avgWordsPerSection} words. The optimal range (120-180 words) makes content easy for AI to extract.`,
      });
    }
  }

  // ─── Answer-First Formatting (0.5 pts) ───
  // Analyze on non-product pages using their individual Cheerio docs
  let totalAnswerFirst = 0;
  let totalSections = 0;

  const pagesToCheck = [
    { page, url: homeUrl || "homepage" },
    ...Array.from(additionalPages.entries())
      .filter(([url]) => {
        const metrics = additionalMetrics.find((m) => m.url === url);
        return !metrics || metrics.type !== "product";
      })
      .map(([url, p]) => ({ page: p, url })),
  ];

  for (const { page: p } of pagesToCheck) {
    const $c = getContentArea$(p.$);
    $c("h2, h3").each((_, el) => {
      totalSections++;
      const heading = $c(el);
      const nextP = heading.next("p");
      if (nextP.length > 0) {
        const firstParagraph = nextP.text().trim();
        const words = firstParagraph.split(/\s+/);
        const isAnswerFirst =
          words.length >= 5 &&
          words.length <= 120 &&
          !firstParagraph.endsWith("?") &&
          !/^(in this (section|article|guide|post))/i.test(firstParagraph) &&
          !/^(let's (talk|discuss|explore|look|dive))/i.test(firstParagraph) &&
          !/^(we('ll| will) (discuss|explore|cover|look))/i.test(firstParagraph) &&
          (/\bis\b|\bare\b|\bcan\b|\bshould\b|\bmeans?\b|\brefers?\sto\b|\binvolves?\b/i.test(
            words.slice(0, 8).join(" ")
          ) ||
            /^\d/.test(firstParagraph) ||
            /^(yes|no)\b/i.test(firstParagraph));
        if (isAnswerFirst) totalAnswerFirst++;
      }
    });
  }

  if (totalSections >= 2) {
    const answerFirstRatio = totalAnswerFirst / totalSections;
    details.answerFirstRatio = Math.round(answerFirstRatio * 100);

    if (answerFirstRatio >= 0.5) {
      score += 0.5;
      strengths.push({
        category: "Content",
        title: "Answer-First Content Structure",
        description: `${Math.round(answerFirstRatio * 100)}% of sections lead with a direct answer. AI systems strongly prefer content that gives the answer upfront.`,
      });
    } else if (answerFirstRatio >= 0.25) {
      score += 0.25;
      strengths.push({
        category: "Content",
        title: "Some Answer-First Content",
        description: `${Math.round(answerFirstRatio * 100)}% of sections lead with answers. Aim for 50%+ for better AI citation rates.`,
      });
    } else {
      recommendations.push({
        category: "Content",
        title: "Use Answer-First Formatting",
        description:
          "Start each content section with a direct, concise answer before providing context and elaboration. Lead with 'X is...' rather than 'In this section, we explore...'.",
        why: "AI models extract the first 1-2 sentences of each section. Answer-first content is 3x more likely to be quoted in AI responses.",
      });
    }
  }

  // ─── Paragraph Extractability (0.5 pts) ───
  let extractableCount = 0;
  let totalParagraphs = 0;
  const backwardRefPattern = /^(as (mentioned|noted|discussed|stated|described) (above|earlier|previously|before))|^(this (is|means|refers|shows|demonstrates|indicates))|^(the (above|aforementioned|previous|preceding))|^(these |those )|^(such |said )|^(it (is|was|has|can|should|will) )/i;

  for (const { page: p } of pagesToCheck) {
    const $c = getContentArea$(p.$);
    $c("main p, article p, [role='main'] p").each((_, el) => {
      const text = $c(el).text().trim();
      if (text.length < 30) return;
      totalParagraphs++;

      const hasBackwardRef = backwardRefPattern.test(text);
      const hasAmbiguousPronounStart = /^(he |she |they |we |it )/i.test(text) && !/^(it is |it's |it can |it should )/i.test(text);

      if (!hasBackwardRef && !hasAmbiguousPronounStart) {
        extractableCount++;
      }
    });
  }

  if (totalParagraphs >= 3) {
    const extractableRatio = extractableCount / totalParagraphs;
    details.extractableRatio = Math.round(extractableRatio * 100);

    if (extractableRatio >= 0.8) {
      score += 0.5;
      strengths.push({
        category: "Content",
        title: "Highly Extractable Content",
        description: `${Math.round(extractableRatio * 100)}% of paragraphs can be understood without surrounding context — ideal for AI citation.`,
      });
    } else if (extractableRatio >= 0.6) {
      score += 0.25;
      strengths.push({
        category: "Content",
        title: "Mostly Extractable Content",
        description: `${Math.round(extractableRatio * 100)}% of paragraphs are self-contained. Reducing backward references would improve AI citability.`,
      });
    } else {
      recommendations.push({
        category: "Content",
        title: "Make Paragraphs Self-Contained",
        description:
          "Rewrite paragraphs that start with 'As mentioned above', 'This means', 'It is' or similar backward references. Each paragraph should be understandable on its own.",
        why: "AI systems extract individual paragraphs — if yours require context from earlier in the page, they can't be cited accurately.",
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // NEW: Blog/Editorial Content Detection (0.75 pts)
  // This is the key check that was missing — sites need actual
  // editorial/blog content to score high on Content pillar
  // ═══════════════════════════════════════════════════════════════
  const hasBlogContent = editorialPages.length > 0;
  const hasBlogLink = (() => {
    // Check if homepage links to a blog section
    const blogPaths = ["/blog", "/articles", "/news", "/resources", "/learn"];
    let found = false;
    page.$("a[href]").each((_, el) => {
      const href = (page.$(el).attr("href") || "").toLowerCase();
      if (blogPaths.some((p) => href.includes(p))) {
        found = true;
        return false; // break
      }
    });
    return found;
  })();
  const hasArticleSchema = page.jsonLdBlocks.some((b) => {
    const t = b["@type"];
    const types = typeof t === "string" ? [t] : Array.isArray(t) ? t : [];
    return types.some((type) =>
      ["Article", "BlogPosting", "NewsArticle", "TechArticle"].includes(type)
    );
  });

  if (hasBlogContent || hasArticleSchema) {
    score += 0.75;
    strengths.push({
      category: "Content",
      title: "Blog/Editorial Content",
      description: `Your site has editorial content (${editorialPages.length} blog/article page${editorialPages.length !== 1 ? "s" : ""} found). AI systems heavily favor sites that publish informative articles.`,
    });
  } else if (hasBlogLink) {
    score += 0.25;
    strengths.push({
      category: "Content",
      title: "Blog Section Present",
      description: "Your site links to a blog section. Regularly publishing informative articles will significantly boost AI visibility.",
    });
  } else {
    recommendations.push({
      category: "Content",
      title: "Start a Blog or Resources Section",
      description:
        "Create a blog or resources section with informative articles about your industry. Aim for 1-2 articles per month covering questions your customers frequently ask.",
      why: "Sites with blog content are 3.5x more likely to be cited by AI systems. Editorial content signals expertise and provides the in-depth answers AI models need.",
    });
  }

  return {
    score: Math.min(score, 5),
    strengths,
    recommendations,
    details,
  };
}
