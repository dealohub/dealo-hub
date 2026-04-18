import OpenAI from 'openai';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Listing embedding generation for semantic search.
 *
 * Called fire-and-forget from `publishListing` after insert — wrapped in
 * try/catch so a transient OpenAI failure never blocks a publish.
 *
 * Budget note: text-embedding-3-small = $0.02 per 1M tokens. A typical
 * listing is ~200 tokens → ~$0.000004 per call. Comfortably under $1/month
 * at launch scale.
 */

const EMBED_MODEL = 'text-embedding-3-small';
const MAX_INPUT_CHARS = 8000;

interface EmbeddableListing {
  title: string;
  description: string;
  brand?: string | null;
  model?: string | null;
  color?: string | null;
  category_name?: string | null;
  subcategory_name?: string | null;
}

function buildSourceText(listing: EmbeddableListing): string {
  return [
    listing.title,
    listing.description,
    listing.brand,
    listing.model,
    listing.color,
    listing.category_name,
    listing.subcategory_name,
  ]
    .filter(Boolean)
    .join(' | ')
    .slice(0, MAX_INPUT_CHARS);
}

export async function generateListingEmbedding(listingId: number | bigint): Promise<void> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('[listings/embeddings] OPENAI_API_KEY missing — skipping embedding for', listingId);
    return;
  }

  const supabase = createAdminClient();

  // Fetch the fields we embed. Admin client because this runs from publish
  // context and we need to bypass RLS on the category join.
  const { data: listing, error } = await supabase
    .from('listings')
    .select(
      `
      title, description, brand, model, color,
      category:categories!listings_category_id_fkey (name_ar, name_en),
      subcategory:categories!listings_subcategory_id_fkey (name_ar, name_en)
    `
    )
    .eq('id', listingId as number)
    .maybeSingle();

  if (error || !listing) {
    console.error('[listings/embeddings] listing fetch failed:', error?.message);
    return;
  }

  // Prefer Arabic names — dominant listing language.
  const categoryName =
    (listing.category as { name_ar?: string } | null)?.name_ar ??
    (listing.category as { name_en?: string } | null)?.name_en ??
    null;
  const subcategoryName =
    (listing.subcategory as { name_ar?: string } | null)?.name_ar ??
    (listing.subcategory as { name_en?: string } | null)?.name_en ??
    null;

  const sourceText = buildSourceText({
    title: listing.title,
    description: listing.description,
    brand: listing.brand,
    model: listing.model,
    color: listing.color,
    category_name: categoryName,
    subcategory_name: subcategoryName,
  });

  if (!sourceText.trim()) return;

  const openai = new OpenAI();

  let embedding: number[];
  try {
    const { data } = await openai.embeddings.create({
      model: EMBED_MODEL,
      input: sourceText,
    });
    embedding = data[0].embedding;
  } catch (err) {
    console.error('[listings/embeddings] OpenAI error:', (err as Error).message);
    return;
  }

  // pgvector accepts `'[0.1,0.2,...]'` string literal form via supabase-js.
  const vectorLiteral = `[${embedding.join(',')}]`;

  const { error: upsertErr } = await supabase.from('listing_embeddings').upsert(
    {
      listing_id: listingId as number,
      embedding: vectorLiteral,
      source_text: sourceText,
      model_version: EMBED_MODEL,
    },
    { onConflict: 'listing_id' }
  );

  if (upsertErr) {
    console.error('[listings/embeddings] upsert error:', upsertErr.message);
  }
}
