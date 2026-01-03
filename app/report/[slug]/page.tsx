"use client";

import { useSearchParams } from "next/navigation";
import { decodeReport } from "@/lib/report-url";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AEOReport } from "@/lib/email-templates";

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

export default function ReportPage() {
  const searchParams = useSearchParams();
  const [report, setReport] = useState<AEOReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const encoded = searchParams.get("d");
    if (encoded) {
      const decoded = decodeReport(encoded);
      if (decoded) {
        setReport(decoded);
      } else {
        setError(true);
      }
    } else {
      setError(true);
    }
    setLoading(false);
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

      {/* Score Breakdown Pills */}
      <section className="border-y border-neutral-800 bg-neutral-950/50">
        <div className="container mx-auto px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {pillars.map((pillar) => {
              const info = getPillarInfo(pillar);
              const score = report.scores[pillar.toLowerCase() as keyof typeof report.scores];
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
                </div>
              );
            })}
          </div>
        </div>
      </section>

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
                    </div>
                  </div>

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
