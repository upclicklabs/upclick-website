import { PageSpeedResult } from "../types";

export async function callPageSpeedInsights(url: string): Promise<PageSpeedResult | null> {
  const apiKey = process.env.PAGESPEED_API_KEY;
  const endpoint = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

  // Build URL with multiple category params
  const params = new URLSearchParams({ url, strategy: "mobile" });
  if (apiKey) params.append("key", apiKey);

  // URLSearchParams doesn't support duplicate keys well, build manually
  const categoryParams = ["performance", "accessibility", "seo", "best-practices"]
    .map((c) => `category=${c}`)
    .join("&");
  const fetchUrl = `${endpoint}?${params.toString()}&${categoryParams}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(fetchUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.log(`PageSpeed Insights returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    const lhr = data.lighthouseResult;
    if (!lhr) return null;

    return {
      performanceScore: Math.round((lhr.categories?.performance?.score ?? 0) * 100),
      accessibilityScore: Math.round((lhr.categories?.accessibility?.score ?? 0) * 100),
      seoScore: Math.round((lhr.categories?.seo?.score ?? 0) * 100),
      bestPracticesScore: Math.round((lhr.categories?.["best-practices"]?.score ?? 0) * 100),
      metrics: {
        fcp: lhr.audits?.["first-contentful-paint"]?.numericValue ?? 0,
        lcp: lhr.audits?.["largest-contentful-paint"]?.numericValue ?? 0,
        cls: lhr.audits?.["cumulative-layout-shift"]?.numericValue ?? 0,
        tbt: lhr.audits?.["total-blocking-time"]?.numericValue ?? 0,
        speedIndex: lhr.audits?.["speed-index"]?.numericValue ?? 0,
      },
      audits: {
        viewport: lhr.audits?.["viewport"]?.score === 1,
        documentTitle: lhr.audits?.["document-title"]?.score === 1,
        metaDescription: lhr.audits?.["meta-description"]?.score === 1,
        isIndexable: lhr.audits?.["is-crawlable"]?.score === 1,
        canonical: lhr.audits?.["canonical"]?.score === 1,
        imageAlt: {
          score: lhr.audits?.["image-alt"]?.score ?? 0,
          details: lhr.audits?.["image-alt"]?.displayValue ?? "",
        },
        linkText: {
          score: lhr.audits?.["link-text"]?.score ?? 0,
          details: lhr.audits?.["link-text"]?.displayValue ?? "",
        },
      },
    };
  } catch (error) {
    clearTimeout(timeoutId);
    console.log("PageSpeed Insights failed:", error);
    return null;
  }
}
