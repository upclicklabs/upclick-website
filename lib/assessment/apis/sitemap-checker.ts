import { SitemapResult } from "../types";

export async function fetchSitemapXml(baseUrl: string): Promise<SitemapResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${baseUrl}/sitemap.xml`, {
      signal: controller.signal,
      headers: { "User-Agent": "UpClickLabs-AEO-Analyzer/2.0" },
      redirect: "follow",
    });

    clearTimeout(timeoutId);

    if (!response.ok) return { exists: false };

    const text = await response.text();
    const isXml = text.includes("<urlset") || text.includes("<sitemapindex");
    if (!isXml) return { exists: false };

    const urlCount = (text.match(/<url>/gi) || []).length;
    const hasLastmod = text.includes("<lastmod>");

    return { exists: true, urlCount, hasLastmod };
  } catch {
    return { exists: false };
  }
}
