import * as cheerio from "cheerio";
import { AEOStrength, AEORecommendation } from "../../email-templates";
import { ContentAnalysis, ContentDetails } from "../types";
import { ParsedPage, countWords } from "../cheerio-parser";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const textReadability = require("text-readability");

export function analyzeContent(
  page: ParsedPage,
  additionalPages: Map<string, ParsedPage>
): ContentAnalysis {
  const strengths: AEOStrength[] = [];
  const recommendations: AEORecommendation[] = [];
  let score = 0;

  const { $, mainContent, jsonLdBlocks } = page;
  const details: ContentDetails = {};

  // Combine all page content for comprehensive analysis
  let allMainContent = mainContent;
  for (const [, additionalPage] of additionalPages) {
    allMainContent += " " + additionalPage.mainContent;
  }

  // Merge all Cheerio docs for link/heading analysis
  const all$ = mergeCheerio($, additionalPages);

  // ─── FAQ Detection (1.0 pts) ───
  const hasFaqSchema = jsonLdBlocks.some(
    (b) => b["@type"] === "FAQPage" || b["@type"] === "QAPage"
  );
  const hasFaqHeading = all$("h1, h2, h3, h4")
    .filter((_, el) => {
      const text = all$(el).text().toLowerCase();
      return text.includes("faq") || text.includes("frequently asked") || text.includes("common questions");
    })
    .length > 0;
  const hasDetailsElements = all$("details summary").length >= 2;
  const hasFaqSection = all$("section, div")
    .filter((_, el) => {
      const id = (all$(el).attr("id") || "").toLowerCase();
      const cls = (all$(el).attr("class") || "").toLowerCase();
      return id.includes("faq") || cls.includes("faq");
    })
    .length > 0;

  const hasFAQs = hasFaqSchema || hasFaqHeading || hasDetailsElements || hasFaqSection;

  if (hasFAQs) {
    score += 1;
    strengths.push({
      category: "Content",
      title: "FAQ Section Found",
      description: "Your site has FAQ content that AI systems love to cite when answering questions.",
    });
  } else {
    recommendations.push({
      category: "Content",
      title: "Add an FAQ Section",
      description:
        "Create a dedicated FAQ section answering the top 10 questions your customers ask. Use <details>/<summary> HTML elements or FAQ Schema markup. AI systems frequently cite FAQ content.",
      why: "95% of ChatGPT citations point to pages with well-structured Q&A content.",
    });
  }

  // ─── Heading Structure (0.75 pts) ───
  const h1Count = all$("h1").length;
  const h2Count = all$("h2").length;
  const h3Count = all$("h3").length;
  const hasStructuredHeadings = h1Count >= 1 && h2Count >= 2;

  if (hasStructuredHeadings) {
    score += 0.75;
    strengths.push({
      category: "Content",
      title: "Good Heading Structure",
      description: `Your pages have ${h1Count} H1, ${h2Count} H2, and ${h3Count} H3 headings — this helps AI understand your content hierarchy.`,
    });
  } else {
    recommendations.push({
      category: "Content",
      title: "Improve Heading Hierarchy",
      description:
        "Use a clear heading structure (H1 → H2 → H3) to organize your content. Each heading should clearly describe the section below it.",
      why: "Clear headings help AI systems extract and cite specific sections of your content.",
    });
  }

  // ─── Content Length (0.5-1.0 pts) ───
  const mainWordCount = countWords(allMainContent);
  details.mainContentWordCount = mainWordCount;

  if (mainWordCount > 1500) {
    score += 1;
    strengths.push({
      category: "Content",
      title: "Comprehensive Content",
      description: `Your site has substantial content (~${Math.round(mainWordCount / 100) * 100} words of main content) which signals depth and authority.`,
    });
  } else if (mainWordCount > 800) {
    score += 0.5;
    strengths.push({
      category: "Content",
      title: "Good Content Length",
      description: `Your site has ~${Math.round(mainWordCount / 100) * 100} words of main content. Expanding to 1500+ words can improve AI citation rates.`,
    });
  } else {
    recommendations.push({
      category: "Content",
      title: "Add More Quality Content",
      description:
        "Your pages need more substantial content. Focus on answering the full journey of questions a visitor might have.",
      why: "Pages with thin content rarely get cited by AI. Aim for at least 1000 words of valuable information.",
    });
  }

  // ─── Meta Description (0.5 pts) ───
  const metaDesc = all$('meta[name="description"]').attr("content") || "";
  const hasMetaDescription = metaDesc.length > 0;

  if (hasMetaDescription) {
    score += 0.5;
    const descLength = metaDesc.length;
    if (descLength >= 120 && descLength <= 160) {
      strengths.push({
        category: "Content",
        title: "Meta Description Present",
        description: `Meta description found (${descLength} chars) — well within the recommended 120-160 character range.`,
      });
    } else {
      strengths.push({
        category: "Content",
        title: "Meta Description Present",
        description: `Meta description found (${descLength} chars). ${descLength < 120 ? "Consider expanding to 120-160 chars." : "Consider trimming to under 160 chars."}`,
      });
    }
  } else {
    recommendations.push({
      category: "Content",
      title: "Add Meta Descriptions",
      description:
        "Add a clear meta description (120-160 characters) summarizing what each page covers.",
      why: "Meta descriptions help AI systems quickly understand what your page covers.",
    });
  }

  // ─── Question-Format Headings (0.5 pts) ───
  let questionHeadingCount = 0;
  all$("h1, h2, h3, h4").each((_, el) => {
    const text = all$(el).text();
    if (text.includes("?")) questionHeadingCount++;
  });
  const hasQuestionAnswerFormat =
    questionHeadingCount > 0 ||
    (/what is/i.test(allMainContent) && /how (to|do|does)/i.test(allMainContent));

  if (hasQuestionAnswerFormat) {
    score += 0.5;
    strengths.push({
      category: "Content",
      title: "Question-Based Content",
      description: "Your content uses question-answer formatting that aligns with how people ask AI assistants.",
    });
  } else {
    recommendations.push({
      category: "Content",
      title: "Use Question-Format Headings",
      description:
        "Structure some headings as questions (e.g., 'What is AEO?', 'How does it work?'). This matches how people query AI.",
      why: "AI systems look for content that directly answers the questions users are asking.",
    });
  }

  // ─── Table of Contents (0.25 pts) ───
  const hasTocElement = all$('[class*="toc"], [id="toc"], [class*="table-of-contents"]').length > 0;
  const hasTocHeading = all$("h2, h3, h4")
    .filter((_, el) => /table of contents|contents|in this article/i.test(all$(el).text()))
    .length > 0;
  const anchorLinks = all$('a[href^="#"]').length;
  const hasTableOfContents = hasTocElement || hasTocHeading || anchorLinks >= 5;

  if (hasTableOfContents) {
    score += 0.25;
    strengths.push({
      category: "Content",
      title: "Table of Contents",
      description: "Your page includes a table of contents, helping both readers and AI navigate your content.",
    });
  }

  // ─── Summary Snippets (0.25 pts) ───
  const hasSummary = all$("h1, h2, h3, h4, p")
    .filter((_, el) => {
      const text = all$(el).text().toLowerCase();
      return (
        text.includes("in summary") ||
        text.includes("key takeaway") ||
        text.includes("tl;dr") ||
        text.includes("tldr") ||
        text.includes("bottom line")
      );
    })
    .length > 0;

  if (hasSummary) {
    score += 0.25;
    strengths.push({
      category: "Content",
      title: "Summary Sections",
      description: "Your content includes summary sections that AI can easily extract and cite.",
    });
  }

  // ─── Last Updated Date (0.25 pts) ───
  const hasDateModified = jsonLdBlocks.some((b) => b.dateModified || b.datePublished);
  const hasTimeElement = all$("time[datetime]").length > 0;
  const hasLastUpdatedText = /last updated|updated on|modified/i.test(allMainContent);
  const hasLastUpdated = hasDateModified || hasTimeElement || hasLastUpdatedText;

  if (hasLastUpdated) {
    score += 0.25;
    strengths.push({
      category: "Content",
      title: "Content Freshness Signals",
      description: "Your content shows when it was last updated — AI systems prefer fresh, current content.",
    });
  } else {
    recommendations.push({
      category: "Content",
      title: "Show Last Updated Dates",
      description:
        "Add visible 'Last Updated' dates and dateModified in schema markup. AI systems heavily favor recent content.",
      why: "65% of AI citations go to content published in the last year. 76% of ChatGPT's top-cited pages were updated within the last month.",
    });
  }

  // ─── Structured Lists (0.25 pts) ───
  const contentLists = all$("main ul, article ul, main ol, article ol, [role='main'] ul, [role='main'] ol");
  const hasLists = contentLists.length > 0 || all$("ul, ol").length > 2;

  if (hasLists) {
    score += 0.25;
    strengths.push({
      category: "Content",
      title: "Structured Lists",
      description: "Your content uses bullet points and/or numbered lists that AI can easily parse and cite.",
    });
  }

  // ─── NEW: Readability Score (0.5 pts) ───
  if (allMainContent.length > 200) {
    try {
      const fleschScore = textReadability.fleschReadingEase(allMainContent);
      const gradeLevel = textReadability.fleschKincaidGrade(allMainContent);
      details.readabilityScore = Math.round(fleschScore * 10) / 10;
      details.readabilityGrade = Math.round(gradeLevel * 10) / 10;

      if (fleschScore >= 60 && fleschScore <= 75) {
        score += 0.5;
        strengths.push({
          category: "Content",
          title: "Optimal Readability",
          description: `Flesch Reading Ease: ${Math.round(fleschScore)} (Grade ${Math.round(gradeLevel)}). This is the sweet spot for AI citation — clear, accessible writing.`,
        });
      } else if (fleschScore >= 50 && fleschScore <= 80) {
        score += 0.25;
        strengths.push({
          category: "Content",
          title: "Good Readability",
          description: `Flesch Reading Ease: ${Math.round(fleschScore)} (Grade ${Math.round(gradeLevel)}). ${fleschScore < 60 ? "Simplifying slightly could improve AI citation rates." : "Slightly more technical depth could help."}`,
        });
      } else {
        recommendations.push({
          category: "Content",
          title: "Improve Readability",
          description: `Your content has a Flesch score of ${Math.round(fleschScore)} (Grade ${Math.round(gradeLevel)}). ${
            fleschScore < 50
              ? "Consider using shorter sentences and simpler words to make content more AI-friendly."
              : "Your content may be too simple — add more depth and technical detail."
          }`,
          why: "Research shows a 31% citation lift when content falls in the Flesch 60-75 range. This is the sweet spot where AI can easily extract and quote your content.",
        });
      }
    } catch {
      // Readability calculation failed, skip
    }
  }

  // ─── NEW: Image Alt Text Coverage (0.25 pts) ───
  const allImages = all$("img");
  const totalImages = allImages.length;
  const imagesWithAlt = allImages.filter((_, el) => {
    const alt = all$(el).attr("alt");
    return !!(alt && alt.trim().length > 0);
  }).length;

  if (totalImages > 0) {
    const altCoverage = Math.round((imagesWithAlt / totalImages) * 100);
    details.imageAltCoverage = altCoverage;

    if (altCoverage >= 90) {
      score += 0.25;
      strengths.push({
        category: "Content",
        title: "Image Alt Text Coverage",
        description: `${altCoverage}% of images have alt text (${imagesWithAlt}/${totalImages}). This improves accessibility and helps AI understand your visual content.`,
      });
    } else {
      recommendations.push({
        category: "Content",
        title: "Add Alt Text to Images",
        description: `Only ${altCoverage}% of images (${imagesWithAlt}/${totalImages}) have alt text. Add descriptive alt text to all images.`,
        why: "Alt text helps AI systems understand and contextualize your visual content, improving overall content quality signals.",
      });
    }
  }

  // ─── NEW: Internal Linking (0.25 pts) ───
  const baseHostname = (() => {
    try {
      const canonical = page.$('link[rel="canonical"]').attr("href") || "";
      if (canonical) return new URL(canonical).hostname;
      return "";
    } catch { return ""; }
  })();

  let internalLinkCount = 0;
  all$("main a[href], article a[href], [role='main'] a[href]").each((_, el) => {
    const href = all$(el).attr("href") || "";
    if (href.startsWith("/") || (baseHostname && href.includes(baseHostname))) {
      internalLinkCount++;
    }
  });
  details.internalLinkCount = internalLinkCount;

  if (internalLinkCount >= 5) {
    score += 0.25;
    strengths.push({
      category: "Content",
      title: "Internal Linking",
      description: `Found ${internalLinkCount} internal links in content areas, helping AI understand your site structure.`,
    });
  } else {
    recommendations.push({
      category: "Content",
      title: "Improve Internal Linking",
      description: "Add more internal links between related content pages with descriptive anchor text.",
      why: "Internal links help AI systems discover and understand the relationship between your content.",
    });
  }

  // ─── NEW: Data/Statistics Presence (0.25 pts) ───
  const dataPointPattern = /\d+(\.\d+)?%|\d{1,3}(,\d{3})+|\$\d+|\d+x\b/g;
  const dataPoints = allMainContent.match(dataPointPattern) || [];
  details.dataPointCount = dataPoints.length;

  if (dataPoints.length >= 5) {
    score += 0.25;
    strengths.push({
      category: "Content",
      title: "Data-Backed Content",
      description: `Your content includes ${dataPoints.length} data points/statistics. Data-rich content gets 40% more AI citations.`,
    });
  } else {
    recommendations.push({
      category: "Content",
      title: "Add Statistics and Data",
      description: "Include specific numbers, percentages, and statistics to back up your claims. Aim for 10+ data points per page.",
      why: "Pages with 19+ data points average 5.4 AI citations vs 2.8 without. Statistics make content 40% more likely to be cited.",
    });
  }

  // ─── NEW: Content Format Detection (0.25 pts) ───
  const hasTables = all$("main table, article table").length > 0;
  const hasSteps = /step \d|step-by-step/i.test(allMainContent);
  const hasComparisons = all$("main table th, article table th").length >= 2 || /vs\.?\s|versus|compared to|comparison/i.test(allMainContent);

  if (hasTables || hasSteps || hasComparisons) {
    score += 0.25;
    const formats = [];
    if (hasTables) formats.push("tables");
    if (hasSteps) formats.push("step-by-step guides");
    if (hasComparisons) formats.push("comparisons");
    strengths.push({
      category: "Content",
      title: "Structured Content Formats",
      description: `Your content uses ${formats.join(", ")} — these formats get 2.5x more AI citations than unstructured text.`,
    });
  }

  // ─── NEW: Section Density (0.25 pts) ───
  const headings = all$("h2, h3");
  if (headings.length >= 3 && mainWordCount > 300) {
    const avgWordsPerSection = Math.round(mainWordCount / (headings.length + 1));
    details.sectionDensity = avgWordsPerSection;

    if (avgWordsPerSection >= 100 && avgWordsPerSection <= 200) {
      score += 0.25;
      strengths.push({
        category: "Content",
        title: "Optimal Section Length",
        description: `Average section length: ~${avgWordsPerSection} words. The optimal range (120-180 words) makes content easy for AI to extract.`,
      });
    }
  }

  // ─── NEW: Answer-First Formatting (0.5 pts) ───
  // Check if content leads with direct answers before elaboration
  // AI systems strongly prefer content that starts with the answer
  let answerFirstCount = 0;
  let sectionCount = 0;
  all$("h2, h3").each((_, el) => {
    sectionCount++;
    const heading = all$(el);
    // Get the first paragraph or text node after this heading
    const nextP = heading.next("p");
    if (nextP.length > 0) {
      const firstParagraph = nextP.text().trim();
      const words = firstParagraph.split(/\s+/);
      // Answer-first: paragraph starts with a definitive statement (not a question,
      // not "In this section...", not a vague intro). Check for definitional patterns.
      const isAnswerFirst =
        words.length >= 5 &&
        words.length <= 120 && // reasonable first paragraph length
        !firstParagraph.endsWith("?") &&
        !/^(in this (section|article|guide|post))/i.test(firstParagraph) &&
        !/^(let's (talk|discuss|explore|look|dive))/i.test(firstParagraph) &&
        !/^(we('ll| will) (discuss|explore|cover|look))/i.test(firstParagraph) &&
        (/\bis\b|\bare\b|\bcan\b|\bshould\b|\bmeans?\b|\brefers?\sto\b|\binvolves?\b/i.test(
          words.slice(0, 8).join(" ")
        ) ||
          /^\d/.test(firstParagraph) || // starts with a number/stat
          /^(yes|no)\b/i.test(firstParagraph)); // direct yes/no answer
      if (isAnswerFirst) answerFirstCount++;
    }
  });

  if (sectionCount >= 2) {
    const answerFirstRatio = answerFirstCount / sectionCount;
    details.answerFirstRatio = Math.round(answerFirstRatio * 100);

    if (answerFirstRatio >= 0.5) {
      score += 0.5;
      strengths.push({
        category: "Content",
        title: "Answer-First Content Structure",
        description: `${Math.round(answerFirstRatio * 100)}% of sections lead with a direct answer. AI systems strongly prefer content that gives the answer upfront.`,
      });
    } else if (answerFirstRatio >= 0.25) {
      score += 0.25;
      strengths.push({
        category: "Content",
        title: "Some Answer-First Content",
        description: `${Math.round(answerFirstRatio * 100)}% of sections lead with answers. Aim for 50%+ for better AI citation rates.`,
      });
    } else {
      recommendations.push({
        category: "Content",
        title: "Use Answer-First Formatting",
        description:
          "Start each content section with a direct, concise answer before providing context and elaboration. Lead with 'X is...' rather than 'In this section, we explore...'.",
        why: "AI models extract the first 1-2 sentences of each section. Answer-first content is 3x more likely to be quoted in AI responses.",
      });
    }
  }

  // ─── NEW: Paragraph Extractability (0.5 pts) ───
  // Check if paragraphs can stand alone without surrounding context
  let extractableCount = 0;
  let totalParagraphs = 0;
  const backwardRefPattern = /^(as (mentioned|noted|discussed|stated|described) (above|earlier|previously|before))|^(this (is|means|refers|shows|demonstrates|indicates))|^(the (above|aforementioned|previous|preceding))|^(these |those )|^(such |said )|^(it (is|was|has|can|should|will) )/i;

  all$("main p, article p, [role='main'] p").each((_, el) => {
    const text = all$(el).text().trim();
    if (text.length < 30) return; // skip tiny fragments
    totalParagraphs++;

    const hasBackwardRef = backwardRefPattern.test(text);
    const hasAmbiguousPronounStart = /^(he |she |they |we |it )/i.test(text) && !/^(it is |it's |it can |it should )/i.test(text);

    if (!hasBackwardRef && !hasAmbiguousPronounStart) {
      extractableCount++;
    }
  });

  if (totalParagraphs >= 3) {
    const extractableRatio = extractableCount / totalParagraphs;
    details.extractableRatio = Math.round(extractableRatio * 100);

    if (extractableRatio >= 0.8) {
      score += 0.5;
      strengths.push({
        category: "Content",
        title: "Highly Extractable Content",
        description: `${Math.round(extractableRatio * 100)}% of paragraphs can be understood without surrounding context — ideal for AI citation.`,
      });
    } else if (extractableRatio >= 0.6) {
      score += 0.25;
      strengths.push({
        category: "Content",
        title: "Mostly Extractable Content",
        description: `${Math.round(extractableRatio * 100)}% of paragraphs are self-contained. Reducing backward references would improve AI citability.`,
      });
    } else {
      recommendations.push({
        category: "Content",
        title: "Make Paragraphs Self-Contained",
        description:
          "Rewrite paragraphs that start with 'As mentioned above', 'This means', 'It is' or similar backward references. Each paragraph should be understandable on its own.",
        why: "AI systems extract individual paragraphs — if yours require context from earlier in the page, they can't be cited accurately.",
      });
    }
  }

  return {
    score: Math.min(score, 5),
    strengths,
    recommendations,
    details,
  };
}

// Merge multiple Cheerio documents for comprehensive analysis
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
