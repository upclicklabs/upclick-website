export interface AEOScore {
  content: number;
  technical: number;
  authority: number;
  measurement: number;
  overall: number;
}

export interface AEOStrength {
  category: string;
  title: string;
  description: string;
}

export interface AEORecommendation {
  category: string;
  title: string;
  description: string;
  why?: string;
  priority?: number; // 1 = highest priority
}

export interface PillarSummary {
  findings: string;
  coveragePercent: number;
  checksPass: number;
  checksTotal: number;
}

export interface AEOReport {
  url: string;
  scores: AEOScore;
  maturityLevel: string;
  maturityDescription: string;
  strengths: AEOStrength[];
  recommendationsByPillar: {
    Content: AEORecommendation[];
    Technical: AEORecommendation[];
    Authority: AEORecommendation[];
    Measurement: AEORecommendation[];
  };
  pillarSummaries?: {
    Content: PillarSummary;
    Technical: PillarSummary;
    Authority: PillarSummary;
    Measurement: PillarSummary;
  };
  topPriorities?: AEORecommendation[];
  analyzedAt: string;
  // Optional detail fields from API-based analysis
  technicalDetails?: {
    performanceScore?: number;
    accessibilityScore?: number;
    seoScore?: number;
    coreWebVitals?: { lcp: number; fcp: number; cls: number; tbt: number };
    sslValid?: boolean;
    sslDaysRemaining?: number;
    sitemapFound?: boolean;
    sitemapUrlCount?: number;
    robotsTxtFound?: boolean;
    llmsTxtFound?: boolean;
    aiBotsCrawlable?: boolean;
    blockedAiBots?: string[];
  };
  contentDetails?: {
    readabilityScore?: number;
    readabilityGrade?: number;
    imageAltCoverage?: number;
    mainContentWordCount?: number;
    internalLinkCount?: number;
    sectionDensity?: number;
    dataPointCount?: number;
  };
  authorityDetails?: {
    knowledgeGraphFound?: boolean;
    knowledgeGraphType?: string;
    socialPlatformCount?: number;
    externalCitationCount?: number;
    redditMentions?: number;
    redditSubreddits?: string[];
  };
  measurementDetails?: {
    analyticsTools?: string[];
    tagManager?: string | null;
    crm?: string | null;
    heatmapTool?: string | null;
    cookieConsent?: string | null;
    abTestTool?: string | null;
  };
}

function getScoreColor(score: number): string {
  if (score >= 4) return "#22c55e";
  if (score >= 3) return "#eab308";
  if (score >= 2) return "#f97316";
  return "#ef4444";
}

function getScoreLabel(score: number): string {
  if (score >= 4.5) return "Excellent";
  if (score >= 3.5) return "Good";
  if (score >= 2.5) return "Fair";
  if (score >= 1.5) return "Needs Work";
  return "Critical";
}

function getMaturityBadgeColor(level: string): string {
  switch (level) {
    case "Authority": return "#22c55e";
    case "Pillar": return "#3b82f6";
    case "Structure": return "#eab308";
    case "Answers": return "#f97316";
    default: return "#ef4444";
  }
}

function getPillarColor(pillar: string): string {
  switch (pillar) {
    case "Content": return "#8b5cf6";
    case "Technical": return "#3b82f6";
    case "Authority": return "#ec4899";
    case "Measurement": return "#f97316";
    default: return "#666";
  }
}

function getPillarEmoji(pillar: string): string {
  switch (pillar) {
    case "Content": return "📝";
    case "Technical": return "⚙️";
    case "Authority": return "🏆";
    case "Measurement": return "📊";
    default: return "•";
  }
}

export function generateAEOReportEmail(report: AEOReport, recipientEmail: string): string {
  const { url, scores, maturityLevel, maturityDescription, strengths, recommendationsByPillar, analyzedAt } = report;

  // Count total recommendations
  const totalRecs = Object.values(recommendationsByPillar).flat().length;
  const hasRecommendations = totalRecs > 0;

  // Build strengths section
  const strengthsHtml = strengths.length > 0 ? `
    <tr>
      <td style="padding: 32px 40px; border-bottom: 1px solid #1f1f1f;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background: linear-gradient(135deg, #052e16 0%, #0a0a0a 100%); border: 1px solid #166534; border-radius: 12px; padding: 24px;">
              <p style="margin: 0 0 16px; color: #22c55e; font-size: 14px; font-weight: 600; letter-spacing: 0.5px;">
                What You're Doing Right
              </p>
              <p style="margin: 0 0 20px; color: #86efac; font-size: 13px; line-height: 1.6; opacity: 0.8;">
                These AEO best practices are helping AI systems find and cite your content.
              </p>
              ${strengths.slice(0, 6).map(s => `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
                <tr>
                  <td width="24" valign="top" style="padding-top: 2px;">
                    <span style="color: #22c55e; font-size: 14px;">✓</span>
                  </td>
                  <td style="padding-left: 8px;">
                    <p style="margin: 0 0 2px; color: #fff; font-size: 13px; font-weight: 600;">${s.title}</p>
                    <p style="margin: 0; color: #a3a3a3; font-size: 12px; line-height: 1.5;">${s.description}</p>
                  </td>
                </tr>
              </table>
              `).join('')}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  ` : '';

  // Build recommendations by pillar
  const pillars: Array<keyof typeof recommendationsByPillar> = ['Content', 'Technical', 'Authority', 'Measurement'];

  const recommendationsHtml = hasRecommendations ? `
    <tr>
      <td style="padding: 32px 40px; border-bottom: 1px solid #1f1f1f;">
        <p style="margin: 0 0 8px; color: #fff; font-size: 20px; font-weight: 700;">
          Your Next Steps
        </p>
        <p style="margin: 0 0 28px; color: #a3a3a3; font-size: 14px; line-height: 1.6;">
          Focus on these improvements to boost your AI search visibility, organized by the four pillars of AEO.
        </p>

        ${pillars.map(pillar => {
          const recs = recommendationsByPillar[pillar];
          if (recs.length === 0) return '';
          const pillarScore = scores[pillar.toLowerCase() as keyof AEOScore];

          return `
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
            <tr>
              <td style="background: #141414; border: 1px solid #262626; border-radius: 12px; overflow: hidden;">
                <!-- Pillar Header -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 16px 20px; background: linear-gradient(135deg, ${getPillarColor(pillar)}15 0%, transparent 100%); border-bottom: 1px solid #262626;">
                      <table width="100%">
                        <tr>
                          <td>
                            <span style="color: ${getPillarColor(pillar)}; font-size: 15px; font-weight: 700;">
                              ${getPillarEmoji(pillar)} ${pillar}
                            </span>
                          </td>
                          <td align="right">
                            <span style="color: ${getScoreColor(pillarScore)}; font-size: 14px; font-weight: 600;">
                              ${pillarScore.toFixed(1)}/5
                            </span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                <!-- Recommendations -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${recs.map((rec, index) => `
                  <tr>
                    <td style="padding: 16px 20px; ${index < recs.length - 1 ? 'border-bottom: 1px solid #1f1f1f;' : ''}">
                      <p style="margin: 0 0 8px; color: #fff; font-size: 14px; font-weight: 600;">${rec.title}</p>
                      <p style="margin: 0; color: #a3a3a3; font-size: 13px; line-height: 1.6;">${rec.description}</p>
                      ${rec.why ? `
                      <p style="margin: 12px 0 0; padding: 10px 12px; background: #0a0a0a; border-left: 2px solid ${getPillarColor(pillar)}; color: #888; font-size: 12px; line-height: 1.5; border-radius: 0 6px 6px 0;">
                        <span style="color: ${getPillarColor(pillar)};">Why this matters:</span> ${rec.why}
                      </p>
                      ` : ''}
                    </td>
                  </tr>
                  `).join('')}
                </table>
              </td>
            </tr>
          </table>
          `;
        }).join('')}
      </td>
    </tr>
  ` : `
    <tr>
      <td style="padding: 40px; text-align: center; border-bottom: 1px solid #1f1f1f;">
        <p style="margin: 0; color: #22c55e; font-size: 18px; font-weight: 600;">
          Excellent! Your site is well-optimized for AI search.
        </p>
        <p style="margin: 12px 0 0; color: #a3a3a3; font-size: 14px;">
          Keep maintaining your content freshness and authority signals.
        </p>
      </td>
    </tr>
  `;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your AEO Assessment Report</title>
</head>
<body style="margin: 0; padding: 0; background-color: #000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="640" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; border: 1px solid #1f1f1f; border-radius: 16px; overflow: hidden;">

          <!-- Hero Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); padding: 48px 40px 40px; text-align: center; border-bottom: 1px solid #1f1f1f;">
              <!-- Logo -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <p style="margin: 0; color: #fff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">UpClick Labs</p>
                    <p style="margin: 4px 0 0; color: #525252; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 500;">AEO Assessment Report</p>
                  </td>
                </tr>
              </table>

              <!-- Score Display -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background: linear-gradient(135deg, #141414 0%, #1a1a1a 100%); border: 2px solid ${getScoreColor(scores.overall)}; border-radius: 50%; width: 140px; height: 140px; text-align: center; vertical-align: middle;">
                          <p style="margin: 0; color: ${getScoreColor(scores.overall)}; font-size: 52px; font-weight: 700; line-height: 1;">${scores.overall.toFixed(1)}</p>
                          <p style="margin: 4px 0 0; color: #666; font-size: 13px; font-weight: 500;">out of 5.0</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Maturity Badge -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                <tr>
                  <td align="center">
                    <span style="display: inline-block; background: ${getMaturityBadgeColor(maturityLevel)}20; border: 1px solid ${getMaturityBadgeColor(maturityLevel)}50; color: ${getMaturityBadgeColor(maturityLevel)}; padding: 10px 24px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; border-radius: 24px;">
                      ${maturityLevel} Level
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Description -->
              <p style="margin: 20px auto 0; color: #a3a3a3; font-size: 14px; line-height: 1.6; max-width: 440px;">
                ${maturityDescription}
              </p>
            </td>
          </tr>

          <!-- PDF Note -->
          <tr>
            <td style="padding: 16px 40px; background: #0f172a; border-bottom: 1px solid #1e3a5f;">
              <table width="100%">
                <tr>
                  <td width="24" valign="top">
                    <span style="color: #3b82f6; font-size: 16px;">📎</span>
                  </td>
                  <td style="padding-left: 12px;">
                    <p style="margin: 0; color: #93c5fd; font-size: 13px; font-weight: 500;">
                      PDF Report Attached
                    </p>
                    <p style="margin: 4px 0 0; color: #64748b; font-size: 12px;">
                      Download the attached PDF for a printable version of this report.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Website Info -->
          <tr>
            <td style="padding: 24px 40px; border-bottom: 1px solid #1f1f1f;">
              <table width="100%">
                <tr>
                  <td>
                    <p style="margin: 0 0 4px; color: #525252; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 500;">Website Analyzed</p>
                    <p style="margin: 0; color: #d4a000; font-size: 15px; font-weight: 500; word-break: break-all;">${url}</p>
                  </td>
                  <td align="right" style="vertical-align: top;">
                    <p style="margin: 0; color: #525252; font-size: 12px;">${analyzedAt}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Score Breakdown -->
          <tr>
            <td style="padding: 32px 40px; border-bottom: 1px solid #1f1f1f;">
              <p style="margin: 0 0 24px; color: #fff; font-size: 18px; font-weight: 700;">Score Breakdown</p>

              <!-- Content -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                <tr>
                  <td width="150">
                    <span style="color: #8b5cf6; font-size: 13px; font-weight: 500;">📝 Content</span>
                    <span style="color: #525252; font-size: 11px;"> (30%)</span>
                  </td>
                  <td style="padding: 0 16px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #1f1f1f; height: 10px; border-radius: 5px;">
                      <tr>
                        <td width="${scores.content * 20}%" style="background: linear-gradient(90deg, #8b5cf6 0%, ${getScoreColor(scores.content)} 100%); border-radius: 5px;"></td>
                        <td></td>
                      </tr>
                    </table>
                  </td>
                  <td width="50" align="right">
                    <span style="color: ${getScoreColor(scores.content)}; font-weight: 700; font-size: 14px;">${scores.content.toFixed(1)}</span>
                  </td>
                </tr>
              </table>

              <!-- Technical -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                <tr>
                  <td width="150">
                    <span style="color: #3b82f6; font-size: 13px; font-weight: 500;">⚙️ Technical</span>
                    <span style="color: #525252; font-size: 11px;"> (25%)</span>
                  </td>
                  <td style="padding: 0 16px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #1f1f1f; height: 10px; border-radius: 5px;">
                      <tr>
                        <td width="${scores.technical * 20}%" style="background: linear-gradient(90deg, #3b82f6 0%, ${getScoreColor(scores.technical)} 100%); border-radius: 5px;"></td>
                        <td></td>
                      </tr>
                    </table>
                  </td>
                  <td width="50" align="right">
                    <span style="color: ${getScoreColor(scores.technical)}; font-weight: 700; font-size: 14px;">${scores.technical.toFixed(1)}</span>
                  </td>
                </tr>
              </table>

              <!-- Authority -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                <tr>
                  <td width="150">
                    <span style="color: #ec4899; font-size: 13px; font-weight: 500;">🏆 Authority</span>
                    <span style="color: #525252; font-size: 11px;"> (25%)</span>
                  </td>
                  <td style="padding: 0 16px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #1f1f1f; height: 10px; border-radius: 5px;">
                      <tr>
                        <td width="${scores.authority * 20}%" style="background: linear-gradient(90deg, #ec4899 0%, ${getScoreColor(scores.authority)} 100%); border-radius: 5px;"></td>
                        <td></td>
                      </tr>
                    </table>
                  </td>
                  <td width="50" align="right">
                    <span style="color: ${getScoreColor(scores.authority)}; font-weight: 700; font-size: 14px;">${scores.authority.toFixed(1)}</span>
                  </td>
                </tr>
              </table>

              <!-- Measurement -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="150">
                    <span style="color: #f97316; font-size: 13px; font-weight: 500;">📊 Measurement</span>
                    <span style="color: #525252; font-size: 11px;"> (20%)</span>
                  </td>
                  <td style="padding: 0 16px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #1f1f1f; height: 10px; border-radius: 5px;">
                      <tr>
                        <td width="${scores.measurement * 20}%" style="background: linear-gradient(90deg, #f97316 0%, ${getScoreColor(scores.measurement)} 100%); border-radius: 5px;"></td>
                        <td></td>
                      </tr>
                    </table>
                  </td>
                  <td width="50" align="right">
                    <span style="color: ${getScoreColor(scores.measurement)}; font-weight: 700; font-size: 14px;">${scores.measurement.toFixed(1)}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Strengths -->
          ${strengthsHtml}

          <!-- Recommendations by Pillar -->
          ${recommendationsHtml}

          <!-- Maturity Model Info -->
          <tr>
            <td style="padding: 32px 40px; border-bottom: 1px solid #1f1f1f; background: linear-gradient(135deg, #0f0f0f 0%, #0a0a0a 100%);">
              <p style="margin: 0 0 16px; color: #fff; font-size: 16px; font-weight: 700;">Understanding the AEO Maturity Model</p>
              <p style="margin: 0 0 20px; color: #737373; font-size: 13px; line-height: 1.6;">
                Your score places you at the <strong style="color: ${getMaturityBadgeColor(maturityLevel)};">${maturityLevel}</strong> level. Here's what each level means:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 12px;">
                ${[
                  { level: "Keywords", score: "1.0-1.4", color: "#ef4444", desc: "Traditional SEO focus, not optimized for AI" },
                  { level: "Answers", score: "1.5-2.4", color: "#f97316", desc: "Beginning to structure content for AI consumption" },
                  { level: "Structure", score: "2.5-3.4", color: "#eab308", desc: "Good technical foundation with organized content" },
                  { level: "Pillar", score: "3.5-4.4", color: "#3b82f6", desc: "Comprehensive topic coverage with strong signals" },
                  { level: "Authority", score: "4.5-5.0", color: "#22c55e", desc: "Industry thought leader, AI actively recommends you" },
                ].map(item => `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #1f1f1f;">
                    <table width="100%">
                      <tr>
                        <td width="80">
                          <span style="color: ${item.color}; font-weight: 600;">${item.level}</span>
                        </td>
                        <td width="60" style="color: #525252; font-size: 11px;">${item.score}</td>
                        <td style="color: #737373;">${item.desc}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                `).join('')}
              </table>
            </td>
          </tr>

          <!-- What is AEO -->
          <tr>
            <td style="padding: 32px 40px; border-bottom: 1px solid #1f1f1f;">
              <p style="margin: 0 0 12px; color: #d4a000; font-size: 15px; font-weight: 700;">What is AEO?</p>
              <p style="margin: 0; color: #a3a3a3; font-size: 13px; line-height: 1.7;">
                <strong style="color: #e5e5e5;">Answer Engine Optimization (AEO)</strong> is the practice of optimizing your content so AI search engines like ChatGPT, Perplexity, Claude, and Google's AI Overviews can find, understand, and cite your brand. Unlike traditional SEO where users click through to your site, AI search engines often provide direct answers - making it crucial that your brand is included in those responses.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 48px 40px; text-align: center; background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); border-bottom: 1px solid #1f1f1f;">
              <p style="margin: 0 0 8px; color: #fff; font-size: 20px; font-weight: 700;">Ready to Improve Your AI Visibility?</p>
              <p style="margin: 0 0 28px; color: #a3a3a3; font-size: 14px; line-height: 1.6; max-width: 400px; margin-left: auto; margin-right: auto;">
                Book a free 30-minute strategy call to discuss your results and create an action plan.
              </p>
              <a href="https://upclicklabs.com/contact" style="display: inline-block; background: linear-gradient(135deg, #d4a000 0%, #b38600 100%); color: #000; padding: 16px 40px; text-decoration: none; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border-radius: 8px; box-shadow: 0 4px 14px rgba(212, 160, 0, 0.3);">Book Free Strategy Call</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; text-align: center;">
              <p style="margin: 0 0 8px; color: #525252; font-size: 13px; font-weight: 500;">
                UpClick Labs
              </p>
              <p style="margin: 0 0 16px; color: #404040; font-size: 12px;">
                Answer Engine Optimization Agency
              </p>
              <p style="margin: 0; color: #404040; font-size: 12px;">
                <a href="mailto:hello@upclicklabs.com" style="color: #525252; text-decoration: none;">hello@upclicklabs.com</a>
                <span style="color: #262626; margin: 0 8px;">|</span>
                <a href="https://upclicklabs.com" style="color: #d4a000; text-decoration: none;">upclicklabs.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
