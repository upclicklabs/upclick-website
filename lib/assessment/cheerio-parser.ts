import * as cheerio from "cheerio";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

export interface ParsedPage {
  $: cheerio.CheerioAPI;
  mainContent: string; // Extracted main content text (no nav/footer/scripts)
  mainContentHtml: string; // Extracted main content HTML
  jsonLdBlocks: JsonLdBlock[];
}

export interface JsonLdBlock {
  "@type"?: string | string[];
  "@context"?: string;
  [key: string]: unknown;
}

// Parse HTML into a Cheerio document and extract structured data
export function parsePage(html: string, url: string): ParsedPage {
  const $ = cheerio.load(html);
  const mainContent = extractMainContent(html, url);
  const mainContentHtml = extractMainContentHtml($);
  const jsonLdBlocks = extractJsonLd($);

  return { $, mainContent, mainContentHtml, jsonLdBlocks };
}

// Extract main readable content using Mozilla Readability (strips nav, footer, ads)
function extractMainContent(html: string, url: string): string {
  try {
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    if (article && article.textContent) {
      // Clean up whitespace
      return article.textContent.replace(/\s+/g, " ").trim();
    }
  } catch (error) {
    console.log("Readability extraction failed, falling back to Cheerio:", error);
  }

  // Fallback: use Cheerio to extract text from likely content areas
  const $ = cheerio.load(html);
  $("script, style, nav, header, footer, aside, [role='navigation'], [role='banner']").remove();
  const content = $("main, article, [role='main'], .content, #content").text();
  if (content.trim().length > 100) {
    return content.replace(/\s+/g, " ").trim();
  }
  return $("body").text().replace(/\s+/g, " ").trim();
}

// Extract main content HTML preserving structure
function extractMainContentHtml($: cheerio.CheerioAPI): string {
  const contentSelectors = ["main", "article", "[role='main']", ".content", "#content"];
  for (const selector of contentSelectors) {
    const content = $(selector).html();
    if (content && content.trim().length > 100) {
      return content;
    }
  }
  // Fallback to body minus nav/footer
  const $clone = cheerio.load($.html());
  $clone("script, style, nav, header, footer, aside").remove();
  return $clone("body").html() || "";
}

// Extract and parse all JSON-LD blocks
export function extractJsonLd($: cheerio.CheerioAPI): JsonLdBlock[] {
  const blocks: JsonLdBlock[] = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).html();
      if (!raw) return;
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        blocks.push(...parsed);
      } else {
        blocks.push(parsed);
        // Handle @graph pattern
        if (parsed["@graph"] && Array.isArray(parsed["@graph"])) {
          blocks.push(...parsed["@graph"]);
        }
      }
    } catch {
      // Invalid JSON-LD, skip
    }
  });

  return blocks;
}

// Get all schema types found in JSON-LD
export function getSchemaTypes(blocks: JsonLdBlock[]): string[] {
  const types: string[] = [];
  for (const block of blocks) {
    const type = block["@type"];
    if (typeof type === "string") {
      types.push(type);
    } else if (Array.isArray(type)) {
      types.push(...type.filter((t): t is string => typeof t === "string"));
    }
  }
  return [...new Set(types)];
}

// Find a specific schema block by type
export function findSchemaByType(blocks: JsonLdBlock[], type: string): JsonLdBlock | undefined {
  return blocks.find((block) => {
    const blockType = block["@type"];
    if (typeof blockType === "string") return blockType === type;
    if (Array.isArray(blockType)) return blockType.includes(type);
    return false;
  });
}

// Count words in text
export function countWords(text: string): number {
  return text
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .length;
}

// Get text content scoped to main content area
export function getContentAreaText($: cheerio.CheerioAPI): string {
  const $clone = cheerio.load($.html());
  $clone("script, style, nav, header, footer, aside, [role='navigation']").remove();

  const content = $clone("main, article, [role='main']").text();
  if (content.trim().length > 100) {
    return content.replace(/\s+/g, " ").trim();
  }
  return $clone("body").text().replace(/\s+/g, " ").trim();
}
