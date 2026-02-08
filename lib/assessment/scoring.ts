import { AEOStrength, AEORecommendation, PillarSummary } from "../email-templates";

export function getMaturityLevel(score: number): { level: string; description: string } {
  if (score >= 4.5) return {
    level: "Leader",
    description: "Your site is optimized for AI-driven discovery. Focus on maintaining and expanding your presence.",
  };
  if (score >= 3.5) return {
    level: "Advanced",
    description: "You're well-positioned for AI search. A few improvements will help you reach leader status.",
  };
  if (score >= 2.5) return {
    level: "Developing",
    description: "You have a good foundation. Focus on the recommendations below to improve AI visibility.",
  };
  if (score >= 1.5) return {
    level: "Emerging",
    description: "You're starting to optimize for AI search. There's significant room for improvement.",
  };
  return {
    level: "Foundation",
    description: "Your site is optimized for traditional SEO but needs work for AI-driven discovery.",
  };
}

export function calculateOverallScore(
  contentScore: number,
  technicalScore: number,
  authorityScore: number,
  measurementScore: number
): number {
  const overall =
    contentScore * 0.3 +
    technicalScore * 0.25 +
    authorityScore * 0.25 +
    measurementScore * 0.2;
  return Math.round(overall * 10) / 10;
}

export function generatePillarSummaries(
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
): {
  Content: PillarSummary;
  Technical: PillarSummary;
  Authority: PillarSummary;
  Measurement: PillarSummary;
} {
  const hostname = new URL(url).hostname.replace("www.", "");

  const pillarConfig = [
    { name: "Content", score: contentScore, checksTotal: 16 },
    { name: "Technical", score: technicalScore, checksTotal: 14 },
    { name: "Authority", score: authorityScore, checksTotal: 17 },
    { name: "Measurement", score: measurementScore, checksTotal: 11 },
  ] as const;

  const result: Record<string, PillarSummary> = {};

  for (const pillar of pillarConfig) {
    const pillarStrengths = strengths.filter((s) => s.category === pillar.name).length;
    const coveragePercent = Math.round((pillar.score / 5) * 100);

    let findings: string;
    if (pillar.score >= 4) {
      findings = `${hostname} demonstrates excellent ${pillar.name.toLowerCase()} optimization for AI search.`;
    } else if (pillar.score >= 3) {
      findings = `${hostname} shows moderate ${pillar.name.toLowerCase()} maturity for AI search. Some best practices are in place, but there are opportunities for improvement.`;
    } else if (pillar.score >= 2) {
      findings = `${hostname} has basic ${pillar.name.toLowerCase()} foundations but needs improvement for AI visibility.`;
    } else {
      findings = `${hostname} requires substantial ${pillar.name.toLowerCase()} improvements to be visible to AI search engines.`;
    }

    result[pillar.name] = {
      findings,
      coveragePercent,
      checksPass: pillarStrengths,
      checksTotal: pillar.checksTotal,
    };
  }

  return result as {
    Content: PillarSummary;
    Technical: PillarSummary;
    Authority: PillarSummary;
    Measurement: PillarSummary;
  };
}

export function generateTopPriorities(recommendations: {
  Content: AEORecommendation[];
  Technical: AEORecommendation[];
  Authority: AEORecommendation[];
  Measurement: AEORecommendation[];
}): AEORecommendation[] {
  const categoryWeight: Record<string, number> = {
    Content: 1.3,
    Technical: 1.2,
    Authority: 1.1,
    Measurement: 1.0,
  };

  const highPriorityTitles = [
    "Add an FAQ Section",
    "Implement Schema Markup",
    "Add Meta Descriptions",
    "Improve Heading Hierarchy",
    "Add Author Information",
    "Install Analytics Tracking",
    "Enable HTTPS",
    "AI Bots Are Blocked",
  ];

  const allRecs: Array<AEORecommendation & { priorityScore: number }> = [];

  for (const [category, recs] of Object.entries(recommendations)) {
    for (const rec of recs) {
      const weight = categoryWeight[category] || 1;
      const isHighPriority = highPriorityTitles.some((t) =>
        rec.title.toLowerCase().includes(t.toLowerCase())
      );
      allRecs.push({
        ...rec,
        priorityScore: weight * (isHighPriority ? 2 : 1),
        priority: 0,
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
