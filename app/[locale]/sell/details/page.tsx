import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import WizardShell from '@/components/sell/wizard-shell';
import DetailsForm from '@/components/sell/details-form';
import PropertyDetailsForm from '@/components/sell/property-details-form';
import type { Condition } from '@/lib/listings/validators';
import type { PropertyCategoryKey } from '@/lib/properties/types';

/**
 * /sell/details — Step 3 of the wizard.
 *
 * Branches on the selected category's parent:
 *   parent.slug === 'real-estate' → PropertyDetailsForm (34 fields across
 *                                   7 domains + conditional branches for
 *                                   rent/sale/chalet/off-plan)
 *   otherwise                     → DetailsForm (the generic title + desc
 *                                   + condition + brand/model)
 *
 * Why server-side branch: the sub-cat slug is authoritative for which
 * conditional fields the seller must fill in; fetching it via SSR keeps
 * the client bundle free of a second round-trip and avoids a flash of
 * the wrong form.
 *
 * Reference: planning/PHASE-4A-AUDIT.md §4 (PropertyFields 7 domains);
 *            src/lib/properties/validators.ts (publish-time validator).
 */

const PROPERTY_SUBCATS: ReadonlyArray<PropertyCategoryKey> = [
  'property-for-rent',
  'property-for-sale',
  'rooms-for-rent',
  'land',
  'property-for-exchange',
  'international-property',
  'property-management',
  'realestate-offices',
];

function asPropertySubCat(slug: string | null | undefined): PropertyCategoryKey | null {
  if (!slug) return null;
  return (PROPERTY_SUBCATS as ReadonlyArray<string>).includes(slug)
    ? (slug as PropertyCategoryKey)
    : null;
}

export async function generateMetadata({
  params,
}: {
  params: { locale: 'ar' | 'en' };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'sell.steps.details' });
  return { title: `${t('metaTitle')} · Dealo Hub`, robots: { index: false, follow: false } };
}

export default async function SellDetailsPage({
  params,
}: {
  params: { locale: 'ar' | 'en' };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${params.locale}/signin?next=/${params.locale}/sell/details`);

  const { data: draft } = await supabase
    .from('listing_drafts')
    .select(
      'title, description, condition, brand, model, category_id, image_urls, category_fields',
    )
    .eq('user_id', user.id)
    .maybeSingle();

  // Step order gate: require category + min 5 photos before allowing details
  if (!draft?.category_id) redirect(`/${params.locale}/sell/category`);
  if ((draft.image_urls ?? []).length < 5) redirect(`/${params.locale}/sell/media`);

  // Resolve the category → parent slug to pick the right form variant.
  // Two-step lookup — PostgREST's self-FK embed is unreliable (see
  // queries.ts gotcha comments in landing/chat/listings).
  const { data: catRow } = await supabase
    .from('categories')
    .select('slug, parent_id')
    .eq('id', draft.category_id)
    .maybeSingle();

  let parentSlug: string | null = null;
  const parentId = (catRow as any)?.parent_id as number | null | undefined;
  if (typeof parentId === 'number') {
    const { data: parentRow } = await supabase
      .from('categories')
      .select('slug')
      .eq('id', parentId)
      .maybeSingle();
    parentSlug = ((parentRow as any)?.slug as string | undefined) ?? null;
  }

  const isRealEstate = parentSlug === 'real-estate';
  const subCatSlug = asPropertySubCat((catRow as any)?.slug ?? null);

  return (
    <WizardShell locale={params.locale} step="details">
      {isRealEstate ? (
        <PropertyDetailsForm
          locale={params.locale}
          initial={{
            title: draft.title,
            description: draft.description,
            condition: draft.condition as Condition | null,
            brand: draft.brand,
            model: draft.model,
            fields: (draft.category_fields as Record<string, unknown>) ?? null,
            subCatSlug,
          }}
        />
      ) : (
        <DetailsForm
          locale={params.locale}
          initial={{
            title: draft.title,
            description: draft.description,
            condition: draft.condition as Condition | null,
            brand: draft.brand,
            model: draft.model,
          }}
        />
      )}
    </WizardShell>
  );
}
