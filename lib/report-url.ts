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
    d: report.maturityDescription,
    st: (report.strengths || []).slice(0, 8).map((s) => ({
      c: s.category,
      t: s.title,
      d: s.description,
    })),
    r: {
      C: (report.recommendationsByPillar.Content || []).map((r) => ({
        t: r.title,
        d: r.description,
        w: r.why,
      })),
      T: (report.recommendationsByPillar.Technical || []).map((r) => ({
        t: r.title,
        d: r.description,
        w: r.why,
      })),
      A: (report.recommendationsByPillar.Authority || []).map((r) => ({
        t: r.title,
        d: r.description,
        w: r.why,
      })),
      M: (report.recommendationsByPillar.Measurement || []).map((r) => ({
        t: r.title,
        d: r.description,
        w: r.why,
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
    if (!json) return null;
    const minimal = JSON.parse(json) as MinimalReport;
    return fromMinimal(minimal);
  } catch (error) {
    console.error("Failed to decode report:", error);
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
