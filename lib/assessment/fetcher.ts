import * as cheerio from "cheerio";

const USER_AGENT =
  "Mozilla/5.0 (compatible; UpClickLabs-AEO-Analyzer/2.0; +https://upclicklabs.com)";

// Normalize URL for consistent analysis
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.protocol = "https:";
    let pathname = parsed.pathname;
    if (pathname.endsWith("/") && pathname !== "/") {
      pathname = pathname.slice(0, -1);
    }
    parsed.pathname = pathname;
    // Remove tracking parameters
    for (const param of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "ref"]) {
      parsed.searchParams.delete(param);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

export interface FetchResult {
  html: string;
  url: string;
  loadTime: number;
  headers: Record<string, string>;
}

export async function fetchWebsite(url: string): Promise<FetchResult> {
  const startTime = Date.now();
  const normalizedUrl = normalizeUrl(url);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(normalizedUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
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
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timeout after 30 seconds");
    }
    throw new Error(`Failed to fetch website: ${error}`);
  }
}

// Extract internal links to AEO-relevant priority pages
export function extractInternalLinks($: cheerio.CheerioAPI, baseUrl: string): string[] {
  const baseHostname = new URL(baseUrl).hostname;
  const links = new Set<string>();

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

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href || href.startsWith("#") || href.startsWith("javascript:") ||
        href.startsWith("mailto:") || href.startsWith("tel:")) {
      return;
    }

    try {
      const absoluteUrl = new URL(href, baseUrl);
      if (absoluteUrl.hostname === baseHostname) {
        const path = absoluteUrl.pathname.toLowerCase();
        if (priorityPaths.some((p) => path.includes(p))) {
          links.add(absoluteUrl.origin + absoluteUrl.pathname);
        }
      }
    } catch {
      // Invalid URL, skip
    }
  });

  // Sort by priority
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

  return sortedLinks.slice(0, 5);
}

// Fetch multiple pages in parallel
export async function fetchMultiplePages(urls: string[]): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  const fetchPromises = urls.map(async (url) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
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
    }
  });

  await Promise.all(fetchPromises);
  return results;
}
