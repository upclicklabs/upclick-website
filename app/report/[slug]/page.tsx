"use client";

import { useSearchParams } from "next/navigation";
import { decodeReport } from "@/lib/report-url";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { AEOReport, PillarSummary, AEORecommendation } from "@/lib/email-templates";

function getScoreColor(score: number): string {
  if (score >= 4) return "#22c55e";
  if (score >= 3) return "#eab308";
  if (score >= 2) return "#f97316";
  return "#ef4444";
}

function getMaturityColor(level: string): string {
  switch (level) {
    case "Leader": return "#22c55e";
    case "Advanced": return "#3b82f6";
    case "Developing": return "#eab308";
    case "Emerging": return "#f97316";
    default: return "#ef4444";
  }
}

function getPillarInfo(pillar: string): { color: string; tagline: string } {
  switch (pillar) {
    case "Content":
      return { color: "#8b5cf6", tagline: "Build the source AI trusts" };
    case "Technical":
      return { color: "#3b82f6", tagline: "Structure wins" };
    case "Authority":
      return { color: "#ec4899", tagline: "Earn trust, everywhere" };
    case "Measurement":
      return { color: "#f97316", tagline: "Track your AI visibility" };
    default:
      return { color: "#666", tagline: "" };
  }
}

// Generate pillar summaries dynamically from scores
function generatePillarSummaries(report: AEOReport): AEOReport["pillarSummaries"] {
  const hostname = new URL(report.url).hostname.replace("www.", "");
  const { content, technical, authority, measurement } = report.scores;
  const strengths = report.strengths || [];

  const getFindings = (pillar: string, score: number): string => {
    const pillarStrengths = strengths.filter(s => s.category === pillar).length;

    if (pillar === "Content") {
      if (score >= 4) return `${hostname} demonstrates excellent content optimization for AI search. Your content is well-structured, comprehensive, and formatted in ways that AI systems can easily understand and cite.`;
      if (score >= 3) return `${hostname} shows moderate content maturity for AI search. While some AEO best practices are in place, there are opportunities to improve question coverage, content depth, and semantic organization.`;
      if (score >= 2) return `${hostname} has basic content foundations but needs significant improvement for AI visibility. Content structure is limited, and key elements like FAQ sections are missing or incomplete.`;
      return `${hostname} requires substantial content improvements to be visible to AI search engines. The site lacks key AEO elements like structured FAQs and clear heading hierarchies.`;
    }
    if (pillar === "Technical") {
      if (score >= 4) return `${hostname} has excellent technical AEO implementation. Schema markup is comprehensive, page structure is optimized for AI crawlers.`;
      if (score >= 3) return `${hostname} demonstrates moderate technical maturity with some schema markup implementation. Expanding schema coverage would significantly boost AI visibility.`;
      if (score >= 2) return `${hostname} has limited technical AEO implementation. Basic meta tags may be present, but schema markup is minimal or missing.`;
      return `${hostname} lacks essential technical AEO elements. Without proper schema markup, AI systems struggle to parse your content accurately.`;
    }
    if (pillar === "Authority") {
      if (score >= 4) return `${hostname} demonstrates strong authority signals that AI systems recognize. Visible credentials and citations position your brand as a trusted source.`;
      if (score >= 3) return `${hostname} has moderate authority signals. Some trust indicators are present, but expanding digital PR efforts and showcasing credentials would strengthen AI trust.`;
      if (score >= 2) return `${hostname} has limited authority signals visible to AI systems. Key trust indicators like author attribution and testimonials are missing or minimal.`;
      return `${hostname} lacks authority signals that AI systems use to determine trustworthiness. Without visible credentials, AI systems have no basis to recommend your content.`;
    }
    // Measurement
    if (score >= 4) return `${hostname} has excellent measurement infrastructure in place. Analytics tracking is comprehensive for monitoring AI-driven traffic.`;
    if (score >= 3) return `${hostname} has active web analytics implementation. Basic tracking is in place, but LLM-specific traffic tracking would provide deeper insights.`;
    if (score >= 2) return `${hostname} has minimal measurement capabilities. Limited analytics make it difficult to track AI-driven traffic.`;
    return `${hostname} lacks measurement infrastructure for tracking AI visibility. Without analytics, you cannot measure AI-driven traffic or monitor brand mentions.`;
  };

  return {
    Content: {
      findings: getFindings("Content", content),
      coveragePercent: Math.round((content / 5) * 100),
      checksPass: strengths.filter(s => s.category === "Content").length,
      checksTotal: 16,
    },
    Technical: {
      findings: getFindings("Technical", technical),
      coveragePercent: Math.round((technical / 5) * 100),
      checksPass: strengths.filter(s => s.category === "Technical").length,
      checksTotal: 14,
    },
    Authority: {
      findings: getFindings("Authority", authority),
      coveragePercent: Math.round((authority / 5) * 100),
      checksPass: strengths.filter(s => s.category === "Authority").length,
      checksTotal: 17,
    },
    Measurement: {
      findings: getFindings("Measurement", measurement),
      coveragePercent: Math.round((measurement / 5) * 100),
      checksPass: strengths.filter(s => s.category === "Measurement").length,
      checksTotal: 11,
    },
  };
}

// Generate top priorities dynamically from recommendations
function generateTopPriorities(report: AEOReport): AEORecommendation[] {
  const categoryWeight: Record<string, number> = {
    Content: 1.3,
    Technical: 1.2,
    Authority: 1.1,
    Measurement: 1.0,
  };

  const highPriorityTitles = [
    "Add an FAQ Section",
    "Implement Schema Markup",
    "Add Organization Schema",
    "Add Meta Descriptions",
    "Improve Heading Hierarchy",
    "Add Author Attribution",
    "Implement Analytics",
  ];

  const allRecs: Array<AEORecommendation & { priorityScore: number }> = [];

  for (const [category, recs] of Object.entries(report.recommendationsByPillar)) {
    for (const rec of recs) {
      const weight = categoryWeight[category] || 1;
      const isHighPriority = highPriorityTitles.some(t =>
        rec.title.toLowerCase().includes(t.toLowerCase())
      );
      allRecs.push({
        ...rec,
        priorityScore: weight * (isHighPriority ? 2 : 1),
      });
    }
  }

  allRecs.sort((a, b) => b.priorityScore - a.priorityScore);

  return allRecs.slice(0, 3).map((rec, index) => ({
    category: rec.category,
    title: rec.title,
    description: rec.description,
    why: rec.why,
    priority: index + 1,
  }));
}

function CopyButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="text-sm text-neutral-400 hover:text-white transition-colors"
    >
      {copied ? "Copied!" : "Share Report"}
    </button>
  );
}

function ReportLoading() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-[#d4a000] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-neutral-400">Loading report...</p>
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<ReportLoading />}>
      <ReportContent />
    </Suspense>
  );
}

function ReportContent() {
  const searchParams = useSearchParams();
  const [report, setReport] = useState<AEOReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadReport() {
      // Check for short ID first (new URL format)
      const shortId = searchParams.get("id");
      if (shortId) {
        try {
          const response = await fetch(`/api/reports?id=${shortId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.report) {
              const reportData = data.report;
              // Generate pillarSummaries and topPriorities if not present
              if (!reportData.pillarSummaries) {
                reportData.pillarSummaries = generatePillarSummaries(reportData);
              }
              if (!reportData.topPriorities) {
                reportData.topPriorities = generateTopPriorities(reportData);
              }
              setReport(reportData);
              setLoading(false);
              return;
            }
          }
        } catch (err) {
          console.error("Failed to fetch report:", err);
        }
        setError(true);
        setLoading(false);
        return;
      }

      // Fall back to encoded data in URL
      const encoded = searchParams.get("d");
      if (encoded) {
        console.log("Decoding report from URL, encoded length:", encoded.length);
        const decoded = decodeReport(encoded);
        if (decoded) {
          // Generate pillarSummaries and topPriorities if not present
          if (!decoded.pillarSummaries) {
            decoded.pillarSummaries = generatePillarSummaries(decoded);
          }
          if (!decoded.topPriorities) {
            decoded.topPriorities = generateTopPriorities(decoded);
          }
          setReport(decoded);
        } else {
          console.error("Failed to decode report data. Encoded param length:", encoded.length);
          setError(true);
        }
      } else {
        console.error("No report data found in URL params. Available params:", Array.from(searchParams.keys()));
        setError(true);
      }
      setLoading(false);
    }

    loadReport();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#d4a000] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-400">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <h1 className="text-2xl font-serif mb-4">Report Not Found</h1>
          <p className="text-neutral-400 mb-8">
            This report link may be invalid or expired. Please request a new assessment.
          </p>
          <Link
            href="/#assessment"
            className="inline-block bg-[#d4a000] text-black px-6 py-3 font-medium hover:bg-[#b38600] transition-colors"
          >
            Get New Assessment
          </Link>
        </div>
      </div>
    );
  }

  const hostname = new URL(report.url).hostname.replace("www.", "");
  const pillars = ["Content", "Technical", "Authority", "Measurement"] as const;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-neutral-950 to-black" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#d4a000]/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#d4a000]/3 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/3" />

        <div className="relative container mx-auto px-6 py-16 md:py-24">
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <Link href="/" className="text-xl font-bold tracking-tight">
              UpClick Labs
            </Link>
            <div className="flex items-center gap-4">
              <CopyButton />
              <Link
                href="/#assessment"
                className="text-sm bg-[#d4a000] text-black px-4 py-2 font-medium hover:bg-[#b38600] transition-colors"
              >
                Get Your Assessment
              </Link>
            </div>
          </div>

          {/* Main Score Display */}
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-neutral-500 text-sm font-mono uppercase tracking-widest mb-4">
              AEO Assessment Report
            </p>
            <h1 className="text-3xl md:text-5xl font-serif mb-6">
              <span className="text-[#d4a000]">{hostname}</span>
            </h1>

            {/* Score Circle */}
            <div className="relative inline-flex items-center justify-center my-10">
              <div
                className="w-40 h-40 md:w-48 md:h-48 rounded-full border-4 flex flex-col items-center justify-center"
                style={{ borderColor: getScoreColor(report.scores.overall) }}
              >
                <span
                  className="text-5xl md:text-6xl font-bold"
                  style={{ color: getScoreColor(report.scores.overall) }}
                >
                  {report.scores.overall.toFixed(1)}
                </span>
                <span className="text-neutral-500 text-base mt-1">out of 5</span>
              </div>
            </div>

            {/* Maturity Level Badge */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <span
                className="px-6 py-2 rounded-full text-sm font-semibold uppercase tracking-wider border"
                style={{
                  borderColor: getMaturityColor(report.maturityLevel),
                  color: getMaturityColor(report.maturityLevel),
                  backgroundColor: `${getMaturityColor(report.maturityLevel)}15`,
                }}
              >
                {report.maturityLevel} Level
              </span>
            </div>

            <p className="text-neutral-200 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              {report.maturityDescription}
            </p>
          </div>
        </div>
      </section>

      {/* Score Breakdown Pills with Coverage */}
      <section className="border-y border-neutral-800 bg-neutral-950/50">
        <div className="container mx-auto px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {pillars.map((pillar) => {
              const info = getPillarInfo(pillar);
              const score = report.scores[pillar.toLowerCase() as keyof typeof report.scores];
              const summary = report.pillarSummaries?.[pillar];
              return (
                <div key={pillar} className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: info.color }}
                    />
                    <span className="text-sm font-medium text-neutral-200">{pillar}</span>
                  </div>
                  <span
                    className="text-2xl md:text-3xl font-bold"
                    style={{ color: getScoreColor(score as number) }}
                  >
                    {(score as number).toFixed(1)}
                  </span>
                  <span className="text-neutral-600 text-sm">/5</span>
                  {summary && (
                    <div className="mt-2">
                      <span className="text-xs text-neutral-500">{summary.coveragePercent}% coverage</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Top 3 Priorities */}
      {report.topPriorities && report.topPriorities.length > 0 && (
        <section className="container mx-auto px-6 py-10">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-[#d4a000]/10 to-transparent border border-[#d4a000]/30 rounded-xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#d4a000]/20 flex items-center justify-center">
                  <span className="text-[#d4a000] text-lg">🎯</span>
                </div>
                <div>
                  <h2 className="text-xl font-serif text-white">Top 3 Priorities</h2>
                  <p className="text-sm text-neutral-400">Focus on these first for maximum impact</p>
                </div>
              </div>
              <div className="space-y-4">
                {report.topPriorities.map((priority, index) => {
                  const pillarInfo = getPillarInfo(priority.category);
                  return (
                    <div
                      key={index}
                      className="flex gap-4 p-4 bg-neutral-900/50 rounded-lg border border-neutral-800"
                    >
                      <div
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{
                          backgroundColor: `${pillarInfo.color}20`,
                          color: pillarInfo.color,
                        }}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium">{priority.title}</span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${pillarInfo.color}20`,
                              color: pillarInfo.color,
                            }}
                          >
                            {priority.category}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-300">{priority.description}</p>
                        {priority.why && (
                          <p className="text-xs text-neutral-500 mt-2 italic">
                            Why: {priority.why}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* What You're Doing Right - Organized by Pillar */}
      {report.strengths && report.strengths.length > 0 && (() => {
        // Group strengths by category
        const strengthsByPillar = {
          Content: report.strengths.filter(s => s.category === "Content"),
          Technical: report.strengths.filter(s => s.category === "Technical"),
          Authority: report.strengths.filter(s => s.category === "Authority"),
          Measurement: report.strengths.filter(s => s.category === "Measurement"),
        };

        return (
          <section className="container mx-auto px-6 py-12">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl md:text-2xl font-serif">What You're Doing Right</h2>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      {pillars.map((pillar) => {
                        const info = getPillarInfo(pillar);
                        return (
                          <th
                            key={pillar}
                            className="py-3 px-4 text-sm font-semibold border-b-2 w-1/4"
                            style={{ borderColor: info.color, color: info.color }}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: info.color }}
                              />
                              {pillar}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="align-top">
                      {pillars.map((pillar) => {
                        const pillarStrengths = strengthsByPillar[pillar];
                        const info = getPillarInfo(pillar);
                        return (
                          <td key={pillar} className="py-4 px-4 border-b border-neutral-800/50">
                            {pillarStrengths.length > 0 ? (
                              <ul className="space-y-3">
                                {pillarStrengths.map((strength, index) => (
                                  <li key={index} className="text-xs">
                                    <p className="text-white font-medium mb-1">{strength.title}</p>
                                    <p className="text-neutral-200 leading-relaxed">
                                      {strength.description}
                                    </p>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-neutral-600 text-xs italic">
                                No strengths detected yet
                              </p>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Mobile View - Stacked */}
              <div className="md:hidden space-y-6">
                {pillars.map((pillar) => {
                  const pillarStrengths = strengthsByPillar[pillar];
                  const info = getPillarInfo(pillar);
                  if (pillarStrengths.length === 0) return null;

                  return (
                    <div key={pillar}>
                      <div
                        className="flex items-center gap-2 mb-3 pb-2 border-b"
                        style={{ borderColor: info.color }}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: info.color }}
                        />
                        <h3 className="text-sm font-semibold" style={{ color: info.color }}>
                          {pillar}
                        </h3>
                      </div>
                      <ul className="space-y-3">
                        {pillarStrengths.map((strength, index) => (
                          <li key={index} className="text-xs">
                            <p className="text-white font-medium mb-1">{strength.title}</p>
                            <p className="text-neutral-200 leading-relaxed">
                              {strength.description}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })()}

      {/* Pillar Details - Table Format */}
      <section className="container mx-auto px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-serif text-center mb-3">Your Next Steps</h2>
          <p className="text-neutral-200 text-center mb-10 max-w-2xl mx-auto text-sm md:text-base">
            Focus on these improvements to boost your AI search visibility.
          </p>

          <div className="space-y-8">
            {pillars.map((pillar) => {
              const info = getPillarInfo(pillar);
              const score = report.scores[pillar.toLowerCase() as keyof typeof report.scores];
              const recommendations = report.recommendationsByPillar[pillar] || [];
              const summary = report.pillarSummaries?.[pillar];

              if (recommendations.length === 0) return null;

              return (
                <div key={pillar} className="overflow-hidden">
                  {/* Pillar Header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: info.color }}
                      />
                      <div>
                        <h3 className="text-lg font-semibold" style={{ color: info.color }}>
                          {pillar}
                        </h3>
                        <p className="text-neutral-300 text-xs">{info.tagline}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className="text-2xl font-bold"
                        style={{ color: getScoreColor(score as number) }}
                      >
                        {(score as number).toFixed(1)}
                      </span>
                      <span className="text-neutral-600">/5</span>
                      {summary && (
                        <p className="text-xs text-neutral-500 mt-1">{summary.coveragePercent}% coverage</p>
                      )}
                    </div>
                  </div>

                  {/* Assessment Findings */}
                  {summary && (
                    <div className="mb-6 p-4 bg-neutral-900/50 rounded-lg border border-neutral-800">
                      <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">Assessment Findings</p>
                      <p className="text-sm text-neutral-200 leading-relaxed">{summary.findings}</p>
                    </div>
                  )}

                  {/* Recommendations Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-neutral-800">
                          <th className="py-3 px-4 text-xs font-medium text-neutral-300 uppercase tracking-wider w-1/4">
                            Action
                          </th>
                          <th className="py-3 px-4 text-xs font-medium text-neutral-300 uppercase tracking-wider w-2/5">
                            Description
                          </th>
                          <th className="py-3 px-4 text-xs font-medium text-neutral-300 uppercase tracking-wider w-1/3">
                            Why It Matters
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/50">
                        {recommendations.map((rec, index) => (
                          <tr key={index} className="hover:bg-neutral-900/30 transition-colors">
                            <td className="py-4 px-4">
                              <span className="text-white font-medium text-sm">{rec.title}</span>
                            </td>
                            <td className="py-4 px-4">
                              <p className="text-neutral-200 text-xs leading-relaxed">
                                {rec.description}
                              </p>
                            </td>
                            <td className="py-4 px-4">
                              {rec.why ? (
                                <p className="text-neutral-300 text-xs leading-relaxed italic">
                                  {rec.why}
                                </p>
                              ) : (
                                <span className="text-neutral-500 text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Analysis Details - Data from APIs */}
      {(report.technicalDetails || report.contentDetails || report.authorityDetails || report.measurementDetails) && (
        <section className="container mx-auto px-6 py-12 border-t border-neutral-800">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-serif text-center mb-3">Analysis Details</h2>
            <p className="text-neutral-200 text-center mb-10 max-w-2xl mx-auto text-sm">
              Data collected from real-time API checks and page analysis.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Technical Details */}
              {report.technicalDetails && (
                <div className="bg-neutral-900/50 rounded-xl border border-neutral-800 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">Technical</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    {report.technicalDetails.performanceScore !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">Performance (PSI)</span>
                        <span className={`font-mono font-medium ${report.technicalDetails.performanceScore >= 90 ? 'text-green-400' : report.technicalDetails.performanceScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {report.technicalDetails.performanceScore}/100
                        </span>
                      </div>
                    )}
                    {report.technicalDetails.accessibilityScore !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">Accessibility (PSI)</span>
                        <span className={`font-mono font-medium ${report.technicalDetails.accessibilityScore >= 90 ? 'text-green-400' : report.technicalDetails.accessibilityScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {report.technicalDetails.accessibilityScore}/100
                        </span>
                      </div>
                    )}
                    {report.technicalDetails.seoScore !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">SEO (PSI)</span>
                        <span className={`font-mono font-medium ${report.technicalDetails.seoScore >= 90 ? 'text-green-400' : report.technicalDetails.seoScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {report.technicalDetails.seoScore}/100
                        </span>
                      </div>
                    )}
                    {report.technicalDetails.coreWebVitals && (
                      <>
                        <div className="pt-2 border-t border-neutral-800">
                          <span className="text-xs text-neutral-500 uppercase tracking-wider">Core Web Vitals</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-neutral-400">LCP</span>
                          <span className={`font-mono font-medium ${report.technicalDetails.coreWebVitals.lcp <= 2500 ? 'text-green-400' : report.technicalDetails.coreWebVitals.lcp <= 4000 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {(report.technicalDetails.coreWebVitals.lcp / 1000).toFixed(1)}s
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-neutral-400">FCP</span>
                          <span className={`font-mono font-medium ${report.technicalDetails.coreWebVitals.fcp <= 1800 ? 'text-green-400' : report.technicalDetails.coreWebVitals.fcp <= 3000 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {(report.technicalDetails.coreWebVitals.fcp / 1000).toFixed(1)}s
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-neutral-400">CLS</span>
                          <span className={`font-mono font-medium ${report.technicalDetails.coreWebVitals.cls <= 0.1 ? 'text-green-400' : report.technicalDetails.coreWebVitals.cls <= 0.25 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {report.technicalDetails.coreWebVitals.cls.toFixed(3)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-neutral-400">TBT</span>
                          <span className={`font-mono font-medium ${report.technicalDetails.coreWebVitals.tbt <= 200 ? 'text-green-400' : report.technicalDetails.coreWebVitals.tbt <= 600 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {report.technicalDetails.coreWebVitals.tbt}ms
                          </span>
                        </div>
                      </>
                    )}
                    {report.technicalDetails.sslValid !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">SSL Certificate</span>
                        <span className={`font-mono font-medium ${report.technicalDetails.sslValid ? 'text-green-400' : 'text-red-400'}`}>
                          {report.technicalDetails.sslValid ? `Valid (${report.technicalDetails.sslDaysRemaining}d)` : 'Invalid'}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-400">Sitemap</span>
                      <span className={`font-mono font-medium ${report.technicalDetails.sitemapFound ? 'text-green-400' : 'text-neutral-500'}`}>
                        {report.technicalDetails.sitemapFound ? (report.technicalDetails.sitemapUrlCount ? `Found (${report.technicalDetails.sitemapUrlCount} URLs)` : 'Found') : 'Not found'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-400">robots.txt</span>
                      <span className={`font-mono font-medium ${report.technicalDetails.robotsTxtFound ? 'text-green-400' : 'text-neutral-500'}`}>
                        {report.technicalDetails.robotsTxtFound ? 'Found' : 'Not found'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-400">llms.txt</span>
                      <span className={`font-mono font-medium ${report.technicalDetails.llmsTxtFound ? 'text-green-400' : 'text-neutral-500'}`}>
                        {report.technicalDetails.llmsTxtFound ? 'Found' : 'Not found'}
                      </span>
                    </div>
                    {report.technicalDetails.aiBotsCrawlable !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">AI Bots Crawlable</span>
                        <span className={`font-mono font-medium ${report.technicalDetails.aiBotsCrawlable ? 'text-green-400' : 'text-red-400'}`}>
                          {report.technicalDetails.aiBotsCrawlable ? 'Yes' : 'Blocked'}
                        </span>
                      </div>
                    )}
                    {report.technicalDetails.blockedAiBots && report.technicalDetails.blockedAiBots.length > 0 && (
                      <div className="pt-1">
                        <span className="text-xs text-red-400">Blocked: {report.technicalDetails.blockedAiBots.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Content Details */}
              {report.contentDetails && (
                <div className="bg-neutral-900/50 rounded-xl border border-neutral-800 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Content</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    {report.contentDetails.readabilityScore !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">Readability (Flesch)</span>
                        <span className={`font-mono font-medium ${report.contentDetails.readabilityScore >= 60 && report.contentDetails.readabilityScore <= 75 ? 'text-green-400' : report.contentDetails.readabilityScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {report.contentDetails.readabilityScore}
                        </span>
                      </div>
                    )}
                    {report.contentDetails.readabilityGrade !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">Grade Level</span>
                        <span className="font-mono font-medium text-neutral-200">
                          {report.contentDetails.readabilityGrade}
                        </span>
                      </div>
                    )}
                    {report.contentDetails.mainContentWordCount !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">Main Content Words</span>
                        <span className="font-mono font-medium text-neutral-200">
                          {report.contentDetails.mainContentWordCount.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {report.contentDetails.imageAltCoverage !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">Image Alt Coverage</span>
                        <span className={`font-mono font-medium ${report.contentDetails.imageAltCoverage >= 90 ? 'text-green-400' : report.contentDetails.imageAltCoverage >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {report.contentDetails.imageAltCoverage}%
                        </span>
                      </div>
                    )}
                    {report.contentDetails.internalLinkCount !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">Internal Links</span>
                        <span className="font-mono font-medium text-neutral-200">
                          {report.contentDetails.internalLinkCount}
                        </span>
                      </div>
                    )}
                    {report.contentDetails.sectionDensity !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">Section Density</span>
                        <span className={`font-mono font-medium ${report.contentDetails.sectionDensity >= 120 && report.contentDetails.sectionDensity <= 180 ? 'text-green-400' : 'text-yellow-400'}`}>
                          {report.contentDetails.sectionDensity} words/section
                        </span>
                      </div>
                    )}
                    {report.contentDetails.dataPointCount !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">Data Points</span>
                        <span className={`font-mono font-medium ${report.contentDetails.dataPointCount >= 5 ? 'text-green-400' : 'text-neutral-200'}`}>
                          {report.contentDetails.dataPointCount}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Authority Details */}
              {report.authorityDetails && (
                <div className="bg-neutral-900/50 rounded-xl border border-neutral-800 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 rounded-full bg-pink-500" />
                    <h3 className="text-sm font-semibold text-pink-400 uppercase tracking-wider">Authority</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    {report.authorityDetails.knowledgeGraphFound !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">Google Knowledge Graph</span>
                        <span className={`font-mono font-medium ${report.authorityDetails.knowledgeGraphFound ? 'text-green-400' : 'text-neutral-500'}`}>
                          {report.authorityDetails.knowledgeGraphFound ? (report.authorityDetails.knowledgeGraphType ? `Found (${report.authorityDetails.knowledgeGraphType})` : 'Found') : 'Not found'}
                        </span>
                      </div>
                    )}
                    {report.authorityDetails.redditMentions !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">Reddit Mentions</span>
                        <span className={`font-mono font-medium ${report.authorityDetails.redditMentions > 0 ? 'text-green-400' : 'text-neutral-500'}`}>
                          {report.authorityDetails.redditMentions > 0 ? `${report.authorityDetails.redditMentions} posts` : 'None found'}
                        </span>
                      </div>
                    )}
                    {report.authorityDetails.redditSubreddits && report.authorityDetails.redditSubreddits.length > 0 && (
                      <div className="pt-1">
                        <span className="text-xs text-neutral-500">Subreddits: {report.authorityDetails.redditSubreddits.slice(0, 5).map(s => `r/${s}`).join(', ')}</span>
                      </div>
                    )}
                    {report.authorityDetails.socialPlatformCount !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">Social Platforms</span>
                        <span className="font-mono font-medium text-neutral-200">
                          {report.authorityDetails.socialPlatformCount}
                        </span>
                      </div>
                    )}
                    {report.authorityDetails.externalCitationCount !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">External Citations</span>
                        <span className="font-mono font-medium text-neutral-200">
                          {report.authorityDetails.externalCitationCount}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Measurement Details */}
              {report.measurementDetails && (
                <div className="bg-neutral-900/50 rounded-xl border border-neutral-800 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider">Measurement</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    {report.measurementDetails.analyticsTools && report.measurementDetails.analyticsTools.length > 0 && (
                      <div>
                        <span className="text-neutral-400 block mb-1">Analytics</span>
                        <div className="flex flex-wrap gap-1.5">
                          {report.measurementDetails.analyticsTools.map((tool, i) => (
                            <span key={i} className="text-xs bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30">
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {report.measurementDetails.tagManager && (
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">Tag Manager</span>
                        <span className="font-mono font-medium text-green-400">{report.measurementDetails.tagManager}</span>
                      </div>
                    )}
                    {report.measurementDetails.crm && (
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">CRM</span>
                        <span className="font-mono font-medium text-green-400">{report.measurementDetails.crm}</span>
                      </div>
                    )}
                    {report.measurementDetails.heatmapTool && (
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">Heatmap / Session Recording</span>
                        <span className="font-mono font-medium text-green-400">{report.measurementDetails.heatmapTool}</span>
                      </div>
                    )}
                    {report.measurementDetails.cookieConsent && (
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">Cookie Consent</span>
                        <span className="font-mono font-medium text-green-400">{report.measurementDetails.cookieConsent}</span>
                      </div>
                    )}
                    {report.measurementDetails.abTestTool && (
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400">A/B Testing</span>
                        <span className="font-mono font-medium text-green-400">{report.measurementDetails.abTestTool}</span>
                      </div>
                    )}
                    {(!report.measurementDetails.analyticsTools || report.measurementDetails.analyticsTools.length === 0) &&
                     !report.measurementDetails.tagManager &&
                     !report.measurementDetails.crm &&
                     !report.measurementDetails.heatmapTool && (
                      <p className="text-neutral-500 text-xs italic">No measurement tools detected</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Maturity Model */}
      <section className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-serif text-center mb-6">AEO Maturity Model</h2>

          <div className="grid grid-cols-5 gap-2">
            {[
              { level: "Foundation", score: "1.0-1.4", color: "#ef4444" },
              { level: "Emerging", score: "1.5-2.4", color: "#f97316" },
              { level: "Developing", score: "2.5-3.4", color: "#eab308" },
              { level: "Advanced", score: "3.5-4.4", color: "#3b82f6" },
              { level: "Leader", score: "4.5-5.0", color: "#22c55e" },
            ].map((item) => {
              const isActive = report.maturityLevel === item.level;
              return (
                <div
                  key={item.level}
                  className={`p-3 rounded-lg text-center transition-all ${
                    isActive ? "scale-105" : "opacity-50"
                  }`}
                  style={{
                    backgroundColor: `${item.color}15`,
                    border: isActive ? `2px solid ${item.color}` : "1px solid transparent",
                    boxShadow: isActive ? `0 0 20px ${item.color}30` : "none",
                  }}
                >
                  <p className="font-semibold text-xs md:text-sm" style={{ color: item.color }}>
                    {item.level}
                  </p>
                  <p className="text-neutral-500 text-[10px] mt-1 hidden md:block">{item.score}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-neutral-800">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-serif mb-4">
              Ready to Improve Your{" "}
              <span className="text-[#d4a000]">AI Visibility</span>?
            </h2>
            <p className="text-neutral-200 mb-8 text-sm md:text-base">
              Book a free 30-minute strategy call to discuss your results and create an action plan.
            </p>
            <Link
              href="/contact"
              className="inline-block bg-[#d4a000] text-black px-8 py-4 font-semibold hover:bg-[#b38600] transition-colors"
            >
              Book Free Strategy Call
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800 py-6">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-300">
            <p>Report generated on {report.analyzedAt}</p>
            <p>
              © {new Date().getFullYear()} UpClick Labs · hello@upclicklabs.com
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
