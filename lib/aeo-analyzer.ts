import { AEOScore, AEORecommendation, AEOReport, AEOStrength } from "./email-templates";

// Verification result for quality assurance
interface VerificationResult {
  isValid: boolean;
  flaggedStrengths: string[];
  adjustedScore?: number;
}

interface AnalysisResult {
  html: string;
  url: string;
  loadTime?: number;
  headers?: Record<string, string>;
}

interface ContentAnalysis {
  score: number;
  strengths: AEOStrength[];
  recommendations: AEORecommendation[];
  details: {
    hasFAQs: boolean;
    hasStructuredHeadings: boolean;
    contentLength: number;
    hasMetaDescription: boolean;
    hasQuestionAnswerFormat: boolean;
    hasTableOfContents: boolean;
    hasSummarySnippets: boolean;
    hasLastUpdatedDate: boolean;
    hasBulletPoints: boolean;
    hasNumberedLists: boolean;
  };
}

interface TechnicalAnalysis {
  score: number;
  strengths: AEOStrength[];
  recommendations: AEORecommendation[];
  details: {
    hasSchemaMarkup: boolean;
    hasFAQSchema: boolean;
    hasArticleSchema: boolean;
    hasOrganizationSchema: boolean;
    hasSitemap: boolean;
    hasRobotsTxt: boolean;
    isHttps: boolean;
    hasMobileViewport: boolean;
    hasCanonicalTag: boolean;
    hasOpenGraph: boolean;
    hasLlmsTxt: boolean;
  };
}

interface AuthorityAnalysis {
  score: number;
  strengths: AEOStrength[];
  recommendations: AEORecommendation[];
  details: {
    hasAuthorInfo: boolean;
    hasAboutPage: boolean;
    hasContactInfo: boolean;
    hasSocialLinks: boolean;
    hasCredentials: boolean;
    hasCitations: boolean;
    hasTestimonials: boolean;
    hasCaseStudies: boolean;
    hasReviews: boolean;
  };
}

interface MeasurementAnalysis {
  score: number;
  strengths: AEOStrength[];
  recommendations: AEORecommendation[];
  details: {
    hasAnalytics: boolean;
    hasStructuredData: boolean;
    hasConversionTracking: boolean;
  };
}

// Normalize URL for consistent analysis
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Always use https
    parsed.protocol = "https:";
    // Remove trailing slash
    let pathname = parsed.pathname;
    if (pathname.endsWith("/") && pathname !== "/") {
      pathname = pathname.slice(0, -1);
    }
    parsed.pathname = pathname;
    // Remove common tracking parameters
    parsed.searchParams.delete("utm_source");
    parsed.searchParams.delete("utm_medium");
    parsed.searchParams.delete("utm_campaign");
    parsed.searchParams.delete("utm_content");
    parsed.searchParams.delete("ref");
    return parsed.toString();
  } catch {
    return url;
  }
}

async function fetchWebsite(url: string): Promise<AnalysisResult> {
  const startTime = Date.now();
  const normalizedUrl = normalizeUrl(url);

  try {
    // Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(normalizedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; UpClickLabs-AEO-Analyzer/1.0; +https://upclicklabs.com)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Cache-Control": "no-cache",
      },
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const html = await response.text();
    const loadTime = Date.now() - startTime;

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    console.log(`Fetched ${normalizedUrl} in ${loadTime}ms (${html.length} bytes)`);

    return { html, url: response.url, loadTime, headers };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timeout after 30 seconds`);
    }
    throw new Error(`Failed to fetch website: ${error}`);
  }
}

// Extract internal links from HTML for multi-page crawling
function extractInternalLinks(html: string, baseUrl: string): string[] {
  const baseHostname = new URL(baseUrl).hostname;
  const links: Set<string> = new Set();

  // Priority pages to look for (AEO-relevant)
  const priorityPaths = [
    "/about", "/about-us", "/company",
    "/blog", "/articles", "/news", "/resources",
    "/faq", "/faqs", "/help", "/support",
    "/contact", "/contact-us",
    "/services", "/solutions", "/products",
    "/team", "/leadership", "/our-team",
    "/case-studies", "/customers", "/testimonials",
    "/pricing",
  ];

  // Extract all href links
  const hrefRegex = /href=["']([^"']+)["']/gi;
  let match;
  while ((match = hrefRegex.exec(html)) !== null) {
    try {
      const href = match[1];
      // Skip anchors, javascript, mailto, tel
      if (href.startsWith("#") || href.startsWith("javascript:") ||
          href.startsWith("mailto:") || href.startsWith("tel:")) {
        continue;
      }

      // Convert to absolute URL
      const absoluteUrl = new URL(href, baseUrl);

      // Only include internal links
      if (absoluteUrl.hostname === baseHostname) {
        const path = absoluteUrl.pathname.toLowerCase();

        // Check if it's a priority page
        if (priorityPaths.some(p => path.includes(p))) {
          links.add(absoluteUrl.origin + absoluteUrl.pathname);
        }
      }
    } catch {
      // Invalid URL, skip
    }
  }

  // Sort by priority (about/faq/blog first)
  const sortedLinks = Array.from(links).sort((a, b) => {
    const aPath = new URL(a).pathname.toLowerCase();
    const bPath = new URL(b).pathname.toLowerCase();
    const getPriority = (path: string) => {
      if (path.includes("faq")) return 0;
      if (path.includes("about")) return 1;
      if (path.includes("blog")) return 2;
      if (path.includes("service")) return 3;
      return 10;
    };
    return getPriority(aPath) - getPriority(bPath);
  });

  // Return top 5 links
  return sortedLinks.slice(0, 5);
}

// Fetch multiple pages in parallel
async function fetchMultiplePages(urls: string[]): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  const fetchPromises = urls.map(async (url) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout per page

      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; UpClickLabs-AEO-Analyzer/1.0; +https://upclicklabs.com)",
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.5",
        },
        redirect: "follow",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const html = await response.text();
        results.set(url, html);
        console.log(`Crawled additional page: ${url} (${html.length} bytes)`);
      }
    } catch (error) {
      console.log(`Failed to crawl ${url}: ${error}`);
      // Silently ignore failed pages
    }
  });

  await Promise.all(fetchPromises);
  return results;
}

function analyzeContent(html: string): ContentAnalysis {
  const strengths: AEOStrength[] = [];
  const recommendations: AEORecommendation[] = [];
  let score = 0;

  const htmlLower = html.toLowerCase();

  // Check for FAQs
  const hasFAQs =
    htmlLower.includes("faq") ||
    html.includes("frequently asked") ||
    html.includes('itemtype="https://schema.org/FAQPage"') ||
    html.includes('"@type":"FAQPage"');

  if (hasFAQs) {
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
        "Create a dedicated FAQ section answering the top 10 questions your customers ask. AI systems frequently cite FAQ content when users ask related questions. Structure each Q&A clearly with the question as a heading.",
      why: "95% of ChatGPT citations point to pages with well-structured Q&A content.",
    });
  }

  // Check for structured headings (H1, H2, H3)
  const h1Count = (html.match(/<h1/gi) || []).length;
  const h2Count = (html.match(/<h2/gi) || []).length;
  const h3Count = (html.match(/<h3/gi) || []).length;
  const hasStructuredHeadings = h1Count >= 1 && h2Count >= 2;

  if (hasStructuredHeadings) {
    score += 0.75;
    strengths.push({
      category: "Content",
      title: "Good Heading Structure",
      description: `Your page has ${h1Count} H1, ${h2Count} H2, and ${h3Count} H3 headings - this helps AI understand your content hierarchy.`,
    });
  } else {
    recommendations.push({
      category: "Content",
      title: "Improve Heading Hierarchy",
      description:
        "Use a clear heading structure (H1 → H2 → H3) to organize your content. Each heading should clearly describe the section below it. Try using question-format headings like 'What is...?' or 'How do I...?'",
      why: "Clear headings help AI systems extract and cite specific sections of your content.",
    });
  }

  // Check content length
  const textContent = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
  const wordCount = textContent.split(" ").filter((w) => w.length > 3).length;
  const contentLength = wordCount;

  if (contentLength > 1500) {
    score += 1;
    strengths.push({
      category: "Content",
      title: "Comprehensive Content",
      description: `Your page has substantial content (~${Math.round(contentLength / 100) * 100} words) which signals depth and authority to AI systems.`,
    });
  } else if (contentLength > 800) {
    score += 0.5;
    strengths.push({
      category: "Content",
      title: "Good Content Length",
      description: `Your page has a decent amount of content (~${Math.round(contentLength / 100) * 100} words).`,
    });
    recommendations.push({
      category: "Content",
      title: "Expand Content Depth",
      description:
        "Consider adding more comprehensive content to fully cover your topic. Aim for 1500+ words of valuable information that thoroughly answers related questions.",
      why: "Longer, in-depth content tends to get cited more by AI because it provides complete answers.",
    });
  } else {
    recommendations.push({
      category: "Content",
      title: "Add More Quality Content",
      description:
        "Your pages need more substantial content. AI systems need comprehensive information to cite. Focus on answering the full journey of questions a visitor might have about your topic.",
      why: "Pages with thin content rarely get cited by AI systems. Aim for at least 1000 words of valuable information.",
    });
  }

  // Check for meta description
  const hasMetaDescription =
    html.includes('name="description"') || html.includes("name='description'");

  if (hasMetaDescription) {
    score += 0.5;
    strengths.push({
      category: "Content",
      title: "Meta Description Present",
      description: "Your pages have meta descriptions that help AI understand your content context.",
    });
  } else {
    recommendations.push({
      category: "Content",
      title: "Add Meta Descriptions",
      description:
        "Add a clear, concise meta description (150-160 characters) to every page. This should summarize what the page is about and include your main topic.",
      why: "Meta descriptions help AI systems quickly understand what your page covers.",
    });
  }

  // Check for Q&A format (questions in headings)
  const questionHeadings = (html.match(/\?<\/h[1-6]>/gi) || []).length;
  const hasQuestionAnswerFormat = questionHeadings > 0 ||
    (htmlLower.includes("what is") && htmlLower.includes("how to"));

  if (hasQuestionAnswerFormat) {
    score += 0.75;
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
        "Structure some headings as questions (e.g., 'What is AEO?', 'How does it work?'). This matches how people query AI assistants and makes your content more likely to be cited.",
      why: "AI systems look for content that directly answers the questions users are asking.",
    });
  }

  // Check for table of contents (stricter detection)
  const hasTableOfContents =
    htmlLower.includes("table of contents") ||
    htmlLower.includes("tableofcontents") ||
    // Look for TOC patterns that are clearly navigational
    (htmlLower.includes('id="toc"') || htmlLower.includes("class=\"toc\"") || htmlLower.includes("class='toc'")) ||
    // Common TOC heading patterns
    /<h[2-4][^>]*>.*?(table of contents|contents|in this article).*?<\/h[2-4]>/i.test(html) ||
    // Skip link pattern (accessibility feature often paired with TOC)
    (htmlLower.includes("skip to") && htmlLower.includes("content")) ||
    // Jump links within same page (multiple anchor links in nav-like structure)
    (html.match(/<a[^>]+href="#[^"]+"/gi) || []).length >= 4;

  if (hasTableOfContents) {
    score += 0.25;
    strengths.push({
      category: "Content",
      title: "Table of Contents",
      description: "Your page includes a table of contents, helping both readers and AI navigate your content.",
    });
  }

  // Check for summary snippets
  const hasSummarySnippets =
    htmlLower.includes("in summary") ||
    htmlLower.includes("key takeaway") ||
    htmlLower.includes("tldr") ||
    htmlLower.includes("tl;dr") ||
    htmlLower.includes("bottom line");

  if (hasSummarySnippets) {
    score += 0.25;
    strengths.push({
      category: "Content",
      title: "Summary Sections",
      description: "Your content includes summary sections that AI can easily extract and cite.",
    });
  }

  // Check for last updated date
  const hasLastUpdatedDate =
    htmlLower.includes("last updated") ||
    htmlLower.includes("updated on") ||
    htmlLower.includes("modified") ||
    html.includes("dateModified");

  if (hasLastUpdatedDate) {
    score += 0.25;
    strengths.push({
      category: "Content",
      title: "Content Freshness Signals",
      description: "Your content shows when it was last updated - AI systems prefer fresh, current content.",
    });
  } else {
    recommendations.push({
      category: "Content",
      title: "Show Last Updated Dates",
      description:
        "Add visible 'Last Updated' dates to your content pages. This signals freshness to AI systems and builds trust with readers.",
      why: "95% of ChatGPT citations point to pages updated in the last 10 months.",
    });
  }

  // Check for bullet points and numbered lists
  const hasBulletPoints = (html.match(/<ul/gi) || []).length > 0;
  const hasNumberedLists = (html.match(/<ol/gi) || []).length > 0;

  if (hasBulletPoints || hasNumberedLists) {
    score += 0.25;
    strengths.push({
      category: "Content",
      title: "Structured Lists",
      description: "Your content uses bullet points and/or numbered lists that AI can easily parse and cite.",
    });
  }

  return {
    score: Math.min(score, 5),
    strengths,
    recommendations,
    details: {
      hasFAQs,
      hasStructuredHeadings,
      contentLength,
      hasMetaDescription,
      hasQuestionAnswerFormat,
      hasTableOfContents,
      hasSummarySnippets,
      hasLastUpdatedDate,
      hasBulletPoints,
      hasNumberedLists,
    },
  };
}

function analyzeTechnical(
  html: string,
  url: string,
  headers?: Record<string, string>
): TechnicalAnalysis {
  const strengths: AEOStrength[] = [];
  const recommendations: AEORecommendation[] = [];
  let score = 0;

  const htmlLower = html.toLowerCase();

  // Check for Schema.org markup
  const hasSchemaMarkup =
    html.includes("schema.org") ||
    html.includes("application/ld+json") ||
    html.includes("itemtype=");

  // Check specific schema types
  const hasFAQSchema = html.includes('"@type":"FAQPage"') || html.includes('"@type": "FAQPage"');
  const hasArticleSchema = html.includes('"@type":"Article"') || html.includes('"@type": "Article"') ||
    html.includes('"@type":"BlogPosting"') || html.includes('"@type": "BlogPosting"');
  const hasOrganizationSchema = html.includes('"@type":"Organization"') || html.includes('"@type": "Organization"');

  if (hasSchemaMarkup) {
    score += 1;
    const schemaTypes = [];
    if (hasFAQSchema) schemaTypes.push("FAQ");
    if (hasArticleSchema) schemaTypes.push("Article");
    if (hasOrganizationSchema) schemaTypes.push("Organization");

    strengths.push({
      category: "Technical",
      title: "Schema Markup Implemented",
      description: schemaTypes.length > 0
        ? `Your site uses structured data (${schemaTypes.join(", ")}) that helps AI understand your content.`
        : "Your site uses structured data that helps AI understand your content.",
    });

    if (!hasFAQSchema && !hasArticleSchema) {
      recommendations.push({
        category: "Technical",
        title: "Add More Schema Types",
        description:
          "Consider adding FAQ Schema to Q&A content and Article Schema to blog posts. This helps AI systems understand what type of content each page contains.",
        why: "73% of page-one results use schema markup, but 88% of sites don't use it at all.",
      });
    }
  } else {
    recommendations.push({
      category: "Technical",
      title: "Implement Schema Markup",
      description:
        "Add Schema.org structured data to your pages using JSON-LD format. Start with Organization schema on your homepage, FAQ schema for Q&A content, and Article schema for blog posts.",
      why: "Schema markup helps AI systems understand your content type and relationships. Sites with schema are significantly more likely to be cited.",
    });
  }

  // Check HTTPS
  const isHttps = url.startsWith("https://");

  if (isHttps) {
    score += 0.75;
    strengths.push({
      category: "Technical",
      title: "Secure HTTPS Connection",
      description: "Your site uses HTTPS, which is essential for trust with both users and AI systems.",
    });
  } else {
    recommendations.push({
      category: "Technical",
      title: "Enable HTTPS",
      description:
        "Your site is not using HTTPS. Secure your site with an SSL certificate immediately. This is a basic requirement for any trustworthy website.",
      why: "AI systems prioritize secure, trustworthy sources. HTTP sites may be skipped entirely.",
    });
  }

  // Check mobile viewport
  const hasMobileViewport =
    html.includes('name="viewport"') || html.includes("name='viewport'");

  if (hasMobileViewport) {
    score += 0.5;
    strengths.push({
      category: "Technical",
      title: "Mobile-Responsive",
      description: "Your site is configured for mobile devices, which is important for accessibility.",
    });
  } else {
    recommendations.push({
      category: "Technical",
      title: "Add Mobile Viewport",
      description:
        "Add a mobile viewport meta tag to ensure your site displays correctly on all devices. Mobile-friendliness is a trust signal.",
      why: "AI systems favor accessible sites that work well for all users.",
    });
  }

  // Check for sitemap reference
  const hasSitemap =
    htmlLower.includes("sitemap") || (headers?.["x-robots-tag"]?.includes("sitemap") ?? false);

  if (hasSitemap) {
    score += 0.5;
    strengths.push({
      category: "Technical",
      title: "Sitemap Referenced",
      description: "Your site references a sitemap, helping AI crawlers discover all your content.",
    });
  } else {
    recommendations.push({
      category: "Technical",
      title: "Create XML Sitemap",
      description:
        "Create an XML sitemap at /sitemap.xml and reference it in your robots.txt. Include last modified dates for each page to help crawlers prioritize fresh content.",
      why: "Sitemaps help AI crawlers efficiently discover and prioritize your content.",
    });
  }

  // Check for robots meta
  const hasRobotsTxt =
    html.includes('name="robots"') || html.includes("name='robots'");
  if (hasRobotsTxt) {
    score += 0.25;
  }

  // Check for canonical tag
  const hasCanonicalTag = html.includes('rel="canonical"') || html.includes("rel='canonical'");
  if (hasCanonicalTag) {
    score += 0.25;
    strengths.push({
      category: "Technical",
      title: "Canonical Tags",
      description: "Your site uses canonical tags to prevent duplicate content issues.",
    });
  }

  // Check for Open Graph tags
  const hasOpenGraph = html.includes('property="og:') || html.includes("property='og:");
  if (hasOpenGraph) {
    score += 0.25;
    strengths.push({
      category: "Technical",
      title: "Open Graph Tags",
      description: "Your site has Open Graph tags for rich social sharing and content metadata.",
    });
  }

  // Check for llms.txt (emerging standard)
  const hasLlmsTxt = htmlLower.includes("llms.txt");
  if (hasLlmsTxt) {
    score += 0.5;
    strengths.push({
      category: "Technical",
      title: "LLMs.txt File",
      description: "Your site has an llms.txt file - this emerging standard helps AI systems understand your site.",
    });
  } else {
    recommendations.push({
      category: "Technical",
      title: "Consider Adding llms.txt",
      description:
        "Create an llms.txt file at your site root. This emerging standard provides AI systems with a summary of your site, services, and key content - like a robots.txt for LLMs.",
      why: "Early adopters of llms.txt gain an advantage as AI systems begin to recognize this standard.",
    });
  }

  return {
    score: Math.min(score, 5),
    strengths,
    recommendations,
    details: {
      hasSchemaMarkup,
      hasFAQSchema,
      hasArticleSchema,
      hasOrganizationSchema,
      hasSitemap,
      hasRobotsTxt,
      isHttps,
      hasMobileViewport,
      hasCanonicalTag,
      hasOpenGraph,
      hasLlmsTxt,
    },
  };
}

function analyzeAuthority(html: string): AuthorityAnalysis {
  const strengths: AEOStrength[] = [];
  const recommendations: AEORecommendation[] = [];
  let score = 0;

  const htmlLower = html.toLowerCase();

  // ============================================================================
  // AUTHORITY SCORING - Based on Webflow AEO Maturity Model
  // Key principle: Authority is built through E-E-A-T signals AND external
  // validation (third-party citations, digital PR, press mentions).
  // ============================================================================

  // === E-E-A-T SIGNALS (Experience, Expertise, Authoritativeness, Trust) ===

  // Check for author information (stricter detection)
  const hasAuthorSchema = /"author"\s*:\s*\{|"author"\s*:\s*\[/i.test(html);
  const hasAuthorMeta = /<meta[^>]+name=["']author["']/i.test(html);
  const hasAuthorByline = /written by\s+[A-Z]|by\s+[A-Z][a-z]+\s+[A-Z]|author:\s*[A-Z]/i.test(html);
  const hasAuthorRel = /rel=["']author["']/i.test(html);
  const hasAuthorInfo = hasAuthorSchema || hasAuthorMeta || hasAuthorByline || hasAuthorRel;

  if (hasAuthorInfo) {
    score += 0.5;
    strengths.push({
      category: "Authority",
      title: "Author Attribution",
      description: "Your content includes author information, which builds E-E-A-T (Experience, Expertise, Authority, Trust).",
    });
  } else {
    recommendations.push({
      category: "Authority",
      title: "Add Author Information",
      description:
        "Include author names and bios on your content. Show their credentials, experience, and expertise. Add Author schema markup for better AI recognition.",
      why: "E-E-A-T signals help AI systems evaluate content quality. Content with clear author attribution is more trusted.",
    });
  }

  // Check for about page reference
  const hasAboutLink = /href=["'][^"']*\/about[^"']*["']/i.test(html);
  const hasAboutContent = /about us|our story|our team|who we are|our mission/i.test(html);
  const hasAboutPage = hasAboutLink || hasAboutContent;

  if (hasAboutPage) {
    score += 0.4;
    strengths.push({
      category: "Authority",
      title: "About Page Present",
      description: "Your site has an About page that establishes company credibility.",
    });
  } else {
    recommendations.push({
      category: "Authority",
      title: "Create Comprehensive About Page",
      description:
        "Create a detailed About page explaining who you are, your team's expertise, company history, and qualifications to speak on your topics.",
      why: "AI systems look for signals that content comes from legitimate, expert sources.",
    });
  }

  // Check for contact information (stricter - actual contact details)
  const hasContactLink = /href=["'][^"']*\/contact[^"']*["']/i.test(html);
  const hasEmail = /mailto:|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(html);
  const hasPhone = /tel:|(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/i.test(html);
  const hasContactInfo = hasContactLink || hasEmail || hasPhone;

  if (hasContactInfo) {
    score += 0.35;
    strengths.push({
      category: "Authority",
      title: "Contact Information",
      description: "Your site displays contact information, building trust and legitimacy.",
    });
  } else {
    recommendations.push({
      category: "Authority",
      title: "Display Contact Information",
      description:
        "Make your contact information easily accessible - email, phone, and/or contact form. This signals you're a real, legitimate business.",
      why: "Legitimate businesses have clear ways to contact them. This is a basic trust signal.",
    });
  }

  // === DIGITAL PR & THOUGHT LEADERSHIP (From PDF: Level 3+) ===

  // Check for press/media mentions ("As seen in", media logos)
  const hasPressSection =
    /as (seen|featured) (in|on)|press|media|featured in|in the news|news coverage/i.test(html);
  const hasMediaLogos =
    /forbes|techcrunch|wired|entrepreneur|inc\.com|business insider|wall street journal|new york times|washington post|bloomberg|cnbc|bbc/i.test(htmlLower);

  if (hasPressSection || hasMediaLogos) {
    score += 0.6;
    strengths.push({
      category: "Authority",
      title: "Press/Media Mentions",
      description: "Your site showcases press or media coverage, demonstrating external validation and authority.",
    });
  } else {
    recommendations.push({
      category: "Authority",
      title: "Pursue Press Coverage",
      description:
        "Seek media coverage and create an 'As Seen In' section on your site. Pitch to industry publications, podcasts, and news outlets relevant to your niche.",
      why: "Third-party media mentions are strong authority signals. AI systems prioritize sources that are cited by trusted publications.",
    });
  }

  // Check for digital PR content (podcasts, webinars, speaking)
  const hasDigitalPR =
    /podcast|webinar|speaking|keynote|conference|summit|appeared on|guest (on|post|author)|featured (guest|speaker)|interview/i.test(html);

  if (hasDigitalPR) {
    score += 0.5;
    strengths.push({
      category: "Authority",
      title: "Digital PR Presence",
      description: "Your site shows evidence of podcasts, webinars, or speaking engagements - key digital PR signals.",
    });
  } else {
    recommendations.push({
      category: "Authority",
      title: "Build Digital PR Presence",
      description:
        "Appear on podcasts, host webinars, speak at conferences, and write guest posts. Document these appearances on your site to build thought leadership.",
      why: "Active digital PR presence signals to AI that you're a recognized voice in your industry.",
    });
  }

  // Check for community engagement (Reddit, Quora, forums)
  const hasCommunityPresence =
    /reddit\.com|quora\.com|community|forum|discuss|stackoverflow/i.test(html);

  if (hasCommunityPresence) {
    score += 0.25;
    strengths.push({
      category: "Authority",
      title: "Community Engagement",
      description: "Your site references community platforms where you engage with your audience.",
    });
  } else {
    recommendations.push({
      category: "Authority",
      title: "Engage on Community Platforms",
      description:
        "Build presence on Reddit (relevant subreddits), Quora, and industry forums. Answer questions and provide value. AI often pulls from these platforms.",
      why: "AI systems like Perplexity frequently cite Reddit and Quora discussions. Being active there increases your chances of being mentioned.",
    });
  }

  // === SOCIAL PROOF & CREDIBILITY ===

  // Check for social links (stricter)
  const socialPatterns = /twitter\.com\/|x\.com\/|linkedin\.com\/|facebook\.com\/|instagram\.com\/|youtube\.com\//i;
  const hasSocialLinks = socialPatterns.test(html);

  if (hasSocialLinks) {
    score += 0.25;
    strengths.push({
      category: "Authority",
      title: "Social Media Presence",
      description: "Your site links to social media profiles, extending your brand presence across platforms.",
    });
  } else {
    recommendations.push({
      category: "Authority",
      title: "Add Social Media Links",
      description:
        "Link to your active social media profiles (LinkedIn, Twitter/X, YouTube). Be active and engage with your audience on these platforms.",
      why: "AI systems aggregate information from across the web. Social presence contributes to overall authority.",
    });
  }

  // Check for credentials/qualifications
  const hasCredentials =
    /certified|certification|credential|accredited|licensed|qualification|award-winning|years of experience|\d+\+?\s*years/i.test(html);

  if (hasCredentials) {
    score += 0.25;
    strengths.push({
      category: "Authority",
      title: "Credentials Displayed",
      description: "Your site showcases credentials, certifications, or years of experience that establish expertise.",
    });
  }

  // Check for citations/sources in your content
  const hasCitationsInContent =
    /source:|according to|research (shows|indicates|suggests|from)|study (shows|found|by)|data from|cited|reference|published in/i.test(html);
  const hasExternalResearchLinks = (html.match(/<a[^>]+href=["']https?:\/\/(?!(?:www\.)?(?:twitter|facebook|linkedin|youtube|instagram|x\.com))[^"']+["'][^>]*>[^<]*(?:source|study|research|report)/gi) || []).length >= 1;

  if (hasCitationsInContent || hasExternalResearchLinks) {
    score += 0.4;
    strengths.push({
      category: "Authority",
      title: "Content Citations",
      description: "Your content cites external sources and research, demonstrating credibility.",
    });
  } else {
    recommendations.push({
      category: "Authority",
      title: "Cite Authoritative Sources",
      description:
        "When making claims, cite reputable sources. Link to research, studies, and authoritative publications. This demonstrates your content is well-researched.",
      why: "Content that cites credible sources is more likely to be trusted and cited by AI systems.",
    });
  }

  // Check for reviews (stricter detection)
  const hasReviewSchema = /"@type"\s*:\s*"Review"|"aggregateRating"/i.test(html);
  const hasStarRating = /★|(\d+(\.\d+)?)\s*(out of|\/)\s*5\s*(star)?s?/i.test(html);
  const hasReviewPlatform = /trustpilot|g2\.com|g2crowd|capterra|google.*review/i.test(htmlLower);
  const hasReviews = hasReviewSchema || hasStarRating || hasReviewPlatform;

  if (hasReviews) {
    score += 0.5;
    strengths.push({
      category: "Authority",
      title: "Reviews Present",
      description: "Your site displays reviews or ratings, providing strong social proof that AI systems recognize.",
    });
  } else {
    recommendations.push({
      category: "Authority",
      title: "Add Customer Reviews",
      description:
        "Display customer reviews, ratings, or link to review platforms (Google Reviews, Trustpilot, G2). Add Review schema markup for better visibility.",
      why: "Reviews are a powerful trust signal. AI systems often cite businesses with verified customer feedback.",
    });
  }

  // Check for testimonials (stricter detection)
  const hasTestimonialSection = /<(section|div)[^>]*class[^>]*testimonial/i.test(html);
  const hasTestimonialHeading = /<h[1-4][^>]*>.*?testimonial.*?<\/h[1-4]>/i.test(html);
  const hasQuotedContent = (html.match(/<blockquote/gi) || []).length >= 1;
  const hasClientSays = /what (our|the) (client|customer)s? say|client feedback|customer stories/i.test(html);
  const hasTestimonials = hasTestimonialSection || hasTestimonialHeading || hasQuotedContent || hasClientSays;

  if (hasTestimonials) {
    score += 0.5;
    strengths.push({
      category: "Authority",
      title: "Testimonials Present",
      description: "Your site includes testimonials that provide social proof and build trust.",
    });
  } else {
    recommendations.push({
      category: "Authority",
      title: "Add Customer Testimonials",
      description:
        "Feature testimonials from satisfied customers with their names, titles, and companies. Video testimonials are even more powerful.",
      why: "Testimonials demonstrate real-world success and help AI systems understand your reputation.",
    });
  }

  // Check for case studies
  const hasCaseStudyHeading = /<h[1-4][^>]*>.*?case.stud/i.test(html);
  const hasCaseStudyLink = /<a[^>]+href[^>]*case-stud|href[^>]*case_stud|>case stud/i.test(html);
  const hasSuccessStory = /success stor(y|ies)|client results|how we helped|results we.ve delivered/i.test(html);
  const hasCaseStudies = hasCaseStudyHeading || hasCaseStudyLink || hasSuccessStory;

  if (hasCaseStudies) {
    score += 0.5;
    strengths.push({
      category: "Authority",
      title: "Case Studies/Results",
      description: "Your site features case studies or results, demonstrating real-world expertise and outcomes.",
    });
  } else {
    recommendations.push({
      category: "Authority",
      title: "Create Case Studies",
      description:
        "Document client success stories with specific metrics and outcomes. Include the challenge, solution, and measurable results.",
      why: "Case studies with data prove your expertise. AI systems prioritize content backed by real results.",
    });
  }

  // === ADVANCED AUTHORITY (PDF Level 4-5) ===

  // Note: Wikipedia presence and Google Knowledge Panel cannot be detected from page HTML
  // Always recommend these as they're critical for highest authority levels
  recommendations.push({
    category: "Authority",
    title: "Build Wikipedia Presence",
    description:
      "Work toward getting a Wikipedia page or being cited on relevant Wikipedia articles. This requires meeting notability guidelines through sustained media coverage.",
    why: "Wikipedia is one of the most frequently cited sources by AI. Being mentioned there significantly boosts your AI visibility.",
  });

  return {
    score: Math.min(score, 5),
    strengths,
    recommendations,
    details: {
      hasAuthorInfo,
      hasAboutPage,
      hasContactInfo,
      hasSocialLinks,
      hasCredentials,
      hasCitations: hasCitationsInContent || hasExternalResearchLinks,
      hasTestimonials,
      hasCaseStudies,
      hasReviews,
    },
  };
}

function analyzeMeasurement(html: string): MeasurementAnalysis {
  const strengths: AEOStrength[] = [];
  const recommendations: AEORecommendation[] = [];
  let score = 0;

  const htmlLower = html.toLowerCase();

  // ============================================================================
  // MEASUREMENT SCORING - Based on Webflow AEO Maturity Model
  // IMPORTANT: We can ONLY detect what's visible in HTML. Most measurement tools
  // are configured externally (analytics dashboards, brand monitoring platforms).
  // We score conservatively - only what we can definitively detect.
  // ============================================================================

  // LEVEL 1: Basic Analytics (1 point max)
  // Check for actual analytics SCRIPTS, not just mentions of analytics
  const hasGoogleAnalyticsScript =
    /<script[^>]*google-analytics[^>]*>/i.test(html) ||
    /<script[^>]*gtag[^>]*>/i.test(html) ||
    /<script[^>]*googletagmanager[^>]*>/i.test(html) ||
    /gtag\s*\(\s*['"]config['"]/i.test(html) ||
    /GoogleAnalyticsObject/i.test(html) ||
    /_gaq\.push/i.test(html);

  const hasOtherAnalyticsScript =
    /<script[^>]*plausible[^>]*>/i.test(html) ||
    /data-domain=.*plausible/i.test(html) ||
    /<script[^>]*fathom[^>]*>/i.test(html) ||
    /<script[^>]*segment[^>]*>/i.test(html) ||
    /analytics\.load/i.test(html) ||
    /<script[^>]*mixpanel[^>]*>/i.test(html) ||
    /mixpanel\.init/i.test(html) ||
    /<script[^>]*amplitude[^>]*>/i.test(html) ||
    /amplitude\.getInstance/i.test(html) ||
    /<script[^>]*heap[^>]*>/i.test(html) ||
    /heap\.load/i.test(html);

  const hasBasicAnalytics = hasGoogleAnalyticsScript || hasOtherAnalyticsScript;

  if (hasBasicAnalytics) {
    score += 1;
    strengths.push({
      category: "Measurement",
      title: "Analytics Tracking Installed",
      description: "Your site has analytics tracking scripts installed for measuring traffic.",
    });
  } else {
    recommendations.push({
      category: "Measurement",
      title: "Install Analytics Tracking",
      description:
        "Add analytics tracking (Google Analytics 4, Plausible, etc.) to measure your traffic. This is the foundation for any AEO measurement strategy.",
      why: "You can't improve what you can't measure. Analytics are essential for tracking which content drives AI-referred traffic.",
    });
  }

  // LEVEL 2: Event/Conversion Tracking (0.5 points)
  // Check for actual event tracking CODE, not just words like "conversion"
  const hasEventTrackingCode =
    /gtag\s*\(\s*['"]event['"]/i.test(html) ||
    /ga\s*\(\s*['"]send['"]\s*,\s*['"]event['"]/i.test(html) ||
    /fbq\s*\(\s*['"]track['"]/i.test(html) ||
    /analytics\.track\s*\(/i.test(html) ||
    /mixpanel\.track\s*\(/i.test(html) ||
    /amplitude\.logEvent\s*\(/i.test(html) ||
    /heap\.track\s*\(/i.test(html) ||
    /plausible\s*\(\s*['"]/i.test(html) ||
    /dataLayer\.push\s*\(\s*\{[^}]*['"]event['"]/i.test(html);

  if (hasEventTrackingCode) {
    score += 0.5;
    strengths.push({
      category: "Measurement",
      title: "Event Tracking Configured",
      description: "Your site has event tracking code for measuring user interactions and conversions.",
    });
  } else {
    recommendations.push({
      category: "Measurement",
      title: "Set Up Event Tracking",
      description:
        "Configure event tracking for key actions (form submissions, button clicks, downloads). Use gtag('event', ...) or your analytics platform's event API.",
      why: "Event tracking lets you measure which AI-referred visitors take valuable actions on your site.",
    });
  }

  // LEVEL 3-5: Advanced Measurement (Cannot be detected from HTML alone)
  // These are ALWAYS recommendations because we cannot verify their implementation
  // from page HTML - they require access to analytics dashboards/external tools

  // Always recommend LLM Traffic Tracking (Level 3)
  recommendations.push({
    category: "Measurement",
    title: "Track AI Platform Traffic",
    description:
      "Set up referrer tracking to identify visitors from AI platforms (chatgpt.com, perplexity.ai, claude.ai). Create custom segments or regex filters in your analytics for AI referrers.",
    why: "AI referral traffic has different intent and behavior. Understanding which AI platforms send traffic helps prioritize optimization.",
  });

  // Always recommend Brand Monitoring (Level 4)
  recommendations.push({
    category: "Measurement",
    title: "Monitor AI Mentions",
    description:
      "Use tools like Mention, Brand24, or specialized AEO platforms to track how your brand is mentioned in AI responses. Monitor for accuracy and sentiment.",
    why: "Knowing what AI says about your brand helps you correct misinformation and optimize content for better citations.",
  });

  // Always recommend Share of Voice Tracking (Level 4-5)
  recommendations.push({
    category: "Measurement",
    title: "Track Share of Voice",
    description:
      "Measure your brand's visibility relative to competitors in AI responses. Tools like Profound, Otterly, or manual prompt testing can help establish baseline metrics.",
    why: "Share of voice tracking shows whether your AEO efforts are working and where you stand against competitors.",
  });

  // Determine appropriate recommendations based on score
  const hasAnalytics = hasBasicAnalytics;
  const hasStructuredData = html.includes("application/ld+json") || html.includes("itemscope");
  const hasConversionTracking = hasEventTrackingCode;

  // NOTE: Maximum realistic score from HTML detection is 1.5 (analytics + events)
  // Most sites will score 0-1.5 on Measurement because advanced features
  // (LLM tracking, brand monitoring, share of voice) require external tools
  // that we cannot detect from the page HTML alone.

  return {
    score: Math.min(score, 5),
    strengths,
    recommendations,
    details: {
      hasAnalytics,
      hasStructuredData,
      hasConversionTracking,
    },
  };
}

// Comprehensive verification function to double-check ALL assessment findings
function verifyAssessment(
  html: string,
  strengths: AEOStrength[],
  contentDetails: ContentAnalysis["details"],
  technicalDetails: TechnicalAnalysis["details"],
  authorityDetails: AuthorityAnalysis["details"]
): { verifiedStrengths: AEOStrength[]; removedStrengths: string[] } {
  const verifiedStrengths: AEOStrength[] = [];
  const removedStrengths: string[] = [];
  const htmlLower = html.toLowerCase();

  for (const strength of strengths) {
    let isVerified = true;

    // ============ CONTENT PILLAR VERIFICATION ============

    // Verify FAQ Section claim
    if (strength.title === "FAQ Section Found") {
      const hasFaqSchema = html.includes('"@type":"FAQPage"') || html.includes('"@type": "FAQPage"');
      const hasFaqHeading = /<h[1-4][^>]*>.*?(faq|frequently asked|common questions).*?<\/h[1-4]>/i.test(html);
      const hasQuestionMarksInHeadings = (html.match(/\?<\/h[1-6]>/gi) || []).length >= 2;
      isVerified = hasFaqSchema || hasFaqHeading || hasQuestionMarksInHeadings;
    }

    // Verify Good Heading Structure claim
    if (strength.title === "Good Heading Structure") {
      const h1Count = (html.match(/<h1[^>]*>/gi) || []).length;
      const h2Count = (html.match(/<h2[^>]*>/gi) || []).length;
      isVerified = h1Count >= 1 && h2Count >= 2;
    }

    // Verify Comprehensive Content claim
    if (strength.title === "Comprehensive Content" || strength.title === "Good Content Length") {
      const textContent = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ");
      const wordCount = textContent.split(" ").filter((w) => w.length > 3).length;
      if (strength.title === "Comprehensive Content") {
        isVerified = wordCount > 1500;
      } else {
        isVerified = wordCount > 800;
      }
    }

    // Verify Meta Description Present claim
    if (strength.title === "Meta Description Present") {
      // Match initial detection - just check for presence of name="description"
      const hasMetaDesc = html.includes('name="description"') || html.includes("name='description'");
      isVerified = hasMetaDesc;
    }

    // Verify Question-Based Content claim
    if (strength.title === "Question-Based Content") {
      const questionHeadings = (html.match(/\?<\/h[1-6]>/gi) || []).length;
      const hasWhatHow = /what is|how (to|do|does|can)|why (is|do|does)|when (to|should)/i.test(html);
      isVerified = questionHeadings >= 1 || hasWhatHow;
    }

    // Verify Table of Contents claim
    if (strength.title === "Table of Contents") {
      const hasTocClass = /class=["'][^"']*toc[^"']*["']/i.test(html);
      const hasTocId = /id=["']toc["']/i.test(html);
      const hasTocHeading = /<h[2-4][^>]*>.*?(table of contents|contents).*?<\/h[2-4]>/i.test(html);
      const hasInThisArticle = /<h[2-4][^>]*>.*?in this (article|page).*?<\/h[2-4]>/i.test(html);
      const anchorLinks = (html.match(/<a[^>]+href="#[^"]+"/gi) || []);
      const hasNavStructure = anchorLinks.length >= 5;
      const indicators = [hasTocClass, hasTocId, hasTocHeading, hasInThisArticle, hasNavStructure].filter(Boolean).length;
      isVerified = indicators >= 2;
    }

    // Verify Summary Sections claim
    if (strength.title === "Summary Sections") {
      const hasSummaryHeading = /<h[1-4][^>]*>.*?(summary|key takeaway|tl;?dr|bottom line).*?<\/h[1-4]>/i.test(html);
      const hasSummaryInline = /\bin summary\b|\bto summarize\b|\bkey takeaway/i.test(html);
      isVerified = hasSummaryHeading || hasSummaryInline;
    }

    // Verify Content Freshness Signals claim
    if (strength.title === "Content Freshness Signals") {
      const hasDateModified = html.includes("dateModified") || html.includes("datePublished");
      const hasLastUpdated = /last (updated|modified)|updated on|published on/i.test(html);
      const hasVisibleDate = /<time[^>]*datetime/i.test(html);
      isVerified = hasDateModified || hasLastUpdated || hasVisibleDate;
    }

    // Verify Structured Lists claim
    if (strength.title === "Structured Lists") {
      const ulCount = (html.match(/<ul[^>]*>/gi) || []).length;
      const olCount = (html.match(/<ol[^>]*>/gi) || []).length;
      isVerified = ulCount >= 1 || olCount >= 1;
    }

    // ============ TECHNICAL PILLAR VERIFICATION ============

    // Verify Schema Markup Implemented claim
    if (strength.title === "Schema Markup Implemented") {
      const hasJsonLd = /<script[^>]*type=["']application\/ld\+json["'][^>]*>/i.test(html);
      const hasMicrodata = /itemscope|itemtype/i.test(html);
      isVerified = hasJsonLd || hasMicrodata;
    }

    // Verify Secure HTTPS Connection claim
    if (strength.title === "Secure HTTPS Connection") {
      // This is verified at fetch time, trust the initial check
      isVerified = true;
    }

    // Verify Mobile-Responsive claim
    if (strength.title === "Mobile-Responsive") {
      const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
      isVerified = hasViewport;
    }

    // Verify Sitemap Referenced claim
    if (strength.title === "Sitemap Referenced") {
      const hasSitemapLink = /sitemap\.xml|sitemap_index\.xml/i.test(html);
      const hasSitemapMeta = /sitemap/i.test(html);
      isVerified = hasSitemapLink || hasSitemapMeta;
    }

    // Verify Canonical Tags claim
    if (strength.title === "Canonical Tags") {
      const hasCanonical = /<link[^>]+rel=["']canonical["']/i.test(html);
      isVerified = hasCanonical;
    }

    // Verify Open Graph Tags claim
    if (strength.title === "Open Graph Tags") {
      const hasOG = /<meta[^>]+property=["']og:/i.test(html);
      isVerified = hasOG;
    }

    // Verify LLMs.txt File claim
    if (strength.title === "LLMs.txt File") {
      const hasLlmsTxt = /llms\.txt/i.test(html);
      isVerified = hasLlmsTxt;
    }

    // ============ AUTHORITY PILLAR VERIFICATION ============

    // Verify Author Attribution claim
    if (strength.title === "Author Attribution") {
      // Must match initial detection pattern exactly
      const hasAuthorSchema = /"author"\s*:\s*\{|"author"\s*:\s*\[/i.test(html);
      const hasAuthorMeta = /<meta[^>]+name=["']author["']/i.test(html);
      const hasAuthorByline = /written by\s+[A-Z]|by\s+[A-Z][a-z]+\s+[A-Z]|author:\s*[A-Z]/i.test(html);
      const hasAuthorRel = /rel=["']author["']/i.test(html);
      isVerified = hasAuthorSchema || hasAuthorMeta || hasAuthorByline || hasAuthorRel;
    }

    // Verify About Page Present claim
    if (strength.title === "About Page Present") {
      const hasAboutLink = /href=["'][^"']*\/about[^"']*["']/i.test(html);
      const hasAboutUs = /about us|our story|our team|who we are/i.test(html);
      isVerified = hasAboutLink || hasAboutUs;
    }

    // Verify Contact Information claim
    if (strength.title === "Contact Information") {
      const hasContactLink = /href=["'][^"']*\/contact[^"']*["']/i.test(html);
      const hasEmail = /mailto:|@[a-z0-9.-]+\.[a-z]{2,}/i.test(html);
      const hasPhone = /tel:|(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/i.test(html);
      isVerified = hasContactLink || hasEmail || hasPhone;
    }

    // Verify Social Media Presence claim
    if (strength.title === "Social Media Presence") {
      const socialPatterns = /twitter\.com|x\.com|linkedin\.com|facebook\.com|instagram\.com|youtube\.com/i;
      isVerified = socialPatterns.test(html);
    }

    // Verify Credentials Displayed claim
    if (strength.title === "Credentials Displayed") {
      // Must match initial detection pattern exactly
      const hasCredentials = /certified|certification|credential|accredited|licensed|qualification|award-winning|years of experience|\d+\+?\s*years/i.test(html);
      isVerified = hasCredentials;
    }

    // Verify Content Citations claim
    if (strength.title === "Content Citations") {
      // Match initial detection pattern exactly
      const hasCitations = /source:|according to|research (shows|indicates|suggests|from)|study (shows|found|by)|data from|cited|reference|published in/i.test(html);
      const hasExternalLinks = (html.match(/<a[^>]+href=["']https?:\/\/(?!(?:www\.)?(?:twitter|facebook|linkedin|youtube|instagram|x\.com))[^"']+["'][^>]*>[^<]*(?:source|study|research|report)/gi) || []).length >= 1;
      isVerified = hasCitations || hasExternalLinks;
    }

    // Verify Testimonials Present claim
    if (strength.title === "Testimonials Present") {
      const hasTestimonialSection = /<(section|div)[^>]*class[^>]*testimonial/i.test(html);
      const hasTestimonialHeading = /<h[1-4][^>]*>.*?testimonial.*?<\/h[1-4]>/i.test(html);
      const hasQuotedContent = (html.match(/<blockquote/gi) || []).length >= 1;
      const hasClientSays = /what (our|the) (client|customer)s? say/i.test(html);
      isVerified = hasTestimonialSection || hasTestimonialHeading || hasQuotedContent || hasClientSays;
    }

    // Verify Case Studies/Results claim
    if (strength.title === "Case Studies/Results") {
      const hasCaseStudyHeading = /<h[1-4][^>]*>.*?case.stud/i.test(html);
      const hasCaseStudyLink = /<a[^>]+href[^>]*>.*?case.stud/i.test(html);
      const hasSuccessStory = /success stor(y|ies)/i.test(html);
      const hasResultsSection = /<h[1-4][^>]*>.*?(results|outcomes|impact).*?<\/h[1-4]>/i.test(html);
      isVerified = hasCaseStudyHeading || hasCaseStudyLink || hasSuccessStory || hasResultsSection;
    }

    // Verify Reviews Present claim
    if (strength.title === "Reviews Present") {
      const hasReviewSchema = /"@type"\s*:\s*"Review"|"aggregateRating"/i.test(html);
      const hasStarRating = /★|(\d+(\.\d+)?)\s*(out of|\/)\s*5\s*(star)?/i.test(html);
      const hasReviewPlatform = /trustpilot|g2\.com|capterra|google.*review/i.test(htmlLower);
      const hasReviewSection = /<(section|div)[^>]*class[^>]*review/i.test(html);
      isVerified = hasReviewSchema || hasStarRating || hasReviewPlatform || hasReviewSection;
    }

    // ============ MEASUREMENT PILLAR VERIFICATION ============

    // Verify Analytics Tracking Installed claim (new name)
    if (strength.title === "Analytics Tracking Installed" || strength.title === "Basic Analytics" || strength.title === "Analytics Implemented") {
      const hasGAScript = /<script[^>]*google-analytics[^>]*>|<script[^>]*gtag[^>]*>|gtag\s*\(\s*['"]config['"]/i.test(html);
      const hasOtherScript = /<script[^>]*plausible[^>]*>|data-domain=.*plausible|mixpanel\.init|amplitude\.getInstance/i.test(html);
      isVerified = hasGAScript || hasOtherScript;
    }

    // Verify Event Tracking Configured claim (new name)
    if (strength.title === "Event Tracking Configured" || strength.title === "Event/Goal Tracking") {
      const hasEventTracking = /gtag\s*\(\s*['"]event['"]|ga\s*\(\s*['"]send['"]\s*,\s*['"]event['"]|fbq\s*\(\s*['"]track['"]|analytics\.track\s*\(|dataLayer\.push\s*\(\s*\{[^}]*['"]event['"]/i.test(html);
      isVerified = hasEventTracking;
    }

    // ============ NEW AUTHORITY PILLAR VERIFICATION ============

    // Verify Press/Media Mentions claim
    if (strength.title === "Press/Media Mentions") {
      // Match initial detection pattern exactly
      const hasPressSection = /as (seen|featured) (in|on)|press|media|featured in|in the news|news coverage/i.test(html);
      const hasMediaLogos = /forbes|techcrunch|wired|entrepreneur|inc\.com|business insider|wall street journal|new york times|washington post|bloomberg|cnbc|bbc/i.test(htmlLower);
      isVerified = hasPressSection || hasMediaLogos;
    }

    // Verify Digital PR Presence claim
    if (strength.title === "Digital PR Presence") {
      // Match initial detection pattern exactly
      const hasDigitalPR = /podcast|webinar|speaking|keynote|conference|summit|appeared on|guest (on|post|author)|featured (guest|speaker)|interview/i.test(html);
      isVerified = hasDigitalPR;
    }

    // Verify Community Engagement claim
    if (strength.title === "Community Engagement") {
      // Match initial detection pattern exactly
      const hasCommunity = /reddit\.com|quora\.com|community|forum|discuss|stackoverflow/i.test(html);
      isVerified = hasCommunity;
    }

    if (isVerified) {
      verifiedStrengths.push(strength);
    } else {
      removedStrengths.push(strength.title);
      console.log(`Verification failed for: ${strength.title}`);
    }
  }

  return { verifiedStrengths, removedStrengths };
}

function getMaturityLevel(score: number): { level: string; description: string } {
  if (score >= 4.5) return {
    level: "Leader",
    description: "Your site is optimized for AI-driven discovery. Focus on maintaining and expanding your presence."
  };
  if (score >= 3.5) return {
    level: "Advanced",
    description: "You're well-positioned for AI search. A few improvements will help you reach leader status."
  };
  if (score >= 2.5) return {
    level: "Developing",
    description: "You have a good foundation. Focus on the recommendations below to improve AI visibility."
  };
  if (score >= 1.5) return {
    level: "Emerging",
    description: "You're starting to optimize for AI search. There's significant room for improvement."
  };
  return {
    level: "Foundation",
    description: "Your site is optimized for traditional SEO but needs work for AI-driven discovery."
  };
}

export async function analyzeWebsite(url: string): Promise<AEOReport> {
  // Ensure URL has protocol
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  // Fetch the homepage
  const { html: homepageHtml, headers } = await fetchWebsite(url);
  console.log(`Homepage fetched. Looking for additional pages to crawl...`);

  // Extract internal links to priority pages (FAQ, about, blog, etc.)
  const additionalLinks = extractInternalLinks(homepageHtml, url);
  console.log(`Found ${additionalLinks.length} priority pages to analyze:`, additionalLinks);

  // Fetch additional pages in parallel (with timeout protection)
  let allPagesHtml = homepageHtml;
  let pagesCrawled = 1;

  if (additionalLinks.length > 0) {
    const additionalPages = await fetchMultiplePages(additionalLinks);

    // Combine HTML from all pages for comprehensive analysis
    for (const [pageUrl, pageHtml] of additionalPages) {
      // Add page markers for context
      allPagesHtml += `\n<!-- PAGE: ${pageUrl} -->\n${pageHtml}`;
      pagesCrawled++;
    }
    console.log(`Analyzed ${pagesCrawled} pages total (homepage + ${additionalPages.size} additional)`);
  }

  // Run all analyses on combined content
  const contentAnalysis = analyzeContent(allPagesHtml);
  const technicalAnalysis = analyzeTechnical(allPagesHtml, url, headers);
  const authorityAnalysis = analyzeAuthority(allPagesHtml);
  const measurementAnalysis = analyzeMeasurement(allPagesHtml);

  // Combine all strengths for verification
  const allStrengths = [
    ...contentAnalysis.strengths,
    ...technicalAnalysis.strengths,
    ...authorityAnalysis.strengths,
    ...measurementAnalysis.strengths,
  ];

  // Run verification to filter out false positives (using combined HTML)
  const { verifiedStrengths, removedStrengths } = verifyAssessment(
    allPagesHtml,
    allStrengths,
    contentAnalysis.details,
    technicalAnalysis.details,
    authorityAnalysis.details
  );

  // Log verification results
  if (removedStrengths.length > 0) {
    console.log(`Verification removed ${removedStrengths.length} false positives:`, removedStrengths);
  }

  // Score adjustments for removed strengths
  let contentScoreAdjustment = 0;
  let technicalScoreAdjustment = 0;
  let authorityScoreAdjustment = 0;
  let measurementScoreAdjustment = 0;

  // Comprehensive map of removed strengths to score deductions
  const scoreDeductions: Record<string, { category: string; amount: number }> = {
    // Content pillar
    "FAQ Section Found": { category: "content", amount: 1 },
    "Good Heading Structure": { category: "content", amount: 0.75 },
    "Comprehensive Content": { category: "content", amount: 1 },
    "Good Content Length": { category: "content", amount: 0.5 },
    "Meta Description Present": { category: "content", amount: 0.5 },
    "Question-Based Content": { category: "content", amount: 0.75 },
    "Table of Contents": { category: "content", amount: 0.25 },
    "Summary Sections": { category: "content", amount: 0.25 },
    "Content Freshness Signals": { category: "content", amount: 0.25 },
    "Structured Lists": { category: "content", amount: 0.25 },
    // Technical pillar
    "Schema Markup Implemented": { category: "technical", amount: 1 },
    "Secure HTTPS Connection": { category: "technical", amount: 0.75 },
    "Mobile-Responsive": { category: "technical", amount: 0.5 },
    "Sitemap Referenced": { category: "technical", amount: 0.5 },
    "Canonical Tags": { category: "technical", amount: 0.25 },
    "Open Graph Tags": { category: "technical", amount: 0.25 },
    "LLMs.txt File": { category: "technical", amount: 0.5 },
    // Authority pillar (updated with new strengths)
    "Author Attribution": { category: "authority", amount: 0.5 },
    "About Page Present": { category: "authority", amount: 0.4 },
    "Contact Information": { category: "authority", amount: 0.35 },
    "Press/Media Mentions": { category: "authority", amount: 0.6 },
    "Digital PR Presence": { category: "authority", amount: 0.5 },
    "Community Engagement": { category: "authority", amount: 0.25 },
    "Social Media Presence": { category: "authority", amount: 0.25 },
    "Credentials Displayed": { category: "authority", amount: 0.25 },
    "Content Citations": { category: "authority", amount: 0.4 },
    "Testimonials Present": { category: "authority", amount: 0.5 },
    "Case Studies/Results": { category: "authority", amount: 0.5 },
    "Reviews Present": { category: "authority", amount: 0.5 },
    // Measurement pillar (updated - now only 2 detectable strengths)
    "Analytics Tracking Installed": { category: "measurement", amount: 1 },
    "Basic Analytics": { category: "measurement", amount: 1 },
    "Analytics Implemented": { category: "measurement", amount: 1 },
    "Event Tracking Configured": { category: "measurement", amount: 0.5 },
    "Event/Goal Tracking": { category: "measurement", amount: 0.5 },
  };

  for (const removed of removedStrengths) {
    const deduction = scoreDeductions[removed];
    if (deduction) {
      if (deduction.category === "content") {
        contentScoreAdjustment -= deduction.amount;
      } else if (deduction.category === "technical") {
        technicalScoreAdjustment -= deduction.amount;
      } else if (deduction.category === "authority") {
        authorityScoreAdjustment -= deduction.amount;
      } else if (deduction.category === "measurement") {
        measurementScoreAdjustment -= deduction.amount;
      }
    }
  }

  // Apply score adjustments
  const adjustedContentScore = Math.max(0, contentAnalysis.score + contentScoreAdjustment);
  const adjustedTechnicalScore = Math.max(0, technicalAnalysis.score + technicalScoreAdjustment);
  const adjustedAuthorityScore = Math.max(0, authorityAnalysis.score + authorityScoreAdjustment);
  const adjustedMeasurementScore = Math.max(0, measurementAnalysis.score + measurementScoreAdjustment);

  // Calculate weighted overall score with adjustments
  const overallScore =
    adjustedContentScore * 0.3 +
    adjustedTechnicalScore * 0.25 +
    adjustedAuthorityScore * 0.25 +
    adjustedMeasurementScore * 0.2;

  // Organize recommendations by pillar
  const recommendationsByPillar = {
    Content: contentAnalysis.recommendations,
    Technical: technicalAnalysis.recommendations,
    Authority: authorityAnalysis.recommendations,
    Measurement: measurementAnalysis.recommendations,
  };

  const maturity = getMaturityLevel(overallScore);

  // Generate pillar summaries with coverage percentages
  const pillarSummaries = generatePillarSummaries(
    adjustedContentScore,
    adjustedTechnicalScore,
    adjustedAuthorityScore,
    adjustedMeasurementScore,
    verifiedStrengths,
    recommendationsByPillar,
    url
  );

  // Generate top 3 priorities across all pillars
  const topPriorities = generateTopPriorities(recommendationsByPillar);

  return {
    url,
    scores: {
      content: Math.round(adjustedContentScore * 10) / 10,
      technical: Math.round(adjustedTechnicalScore * 10) / 10,
      authority: Math.round(adjustedAuthorityScore * 10) / 10,
      measurement: Math.round(adjustedMeasurementScore * 10) / 10,
      overall: Math.round(overallScore * 10) / 10,
    },
    maturityLevel: maturity.level,
    maturityDescription: maturity.description,
    strengths: verifiedStrengths,
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
  };
}

// Generate comprehensive pillar summaries
function generatePillarSummaries(
  contentScore: number,
  technicalScore: number,
  authorityScore: number,
  measurementScore: number,
  strengths: AEOStrength[],
  recommendations: {
    Content: AEORecommendation[];
    Technical: AEORecommendation[];
    Authority: AEORecommendation[];
    Measurement: AEORecommendation[];
  },
  url: string
) {
  const hostname = new URL(url).hostname.replace("www.", "");

  // Content: 10 possible checks
  const contentChecksTotal = 10;
  const contentStrengths = strengths.filter(s => s.category === "Content").length;
  const contentRecsCount = recommendations.Content.length;
  const contentChecksPass = contentStrengths;
  const contentCoverage = Math.round((contentScore / 5) * 100);

  let contentFindings = "";
  if (contentScore >= 4) {
    contentFindings = `${hostname} demonstrates excellent content optimization for AI search. Your content is well-structured, comprehensive, and formatted in ways that AI systems can easily understand and cite. Strong FAQ coverage and clear heading hierarchy make your content highly accessible to answer engines.`;
  } else if (contentScore >= 3) {
    contentFindings = `${hostname} shows moderate content maturity for AI search. While some AEO best practices are in place (like structured headings or FAQ content), there are opportunities to improve question coverage, content depth, and semantic organization to increase AI citation likelihood.`;
  } else if (contentScore >= 2) {
    contentFindings = `${hostname} has basic content foundations but needs significant improvement for AI visibility. Content structure is limited, and key elements like FAQ sections, comprehensive topic coverage, and clear information hierarchy are missing or incomplete.`;
  } else {
    contentFindings = `${hostname} requires substantial content improvements to be visible to AI search engines. The site lacks key AEO elements like structured FAQs, clear heading hierarchies, and comprehensive topic coverage that AI systems rely on when generating answers.`;
  }

  // Technical: 12 possible checks
  const technicalChecksTotal = 12;
  const technicalStrengths = strengths.filter(s => s.category === "Technical").length;
  const technicalChecksPass = technicalStrengths;
  const technicalCoverage = Math.round((technicalScore / 5) * 100);

  let technicalFindings = "";
  if (technicalScore >= 4) {
    technicalFindings = `${hostname} has excellent technical AEO implementation. Schema markup is comprehensive, page structure is optimized for AI crawlers, and technical foundations enable AI systems to accurately parse and cite your content.`;
  } else if (technicalScore >= 3) {
    technicalFindings = `${hostname} demonstrates moderate technical maturity with some schema markup implementation and basic performance optimization. Expanding schema coverage and improving structured data would significantly boost AI visibility.`;
  } else if (technicalScore >= 2) {
    technicalFindings = `${hostname} has limited technical AEO implementation. Basic meta tags may be present, but schema markup is minimal or missing, reducing AI systems' ability to understand and properly attribute your content.`;
  } else {
    technicalFindings = `${hostname} lacks essential technical AEO elements. Without proper schema markup, structured data, and technical optimization, AI systems struggle to parse your content accurately and are unlikely to cite your pages.`;
  }

  // Authority: 12 possible checks
  const authorityChecksTotal = 12;
  const authorityStrengths = strengths.filter(s => s.category === "Authority").length;
  const authorityChecksPass = authorityStrengths;
  const authorityCoverage = Math.round((authorityScore / 5) * 100);

  let authorityFindings = "";
  if (authorityScore >= 4) {
    authorityFindings = `${hostname} demonstrates strong authority signals that AI systems recognize. Visible credentials, citations from other sources, and clear expertise indicators position your brand as a trusted source AI actively recommends.`;
  } else if (authorityScore >= 3) {
    authorityFindings = `${hostname} has moderate authority signals. Some trust indicators are present (like about pages or contact information), but expanding digital PR efforts, building citations, and showcasing credentials would strengthen AI trust.`;
  } else if (authorityScore >= 2) {
    authorityFindings = `${hostname} has limited authority signals visible to AI systems. Key trust indicators like author attribution, testimonials, and external citations are missing or minimal, reducing the likelihood of AI recommendation.`;
  } else {
    authorityFindings = `${hostname} lacks authority signals that AI systems use to determine trustworthiness. Without visible credentials, citations, and expertise indicators, AI systems have no basis to recommend your content over competitors.`;
  }

  // Measurement: 8 possible checks
  const measurementChecksTotal = 8;
  const measurementStrengths = strengths.filter(s => s.category === "Measurement").length;
  const measurementChecksPass = measurementStrengths;
  const measurementCoverage = Math.round((measurementScore / 5) * 100);

  let measurementFindings = "";
  if (measurementScore >= 4) {
    measurementFindings = `${hostname} has excellent measurement infrastructure in place. Analytics tracking is comprehensive, enabling you to monitor AI-driven traffic, track conversions, and measure the impact of AEO improvements.`;
  } else if (measurementScore >= 3) {
    measurementFindings = `${hostname} has active web analytics implementation. Basic tracking is in place, but implementing LLM-specific traffic tracking and mention monitoring would provide deeper insights into AI visibility.`;
  } else if (measurementScore >= 2) {
    measurementFindings = `${hostname} has minimal measurement capabilities. Limited analytics make it difficult to track AI-driven traffic or measure the effectiveness of optimization efforts.`;
  } else {
    measurementFindings = `${hostname} lacks measurement infrastructure for tracking AI visibility. Without analytics, you cannot measure AI-driven traffic, monitor brand mentions, or evaluate AEO improvement impact.`;
  }

  return {
    Content: {
      findings: contentFindings,
      coveragePercent: contentCoverage,
      checksPass: contentChecksPass,
      checksTotal: contentChecksTotal,
    },
    Technical: {
      findings: technicalFindings,
      coveragePercent: technicalCoverage,
      checksPass: technicalChecksPass,
      checksTotal: technicalChecksTotal,
    },
    Authority: {
      findings: authorityFindings,
      coveragePercent: authorityCoverage,
      checksPass: authorityChecksPass,
      checksTotal: authorityChecksTotal,
    },
    Measurement: {
      findings: measurementFindings,
      coveragePercent: measurementCoverage,
      checksPass: measurementChecksPass,
      checksTotal: measurementChecksTotal,
    },
  };
}

// Generate top 3 priorities based on impact and score
function generateTopPriorities(recommendations: {
  Content: AEORecommendation[];
  Technical: AEORecommendation[];
  Authority: AEORecommendation[];
  Measurement: AEORecommendation[];
}): AEORecommendation[] {
  // Priority weight by category (higher = more important for AEO)
  const categoryWeight: Record<string, number> = {
    Content: 1.3,    // Content has highest impact
    Technical: 1.2,  // Technical enables AI parsing
    Authority: 1.1,  // Authority builds trust
    Measurement: 1.0 // Measurement is foundational
  };

  // High-priority recommendation titles (foundational AEO elements)
  const highPriorityTitles = [
    "Add an FAQ Section",
    "Implement Schema Markup",
    "Add Organization Schema",
    "Add Meta Descriptions",
    "Improve Heading Hierarchy",
    "Add Author Attribution",
    "Implement Analytics",
    "Create How-To Content",
    "Add Structured FAQs",
  ];

  // Collect all recommendations with priority scores
  const allRecs: Array<AEORecommendation & { priorityScore: number }> = [];

  for (const [category, recs] of Object.entries(recommendations)) {
    for (const rec of recs) {
      const weight = categoryWeight[category] || 1;
      const isHighPriority = highPriorityTitles.some(t =>
        rec.title.toLowerCase().includes(t.toLowerCase())
      );
      const priorityScore = weight * (isHighPriority ? 2 : 1);

      allRecs.push({
        ...rec,
        priorityScore,
        priority: 0, // Will be set after sorting
      });
    }
  }

  // Sort by priority score and take top 3
  allRecs.sort((a, b) => b.priorityScore - a.priorityScore);

  return allRecs.slice(0, 3).map((rec, index) => ({
    category: rec.category,
    title: rec.title,
    description: rec.description,
    why: rec.why,
    priority: index + 1,
  }));
}
