import { RedditResult } from "../types";

// Reddit search via public JSON API (no auth required)
export async function searchRedditMentions(brand: string): Promise<RedditResult> {
  const empty: RedditResult = {
    hasMentions: false,
    postCount: 0,
    subreddits: [],
    recentMentions: 0,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    // Use Reddit's public search JSON endpoint
    const query = encodeURIComponent(brand);
    const response = await fetch(
      `https://www.reddit.com/search.json?q=${query}&sort=relevance&limit=10&t=year`,
      {
        signal: controller.signal,
        headers: {
          "User-Agent": "UpClickLabs-AEO-Analyzer/2.0",
        },
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.log(`Reddit search returned ${response.status}`);
      return empty;
    }

    const data = await response.json();
    const posts = data?.data?.children;

    if (!posts || posts.length === 0) {
      return empty;
    }

    // Extract subreddits and count mentions
    const subreddits = new Set<string>();
    let recentMentions = 0;
    const sixMonthsAgo = Date.now() / 1000 - 6 * 30 * 24 * 60 * 60;

    for (const post of posts) {
      const postData = post.data;
      if (postData.subreddit) {
        subreddits.add(postData.subreddit);
      }
      if (postData.created_utc > sixMonthsAgo) {
        recentMentions++;
      }
    }

    return {
      hasMentions: posts.length > 0,
      postCount: posts.length,
      subreddits: Array.from(subreddits).slice(0, 5),
      recentMentions,
    };
  } catch (error) {
    console.log("Reddit search failed:", error);
    return empty;
  }
}
