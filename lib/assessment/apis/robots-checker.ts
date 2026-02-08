import { RobotsResult } from "../types";

const AI_BOT_NAMES = [
  "GPTBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "PerplexityBot",
  "Google-Extended",
  "CCBot",
  "cohere-ai",
  "anthropic-ai",
];

export async function fetchRobotsTxt(baseUrl: string): Promise<RobotsResult> {
  const empty: RobotsResult = {
    exists: false,
    hasSitemapDirective: false,
    blockedBots: [],
    allowsAllCrawlers: true,
    content: "",
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${baseUrl}/robots.txt`, {
      signal: controller.signal,
      headers: { "User-Agent": "UpClickLabs-AEO-Analyzer/2.0" },
    });

    clearTimeout(timeoutId);
    if (!response.ok) return empty;

    const content = await response.text();
    if (!content.toLowerCase().includes("user-agent")) return empty;

    const hasSitemapDirective = /^sitemap:/im.test(content);

    // Check which AI bots are blocked
    const blockedBots = AI_BOT_NAMES.filter((bot) => {
      // Find the User-agent section for this bot
      const regex = new RegExp(
        `User-agent:\\s*${bot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?(?=User-agent:|$)`,
        "i"
      );
      const section = regex.exec(content);
      if (!section) return false;
      return /Disallow:\s*\/\s*$/m.test(section[0]);
    });

    // Check if wildcard blocks everything
    const wildcardSection = /User-agent:\s*\*[\s\S]*?(?=User-agent:|$)/i.exec(content);
    const wildcardBlocksAll = wildcardSection
      ? /Disallow:\s*\/\s*$/m.test(wildcardSection[0])
      : false;

    return {
      exists: true,
      hasSitemapDirective,
      blockedBots,
      allowsAllCrawlers: blockedBots.length === 0 && !wildcardBlocksAll,
      content,
    };
  } catch {
    return empty;
  }
}
