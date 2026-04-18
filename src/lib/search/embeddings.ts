import OpenAI from 'openai';

/**
 * Produce a 1536-dim embedding for a free-text query.
 *
 * Short queries (<500 chars) so no batching / truncation is needed. Failure
 * returns `null` — callers fall back to keyword-only search.
 */
export async function embedQuery(query: string): Promise<number[] | null> {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!query.trim()) return null;

  try {
    const openai = new OpenAI();
    const { data } = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query.slice(0, 500),
    });
    return data[0].embedding;
  } catch (err) {
    console.error('[search/embeddings] failed:', (err as Error).message);
    return null;
  }
}
