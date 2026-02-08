import { AEOStrength, AEORecommendation } from "../../email-templates";
import { MeasurementAnalysis, MeasurementDetails } from "../types";
import { ParsedPage } from "../cheerio-parser";

export function analyzeMeasurement(page: ParsedPage): MeasurementAnalysis {
  const strengths: AEOStrength[] = [];
  const recommendations: AEORecommendation[] = [];
  let score = 0;

  const { $ } = page;
  const details: MeasurementDetails = {
    analyticsTools: [],
    tagManager: null,
    crm: null,
    heatmapTool: null,
    cookieConsent: null,
    abTestTool: null,
  };

  // Collect all script sources and inline script content for detection
  const scriptSrcs: string[] = [];
  const inlineScripts: string[] = [];

  $("script").each((_, el) => {
    const src = $(el).attr("src") || "";
    if (src) scriptSrcs.push(src.toLowerCase());
    const content = $(el).html() || "";
    if (content.trim()) inlineScripts.push(content);
  });

  const allScriptContent = inlineScripts.join("\n");
  const allSrcs = scriptSrcs.join(" ");

  // ─── Analytics Scripts (1.0 pts) ───
  const analyticsDetections = [
    { name: "GA4", pattern: /gtag.*config|google-analytics|googletagmanager\.com\/gtag/i, srcPattern: /gtag|google-analytics/ },
    { name: "Plausible", pattern: /plausible/i, srcPattern: /plausible/ },
    { name: "Mixpanel", pattern: /mixpanel\.init/i, srcPattern: /mixpanel/ },
    { name: "Amplitude", pattern: /amplitude\.getInstance/i, srcPattern: /amplitude/ },
    { name: "Heap", pattern: /heap\.load/i, srcPattern: /heap/ },
    { name: "Segment", pattern: /analytics\.load/i, srcPattern: /segment\.com|cdn\.segment/ },
    { name: "Fathom", pattern: /fathom/i, srcPattern: /fathom/ },
    { name: "PostHog", pattern: /posthog/i, srcPattern: /posthog/ },
    { name: "Matomo", pattern: /matomo|piwik/i, srcPattern: /matomo|piwik/ },
  ];

  const detectedAnalytics: string[] = [];
  for (const tool of analyticsDetections) {
    if (tool.pattern.test(allScriptContent) || tool.srcPattern.test(allSrcs)) {
      detectedAnalytics.push(tool.name);
    }
  }
  details.analyticsTools = detectedAnalytics;

  if (detectedAnalytics.length > 0) {
    score += 1;
    strengths.push({
      category: "Measurement",
      title: "Analytics Tracking Installed",
      description: `Found: ${detectedAnalytics.join(", ")}. Analytics tracking is the foundation for measuring AI-driven traffic.`,
    });
  } else {
    recommendations.push({
      category: "Measurement",
      title: "Install Analytics Tracking",
      description: "Add analytics tracking (Google Analytics 4, Plausible, etc.) to measure your traffic.",
      why: "You can't improve what you can't measure. Analytics are essential for tracking AI-referred traffic.",
    });
  }

  // ─── Event/Conversion Tracking (0.5 pts) ───
  const hasEventTracking =
    /gtag\s*\(\s*['"]event['"]/i.test(allScriptContent) ||
    /ga\s*\(\s*['"]send['"]\s*,\s*['"]event['"]/i.test(allScriptContent) ||
    /fbq\s*\(\s*['"]track['"]/i.test(allScriptContent) ||
    /analytics\.track\s*\(/i.test(allScriptContent) ||
    /mixpanel\.track\s*\(/i.test(allScriptContent) ||
    /dataLayer\.push\s*\(\s*\{[^}]*['"]event['"]/i.test(allScriptContent);

  if (hasEventTracking) {
    score += 0.5;
    strengths.push({
      category: "Measurement",
      title: "Event Tracking Configured",
      description: "Your site has event tracking for measuring user interactions and conversions.",
    });
  } else {
    recommendations.push({
      category: "Measurement",
      title: "Set Up Event Tracking",
      description: "Configure event tracking for key actions (form submissions, clicks, downloads).",
      why: "Event tracking lets you measure which AI-referred visitors take valuable actions on your site.",
    });
  }

  // ─── NEW: Tag Manager (0.5 pts) ───
  const tagManagerDetections = [
    { name: "GTM", srcPattern: /googletagmanager\.com\/gtm/, contentPattern: /GTM-[A-Z0-9]+/ },
    { name: "Segment", srcPattern: /cdn\.segment\.com/, contentPattern: /analytics\.load\(/ },
    { name: "Tealium", srcPattern: /tealium/, contentPattern: /utag/ },
    { name: "Adobe Launch", srcPattern: /assets\.adobedtm|launch-/, contentPattern: /adobe/i },
  ];

  for (const tm of tagManagerDetections) {
    if (tm.srcPattern.test(allSrcs) || tm.contentPattern.test(allScriptContent)) {
      details.tagManager = tm.name;
      break;
    }
  }

  if (details.tagManager) {
    score += 0.5;
    strengths.push({
      category: "Measurement",
      title: "Tag Manager Detected",
      description: `${details.tagManager} is installed — enabling flexible tracking and measurement management.`,
    });
  }

  // ─── NEW: CRM Tracking (0.25 pts) ───
  const crmDetections = [
    { name: "HubSpot", pattern: /js\.hs-scripts\.com|hs-analytics|hubspot/i },
    { name: "Salesforce", pattern: /salesforce\.com|pardot/i },
    { name: "Intercom", pattern: /intercom\.io|intercomSettings/i },
    { name: "Drift", pattern: /drift\.com|driftt/i },
    { name: "Zendesk", pattern: /zendesk\.com|zopim/i },
    { name: "Freshdesk", pattern: /freshdesk|freshchat/i },
    { name: "Crisp", pattern: /crisp\.chat/i },
    { name: "Klaviyo", pattern: /klaviyo/i },
  ];

  for (const crm of crmDetections) {
    if (crm.pattern.test(allSrcs) || crm.pattern.test(allScriptContent)) {
      details.crm = crm.name;
      break;
    }
  }

  if (details.crm) {
    score += 0.25;
    strengths.push({
      category: "Measurement",
      title: "CRM Integration",
      description: `${details.crm} tracking detected — enabling lead attribution and funnel tracking.`,
    });
  }

  // ─── NEW: Heatmap/Session Recording (0.25 pts) ───
  const heatmapDetections = [
    { name: "Hotjar", pattern: /hotjar|hj\(/i },
    { name: "Microsoft Clarity", pattern: /clarity\.ms/i },
    { name: "Lucky Orange", pattern: /luckyorange/i },
    { name: "FullStory", pattern: /fullstory/i },
    { name: "LogRocket", pattern: /logrocket/i },
    { name: "Mouseflow", pattern: /mouseflow/i },
  ];

  for (const tool of heatmapDetections) {
    if (tool.pattern.test(allSrcs) || tool.pattern.test(allScriptContent)) {
      details.heatmapTool = tool.name;
      break;
    }
  }

  if (details.heatmapTool) {
    score += 0.25;
    strengths.push({
      category: "Measurement",
      title: "User Behavior Analytics",
      description: `${details.heatmapTool} detected — tracking user behavior patterns and engagement.`,
    });
  }

  // ─── NEW: Cookie Consent (0.25 pts) ───
  const consentDetections = [
    { name: "OneTrust", pattern: /onetrust|optanon/i },
    { name: "CookieBot", pattern: /cookiebot|cookieconsent/i },
    { name: "CookieYes", pattern: /cookieyes/i },
    { name: "Osano", pattern: /osano/i },
    { name: "Termly", pattern: /termly\.io/i },
    { name: "iubenda", pattern: /iubenda/i },
  ];

  for (const tool of consentDetections) {
    if (tool.pattern.test(allSrcs) || tool.pattern.test(allScriptContent)) {
      details.cookieConsent = tool.name;
      break;
    }
  }

  if (details.cookieConsent) {
    score += 0.25;
    strengths.push({
      category: "Measurement",
      title: "Cookie Consent Platform",
      description: `${details.cookieConsent} detected — demonstrating privacy compliance.`,
    });
  }

  // ─── NEW: A/B Testing (0.25 pts) ───
  const abTestDetections = [
    { name: "Optimizely", pattern: /optimizely/i },
    { name: "VWO", pattern: /vwo\.com|visualwebsiteoptimizer/i },
    { name: "Convert", pattern: /convert\.com/i },
    { name: "AB Tasty", pattern: /abtasty/i },
    { name: "LaunchDarkly", pattern: /launchdarkly/i },
  ];

  for (const tool of abTestDetections) {
    if (tool.pattern.test(allSrcs) || tool.pattern.test(allScriptContent)) {
      details.abTestTool = tool.name;
      break;
    }
  }

  if (details.abTestTool) {
    score += 0.25;
    strengths.push({
      category: "Measurement",
      title: "A/B Testing Platform",
      description: `${details.abTestTool} detected — enabling data-driven optimization.`,
    });
  }

  // ─── NEW: Performance Monitoring (0.25 pts) ───
  const perfMonitorDetections = [
    { name: "Sentry", pattern: /sentry\.io|@sentry/i },
    { name: "DataDog", pattern: /datadoghq/i },
    { name: "New Relic", pattern: /newrelic|nr-data/i },
    { name: "Bugsnag", pattern: /bugsnag/i },
    { name: "Rollbar", pattern: /rollbar/i },
  ];

  let hasPerfMonitoring = false;
  for (const tool of perfMonitorDetections) {
    if (tool.pattern.test(allSrcs) || tool.pattern.test(allScriptContent)) {
      hasPerfMonitoring = true;
      break;
    }
  }

  if (hasPerfMonitoring) {
    score += 0.25;
    strengths.push({
      category: "Measurement",
      title: "Performance Monitoring",
      description: "Error/performance monitoring detected — indicating engineering maturity.",
    });
  }

  // ─── NEW: Multiple Analytics (0.25 pts) ───
  if (detectedAnalytics.length >= 2) {
    score += 0.25;
    strengths.push({
      category: "Measurement",
      title: "Multi-Platform Analytics",
      description: `${detectedAnalytics.length} analytics platforms detected (${detectedAnalytics.join(", ")}), providing comprehensive measurement.`,
    });
  }

  // ─── NEW: Ad/Conversion Pixels (0.25 pts) ───
  const hasAdPixels =
    /fbq\s*\(/i.test(allScriptContent) ||
    /linkedin.*insight|lnkd\.in|snap\.licdn/i.test(allSrcs) ||
    /ads\.google|googleadservices|gtag.*conversion/i.test(allSrcs + allScriptContent);

  if (hasAdPixels) {
    score += 0.25;
    strengths.push({
      category: "Measurement",
      title: "Conversion Tracking Pixels",
      description: "Ad conversion tracking detected (Facebook, LinkedIn, or Google Ads).",
    });
  }

  // ─── Always-On Recommendations (can't detect from HTML) ───
  recommendations.push({
    category: "Measurement",
    title: "Track AI Platform Traffic",
    description:
      "Set up GA4 custom channel with regex filter for AI referrers: chatgpt.com, perplexity.ai, claude.ai, gemini.google.com, copilot.microsoft.com.",
    why: "AI traffic surged 527% in 2025. ChatGPT drives 78% of AI visits, but Claude has the highest session value ($4.56/visit).",
  });

  recommendations.push({
    category: "Measurement",
    title: "Monitor AI Mentions",
    description:
      "Use tools like Profound, Peec.ai, or Otterly to track how your brand is mentioned in AI responses.",
    why: "Knowing what AI says about your brand helps you correct misinformation and optimize for better citations.",
  });

  recommendations.push({
    category: "Measurement",
    title: "Track AI Share of Voice",
    description:
      "Measure your brand's visibility relative to competitors in AI responses. AI Share of Voice is now the #1 marketing KPI.",
    why: "Brands optimizing AI visibility capture 3.4x more mentions than those who wait.",
  });

  return {
    score: Math.min(score, 5),
    strengths,
    recommendations,
    details,
  };
}
