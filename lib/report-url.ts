import LZString from "lz-string";
import { AEOReport } from "./email-templates";

// Minimal report data for URL encoding (reduces size significantly)
export interface MinimalReport {
  u: string; // url
  s: {
    c: number; // content
    t: number; // technical
    a: number; // authority
    m: number; // measurement
    o: number; // overall
  };
  l: string; // maturityLevel
  d: string; // maturityDescription
  st: Array<{ c: string; t: string; d: string }>; // strengths (category, title, description)
  r: {
    C: Array<{ t: string; d: string; w?: string }>; // Content recommendations
    T: Array<{ t: string; d: string; w?: string }>; // Technical
    A: Array<{ t: string; d: string; w?: string }>; // Authority
    M: Array<{ t: string; d: string; w?: string }>; // Measurement
  };
  at: string; // analyzedAt
}

// Truncate a string to maxLen characters
function truncate(str: string | undefined, maxLen: number): string {
  if (!str) return "";
  return str.length > maxLen ? str.slice(0, maxLen) + "..." : str;
}

// Max recommendations per pillar and strengths to keep URL under browser limits
const MAX_RECS_PER_PILLAR = 3;
const MAX_STRENGTHS = 5;
const MAX_DESC_LEN = 120;
const MAX_WHY_LEN = 80;
const MAX_MATURITY_DESC_LEN = 150;

// Convert full report to minimal format
function toMinimal(report: AEOReport): MinimalReport {
  return {
    u: report.url,
    s: {
      c: report.scores.content,
      t: report.scores.technical,
      a: report.scores.authority,
      m: report.scores.measurement,
      o: report.scores.overall,
    },
    l: report.maturityLevel,
    d: truncate(report.maturityDescription, MAX_MATURITY_DESC_LEN),
    st: (report.strengths || []).slice(0, MAX_STRENGTHS).map((s) => ({
      c: s.category,
      t: s.title,
      d: truncate(s.description, MAX_DESC_LEN),
    })),
    r: {
      C: (report.recommendationsByPillar.Content || []).slice(0, MAX_RECS_PER_PILLAR).map((r) => ({
        t: r.title,
        d: truncate(r.description, MAX_DESC_LEN),
        w: truncate(r.why, MAX_WHY_LEN),
      })),
      T: (report.recommendationsByPillar.Technical || []).slice(0, MAX_RECS_PER_PILLAR).map((r) => ({
        t: r.title,
        d: truncate(r.description, MAX_DESC_LEN),
        w: truncate(r.why, MAX_WHY_LEN),
      })),
      A: (report.recommendationsByPillar.Authority || []).slice(0, MAX_RECS_PER_PILLAR).map((r) => ({
        t: r.title,
        d: truncate(r.description, MAX_DESC_LEN),
        w: truncate(r.why, MAX_WHY_LEN),
      })),
      M: (report.recommendationsByPillar.Measurement || []).slice(0, MAX_RECS_PER_PILLAR).map((r) => ({
        t: r.title,
        d: truncate(r.description, MAX_DESC_LEN),
        w: truncate(r.why, MAX_WHY_LEN),
      })),
    },
    at: report.analyzedAt,
  };
}

// Convert minimal back to full report
function fromMinimal(minimal: MinimalReport): AEOReport {
  return {
    url: minimal.u,
    scores: {
      content: minimal.s.c,
      technical: minimal.s.t,
      authority: minimal.s.a,
      measurement: minimal.s.m,
      overall: minimal.s.o,
    },
    maturityLevel: minimal.l,
    maturityDescription: minimal.d,
    strengths: (minimal.st || []).map((s) => ({
      category: s.c,
      title: s.t,
      description: s.d,
    })),
    recommendationsByPillar: {
      Content: (minimal.r.C || []).map((r) => ({
        category: "Content",
        title: r.t,
        description: r.d,
        why: r.w,
      })),
      Technical: (minimal.r.T || []).map((r) => ({
        category: "Technical",
        title: r.t,
        description: r.d,
        why: r.w,
      })),
      Authority: (minimal.r.A || []).map((r) => ({
        category: "Authority",
        title: r.t,
        description: r.d,
        why: r.w,
      })),
      Measurement: (minimal.r.M || []).map((r) => ({
        category: "Measurement",
        title: r.t,
        description: r.d,
        why: r.w,
      })),
    },
    analyzedAt: minimal.at,
  };
}

// Encode report to URL-safe string
export function encodeReport(report: AEOReport): string {
  const minimal = toMinimal(report);
  const json = JSON.stringify(minimal);
  const compressed = LZString.compressToEncodedURIComponent(json);
  return compressed;
}

// Decode report from URL-safe string
export function decodeReport(encoded: string): AEOReport | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) {
      console.error("LZ decompression returned null. Encoded length:", encoded.length);
      return null;
    }
    const minimal = JSON.parse(json) as MinimalReport;
    return fromMinimal(minimal);
  } catch (error) {
    console.error("Failed to decode report. Encoded length:", encoded.length, "Error:", error);
    return null;
  }
}

// Generate slug from URL
export function generateSlug(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    return hostname.replace(/\./g, "-").replace(/[^a-z0-9-]/gi, "");
  } catch {
    return "report";
  }
}

// Generate full report URL
export function generateReportUrl(report: AEOReport, baseUrl: string): string {
  const slug = generateSlug(report.url);
  const encoded = encodeReport(report);
  return `${baseUrl}/report/${slug}?d=${encoded}`;
}
