import { AEOStrength, AEORecommendation } from "../../email-templates";
import {
  AuthorityAnalysis,
  AuthorityDetails,
  KnowledgeGraphResult,
  RedditResult,
} from "../types";
import { ParsedPage, findSchemaByType, JsonLdBlock } from "../cheerio-parser";
import * as cheerio from "cheerio";

interface AuthorityApiData {
  knowledgeGraphData: KnowledgeGraphResult | null;
  redditData: RedditResult;
}

export function analyzeAuthority(
  page: ParsedPage,
  additionalPages: Map<string, ParsedPage>,
  apiData: AuthorityApiData
): AuthorityAnalysis {
  const strengths: AEOStrength[] = [];
  const recommendations: AEORecommendation[] = [];
  let score = 0;

  const { $, jsonLdBlocks, mainContent } = page;
  const { knowledgeGraphData, redditData } = apiData;
  const details: AuthorityDetails = {};

  // Merge all pages for comprehensive analysis
  const all$ = mergeCheerio($, additionalPages);
  let allMainContent = mainContent;
  let allJsonLd: JsonLdBlock[] = [...jsonLdBlocks];
  for (const [, additionalPage] of additionalPages) {
    allMainContent += " " + additionalPage.mainContent;
    allJsonLd.push(...additionalPage.jsonLdBlocks);
  }

  // ─── Author Attribution (0.5 pts) ───
  const authorSchema = findSchemaByType(allJsonLd, "Person");
  const hasAuthorSchema = allJsonLd.some((b) => b.author && typeof b.author === "object");
  const hasAuthorMeta = all$('meta[name="author"]').length > 0;
  const hasAuthorByline = /written by\s+[A-Z]|by\s+[A-Z][a-z]+\s+[A-Z]|author:\s*[A-Z]/i.test(allMainContent);
  const hasAuthorRel = all$('[rel="author"]').length > 0;
  const hasAuthorInfo = hasAuthorSchema || hasAuthorMeta || hasAuthorByline || hasAuthorRel;

  if (hasAuthorInfo) {
    score += 0.5;
    strengths.push({
      category: "Authority",
      title: "Author Attribution",
      description: "Your content includes author information, which builds E-E-A-T (Experience, Expertise, Authority, Trust).",
    });
  } else {
    recommendations.push({
      category: "Authority",
      title: "Add Author Information",
      description: "Include author names and bios on your content. Show their credentials, experience, and expertise. Add Author schema markup.",
      why: "E-E-A-T signals help AI systems evaluate content quality. 96% of AI Overview content comes from sources with verified E-E-A-T.",
    });
  }

  // ─── About Page (0.4 pts) ───
  const hasAboutLink = all$('a[href*="/about"]').length > 0;
  const hasAboutContent = /about us|our story|our team|who we are|our mission/i.test(allMainContent);
  const hasAboutPage = hasAboutLink || hasAboutContent;

  if (hasAboutPage) {
    score += 0.4;
    strengths.push({
      category: "Authority",
      title: "About Page Present",
      description: "Your site has an About page that establishes company credibility.",
    });
  } else {
    recommendations.push({
      category: "Authority",
      title: "Create Comprehensive About Page",
      description: "Create a detailed About page with team expertise, company history, and qualifications.",
      why: "AI systems look for signals that content comes from legitimate, expert sources.",
    });
  }

  // ─── Contact Information (0.35 pts) ───
  const hasContactLink = all$('a[href*="/contact"]').length > 0;
  const hasEmail = all$('a[href^="mailto:"]').length > 0;
  const hasPhone = all$('a[href^="tel:"]').length > 0;
  const hasContactInfo = hasContactLink || hasEmail || hasPhone;

  if (hasContactInfo) {
    score += 0.35;
    strengths.push({
      category: "Authority",
      title: "Contact Information",
      description: "Your site displays contact information, building trust and legitimacy.",
    });
  } else {
    recommendations.push({
      category: "Authority",
      title: "Display Contact Information",
      description: "Make your contact information easily accessible — email, phone, and/or contact form.",
      why: "Legitimate businesses have clear ways to contact them. This is a basic trust signal.",
    });
  }

  // ─── Press/Media Mentions (0.6 pts) ───
  const hasPressSection = /as (seen|featured) (in|on)|press|media|featured in|in the news/i.test(allMainContent);
  const majorMedia = ["forbes", "techcrunch", "wired", "entrepreneur", "inc.com", "business insider",
    "wall street journal", "new york times", "bloomberg", "cnbc", "bbc"];
  const hasMediaLogos = majorMedia.some((m) => allMainContent.toLowerCase().includes(m));

  if (hasPressSection || hasMediaLogos) {
    score += 0.6;
    strengths.push({
      category: "Authority",
      title: "Press/Media Mentions",
      description: "Your site showcases press or media coverage, demonstrating external validation.",
    });
  } else {
    recommendations.push({
      category: "Authority",
      title: "Pursue Press Coverage",
      description: "Seek media coverage and create an 'As Seen In' section. Pitch to industry publications and podcasts.",
      why: "Third-party media mentions are strong authority signals. AI systems prioritize sources cited by trusted publications.",
    });
  }

  // ─── Digital PR Presence (0.5 pts) ───
  const hasDigitalPR = /podcast|webinar|speaking|keynote|conference|summit|appeared on|guest (on|post|author)|featured (guest|speaker)|interview/i.test(allMainContent);

  if (hasDigitalPR) {
    score += 0.5;
    strengths.push({
      category: "Authority",
      title: "Digital PR Presence",
      description: "Your site shows evidence of podcasts, webinars, or speaking engagements.",
    });
  } else {
    recommendations.push({
      category: "Authority",
      title: "Build Digital PR Presence",
      description: "Appear on podcasts, host webinars, speak at conferences. Document these on your site.",
      why: "Active digital PR presence signals to AI that you're a recognized voice in your industry.",
    });
  }

  // ─── Community Engagement (0.25 pts) ───
  const hasCommunityLinks = all$('a[href*="reddit.com"], a[href*="quora.com"], a[href*="stackoverflow.com"]').length > 0;
  const hasCommunityContent = /community|forum|discuss/i.test(allMainContent);

  if (hasCommunityLinks || hasCommunityContent) {
    score += 0.25;
    strengths.push({
      category: "Authority",
      title: "Community Engagement",
      description: "Your site references community platforms where you engage with your audience.",
    });
  } else {
    recommendations.push({
      category: "Authority",
      title: "Engage on Community Platforms",
      description: "Build presence on Reddit, Quora, and industry forums. Answer questions and provide value.",
      why: "Perplexity cites Reddit 6.6% of the time — its #1 source. Being active there increases your AI visibility.",
    });
  }

  // ─── Social Media Presence (0.25 pts) ───
  const socialPlatforms = [
    { name: "Twitter/X", selectors: 'a[href*="twitter.com"], a[href*="x.com"]' },
    { name: "LinkedIn", selectors: 'a[href*="linkedin.com"]' },
    { name: "Facebook", selectors: 'a[href*="facebook.com"]' },
    { name: "Instagram", selectors: 'a[href*="instagram.com"]' },
    { name: "YouTube", selectors: 'a[href*="youtube.com"]' },
  ];

  let socialCount = 0;
  for (const platform of socialPlatforms) {
    if (all$(platform.selectors).length > 0) socialCount++;
  }
  details.socialPlatformCount = socialCount;

  if (socialCount >= 2) {
    score += 0.25;
    strengths.push({
      category: "Authority",
      title: "Social Media Presence",
      description: `Found links to ${socialCount} social platforms, extending your brand presence.`,
    });
  } else {
    recommendations.push({
      category: "Authority",
      title: "Add Social Media Links",
      description: "Link to your active social media profiles (LinkedIn, Twitter/X, YouTube).",
      why: "AI systems aggregate information across the web. Social presence contributes to overall authority.",
    });
  }

  // ─── Credentials (0.25 pts) ───
  const hasCredentials = /certified|certification|credential|accredited|licensed|award-winning|years of experience|\d+\+?\s*years/i.test(allMainContent);

  if (hasCredentials) {
    score += 0.25;
    strengths.push({
      category: "Authority",
      title: "Credentials Displayed",
      description: "Your site showcases credentials, certifications, or experience that establish expertise.",
    });
  }

  // ─── Citations in Content (0.4 pts) ───
  const socialDomains = ["twitter.com", "facebook.com", "linkedin.com", "youtube.com", "instagram.com", "x.com"];
  let externalCitationCount = 0;
  all$('a[href^="http"]').each((_, el) => {
    const href = all$(el).attr("href") || "";
    if (!socialDomains.some((d) => href.includes(d))) {
      externalCitationCount++;
    }
  });
  details.externalCitationCount = Math.min(externalCitationCount, 50);

  const hasCitations = /source:|according to|research (shows|indicates|suggests)|study (shows|found|by)|data from|published in/i.test(allMainContent);

  if (hasCitations || externalCitationCount >= 3) {
    score += 0.4;
    strengths.push({
      category: "Authority",
      title: "Content Citations",
      description: "Your content cites external sources and research, demonstrating credibility.",
    });
  } else {
    recommendations.push({
      category: "Authority",
      title: "Cite Authoritative Sources",
      description: "When making claims, cite reputable sources. Link to research, studies, and authoritative publications.",
      why: "Content that cites credible sources is more likely to be trusted and cited by AI systems.",
    });
  }

  // ─── Reviews (0.5 pts) ───
  const hasReviewSchema = allJsonLd.some(
    (b) => b["@type"] === "Review" || b.aggregateRating || b["@type"] === "AggregateRating"
  );
  const hasReviewPlatform = all$('a[href*="trustpilot"], a[href*="g2.com"], a[href*="capterra"]').length > 0;
  const hasStarRating = /★|(\d+(\.\d+)?)\s*(out of|\/)\s*5\s*(star)?/i.test(allMainContent);

  if (hasReviewSchema || hasReviewPlatform || hasStarRating) {
    score += 0.5;
    strengths.push({
      category: "Authority",
      title: "Reviews Present",
      description: "Your site displays reviews or ratings, providing strong social proof.",
    });
  } else {
    recommendations.push({
      category: "Authority",
      title: "Add Customer Reviews",
      description: "Display customer reviews or link to review platforms (Google Reviews, Trustpilot, G2). Add Review schema.",
      why: "Reviews are a powerful trust signal. AI systems often cite businesses with verified customer feedback.",
    });
  }

  // ─── Testimonials (0.5 pts) ───
  const hasTestimonialSection = all$('[class*="testimonial"], [id*="testimonial"]').length > 0;
  const hasBlockquotes = all$("blockquote").length >= 1;
  const hasClientSays = /what (our|the) (client|customer)s? say|client feedback|customer stories/i.test(allMainContent);

  if (hasTestimonialSection || hasBlockquotes || hasClientSays) {
    score += 0.5;
    strengths.push({
      category: "Authority",
      title: "Testimonials Present",
      description: "Your site includes testimonials that provide social proof and build trust.",
    });
  } else {
    recommendations.push({
      category: "Authority",
      title: "Add Customer Testimonials",
      description: "Feature testimonials from satisfied customers with names, titles, and companies.",
      why: "Testimonials demonstrate real-world success. Expert quotes in content increase citations from 2.4 to 4.1 average.",
    });
  }

  // ─── Case Studies (0.5 pts) ───
  const hasCaseStudyLink = all$('a[href*="case-stud"], a[href*="case_stud"]').length > 0;
  const hasCaseStudyHeading = all$("h1, h2, h3, h4").filter((_, el) => /case.stud/i.test(all$(el).text())).length > 0;
  const hasSuccessStory = /success stor(y|ies)|client results|how we helped|results we.ve delivered/i.test(allMainContent);

  if (hasCaseStudyLink || hasCaseStudyHeading || hasSuccessStory) {
    score += 0.5;
    strengths.push({
      category: "Authority",
      title: "Case Studies/Results",
      description: "Your site features case studies or results, demonstrating real-world expertise.",
    });
  } else {
    recommendations.push({
      category: "Authority",
      title: "Create Case Studies",
      description: "Document client success stories with specific metrics and outcomes.",
      why: "Case studies with data prove your expertise. AI systems prioritize content backed by real results.",
    });
  }

  // ─── NEW: Expert Quotes (0.25 pts) ───
  const blockquoteCount = all$("blockquote").length;
  const hasAttributedQuotes = all$("blockquote cite, blockquote footer, blockquote + p").length > 0;

  if (blockquoteCount >= 2 || hasAttributedQuotes) {
    score += 0.25;
    strengths.push({
      category: "Authority",
      title: "Expert Quotes",
      description: "Your content includes attributed quotes, adding credibility and depth.",
    });
  }

  // ─── NEW: Schema Person Depth (0.25 pts) ───
  // First try to find a dedicated Person schema type
  let authorObj: JsonLdBlock | undefined = findSchemaByType(allJsonLd, "Person");
  // Fallback: extract nested author object from Article/BlogPosting schemas
  if (!authorObj) {
    for (const block of allJsonLd) {
      if (typeof block.author === "object" && block.author !== null && !Array.isArray(block.author)) {
        authorObj = block.author as JsonLdBlock;
        break;
      }
    }
  }

  if (authorObj) {
    const hasJobTitle = !!authorObj.jobTitle;
    const hasSameAs = !!authorObj.sameAs;
    const hasAffiliation = !!authorObj.affiliation;
    const depthSignals = [hasJobTitle, hasSameAs, hasAffiliation].filter(Boolean).length;

    if (depthSignals >= 2) {
      score += 0.25;
      strengths.push({
        category: "Authority",
        title: "Rich Author Schema",
        description: "Author schema includes detailed credentials (job title, affiliations, social profiles).",
      });
    }
  }

  // ─── NEW: Knowledge Graph Presence (0.5 pts) ───
  if (knowledgeGraphData) {
    details.knowledgeGraphFound = knowledgeGraphData.found;
    details.knowledgeGraphType = knowledgeGraphData.type;

    if (knowledgeGraphData.found) {
      score += 0.5;
      strengths.push({
        category: "Authority",
        title: "Knowledge Graph Presence",
        description: `Your brand is recognized in Google's Knowledge Graph as "${knowledgeGraphData.type || "Entity"}" — a strong authority signal.`,
      });
    }
  }

  // ─── NEW: Reddit Brand Presence (0.5 pts) ───
  details.redditMentions = redditData.postCount;
  details.redditSubreddits = redditData.subreddits;

  if (redditData.hasMentions && redditData.postCount >= 3) {
    score += 0.5;
    const subredditInfo = redditData.subreddits.length > 0
      ? ` across subreddits: r/${redditData.subreddits.join(", r/")}`
      : "";
    strengths.push({
      category: "Authority",
      title: "Reddit Brand Presence",
      description: `Found ${redditData.postCount} Reddit posts mentioning your brand${subredditInfo}. Reddit is the #1 cited source by Perplexity and Google AI.`,
    });
  } else if (redditData.hasMentions) {
    score += 0.25;
    strengths.push({
      category: "Authority",
      title: "Some Reddit Presence",
      description: `Found ${redditData.postCount} Reddit mention(s). Building more community engagement would strengthen AI visibility.`,
    });
  } else {
    recommendations.push({
      category: "Authority",
      title: "Build Reddit Presence",
      description: "Engage on Reddit — answer questions in relevant subreddits, participate in discussions, and build authentic community presence.",
      why: "Reddit is the #1 cited source by Perplexity (6.6%) and Google AI Overviews (2.2%). Active Reddit presence significantly boosts AI visibility.",
    });
  }

  // ─── Wikipedia (recommend if no Knowledge Graph presence) ───
  if (!knowledgeGraphData?.found) {
    recommendations.push({
      category: "Authority",
      title: "Build Wikipedia Presence",
      description: "Work toward getting cited on relevant Wikipedia articles through sustained media coverage and notability.",
      why: "Wikipedia is cited disproportionately by all major LLMs. Being mentioned there significantly boosts AI visibility.",
    });
  }

  return {
    score: Math.min(score, 5),
    strengths,
    recommendations,
    details,
  };
}

function mergeCheerio(
  primary$: cheerio.CheerioAPI,
  additionalPages: Map<string, ParsedPage>
): cheerio.CheerioAPI {
  if (additionalPages.size === 0) return primary$;
  let combinedHtml = primary$.html() || "";
  for (const [, page] of additionalPages) {
    combinedHtml += page.$.html() || "";
  }
  return cheerio.load(combinedHtml);
}
