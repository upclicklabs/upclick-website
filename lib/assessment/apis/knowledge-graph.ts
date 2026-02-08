import { KnowledgeGraphResult } from "../types";

export async function searchKnowledgeGraph(query: string): Promise<KnowledgeGraphResult | null> {
  const apiKey = process.env.GOOGLE_KNOWLEDGE_GRAPH_KEY;
  if (!apiKey) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const params = new URLSearchParams({
      query,
      key: apiKey,
      limit: "1",
      indent: "false",
    });

    const response = await fetch(
      `https://kgsearch.googleapis.com/v1/entities:search?${params}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    const items = data.itemListElement;

    if (!items || items.length === 0) {
      return { found: false };
    }

    const entity = items[0]?.result;
    if (!entity) return { found: false };

    // Check result score - low scores mean weak match
    const score = items[0]?.resultScore ?? 0;
    if (score < 10) return { found: false };

    return {
      found: true,
      name: entity.name,
      type: Array.isArray(entity["@type"])
        ? entity["@type"].find((t: string) => t !== "Thing") || entity["@type"][0]
        : entity["@type"],
      description: entity.description,
    };
  } catch (error) {
    console.log("Knowledge Graph search failed:", error);
    return null;
  }
}
