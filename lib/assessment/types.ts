// Re-export existing types for backward compatibility
export type {
  AEOScore,
  AEOStrength,
  AEORecommendation,
  PillarSummary,
  AEOReport,
} from "../email-templates";

// Extended report details (new, optional fields)
export interface TechnicalDetails {
  performanceScore?: number; // 0-100 from PSI
  accessibilityScore?: number; // 0-100 from PSI
  seoScore?: number; // 0-100 from PSI
  coreWebVitals?: {
    lcp: number; // Largest Contentful Paint (ms)
    fcp: number; // First Contentful Paint (ms)
    cls: number; // Cumulative Layout Shift
    tbt: number; // Total Blocking Time (ms)
  };
  sslValid?: boolean;
  sslDaysRemaining?: number;
  sitemapFound?: boolean;
  sitemapUrlCount?: number;
  robotsTxtFound?: boolean;
  llmsTxtFound?: boolean;
  aiBotsCrawlable?: boolean;
  blockedAiBots?: string[];
}

export interface ContentDetails {
  readabilityScore?: number; // Flesch Reading Ease (0-100)
  readabilityGrade?: number; // Flesch-Kincaid Grade Level
  imageAltCoverage?: number; // percentage 0-100
  mainContentWordCount?: number;
  internalLinkCount?: number;
  sectionDensity?: number; // avg words per section
  dataPointCount?: number;
  answerFirstRatio?: number; // percentage of sections with answer-first formatting
  extractableRatio?: number; // percentage of paragraphs that are self-contained
}

export interface AuthorityDetails {
  knowledgeGraphFound?: boolean;
  knowledgeGraphType?: string;
  socialPlatformCount?: number;
  externalCitationCount?: number;
  redditMentions?: number;
  redditSubreddits?: string[];
}

export interface MeasurementDetails {
  analyticsTools?: string[];
  tagManager?: string | null;
  crm?: string | null;
  heatmapTool?: string | null;
  cookieConsent?: string | null;
  abTestTool?: string | null;
  aiReferralTracking?: boolean; // tracks traffic from AI platforms
  utmDiscipline?: number | null; // percentage of outbound links with UTM params
  searchConsoleVerified?: boolean; // Google Search Console meta tag present
}

// API result types
export interface PageSpeedResult {
  performanceScore: number;
  accessibilityScore: number;
  seoScore: number;
  bestPracticesScore: number;
  metrics: {
    fcp: number;
    lcp: number;
    cls: number;
    tbt: number;
    speedIndex: number;
  };
  audits: {
    viewport: boolean;
    documentTitle: boolean;
    metaDescription: boolean;
    isIndexable: boolean;
    canonical: boolean;
    imageAlt: { score: number; details: string };
    linkText: { score: number; details: string };
  };
}

export interface SSLResult {
  isValid: boolean;
  daysRemaining: number;
}

export interface SitemapResult {
  exists: boolean;
  urlCount?: number;
  hasLastmod?: boolean;
}

export interface RobotsResult {
  exists: boolean;
  hasSitemapDirective: boolean;
  blockedBots: string[];
  allowsAllCrawlers: boolean;
  content: string;
}

export interface LlmsTxtResult {
  exists: boolean;
  content?: string;
}

export interface KnowledgeGraphResult {
  found: boolean;
  name?: string;
  type?: string;
  description?: string;
}

export interface RedditResult {
  hasMentions: boolean;
  postCount: number;
  subreddits: string[];
  recentMentions: number; // posts from last 6 months
}

// Analysis result types used by each pillar analyzer
export interface PillarAnalysis {
  score: number;
  strengths: import("../email-templates").AEOStrength[];
  recommendations: import("../email-templates").AEORecommendation[];
}

export interface ContentAnalysis extends PillarAnalysis {
  details: ContentDetails;
}

export interface TechnicalAnalysis extends PillarAnalysis {
  details: TechnicalDetails;
}

export interface AuthorityAnalysis extends PillarAnalysis {
  details: AuthorityDetails;
}

export interface MeasurementAnalysis extends PillarAnalysis {
  details: MeasurementDetails;
}
