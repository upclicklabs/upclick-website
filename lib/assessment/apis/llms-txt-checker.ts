import { LlmsTxtResult } from "../types";

export async function fetchLlmsTxt(baseUrl: string): Promise<LlmsTxtResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${baseUrl}/llms.txt`, {
      signal: controller.signal,
      headers: { "User-Agent": "UpClickLabs-AEO-Analyzer/2.0" },
    });

    clearTimeout(timeoutId);

    if (!response.ok) return { exists: false };

    const content = await response.text();
    // Basic validation: should be a text file, not an error page
    if (content.includes("<html") || content.length < 10) {
      return { exists: false };
    }

    return { exists: true, content };
  } catch {
    return { exists: false };
  }
}
