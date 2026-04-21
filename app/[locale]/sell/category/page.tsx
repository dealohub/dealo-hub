import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import WizardShell from '@/components/sell/wizard-shell';
import CategoryPicker, {
  type CategoryNode,
} from '@/components/sell/category-picker';

/**
 * /sell/category — Step 1 of the wizard.
 *
 * Auth-gated via Supabase session (SSR cookies). Loads the full
 * category tree + the user's existing draft selections in parallel,
 * then renders the picker client component.
 */

export async function generateMetadata({
  params,
}: {
  params: { locale: 'ar' | 'en' };
}): Promise<Metadata> {
  const t = await getTranslations({
    locale: params.locale,
    namespace: 'sell.steps.category',
  });
  return {
    title: `${t('metaTitle')} · Dealo Hub`,
    robots: { index: false, follow: false },
  };
}

export default async function SellCategoryPage({
  params,
}: {
  params: { locale: 'ar' | 'en' };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${params.locale}/signin?next=/${params.locale}/sell/category`);
  }

  // Load categories tree (top-level + children) and current draft in parallel
  const [allCatsRes, draftRes] = await Promise.all([
    supabase
      .from('categories')
      .select('id, slug, name_ar, name_en, parent_id, icon, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('listing_drafts')
      .select('category_id, subcategory_id')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);

  const rows = (allCatsRes.data ?? []) as Array<{
    id: number;
    slug: string;
    name_ar: string;
    name_en: string;
    parent_id: number | null;
    icon: string | null;
    sort_order: number;
  }>;

  // Build tree — only top-level + their children
  const tops = rows.filter(r => r.parent_id === null);
  const categories: CategoryNode[] = tops.map(top => ({
    id: top.id,
    slug: top.slug,
    name: params.locale === 'ar' ? top.name_ar : top.name_en,
    icon: top.icon,
    children: rows
      .filter(r => r.parent_id === top.id)
      .map(child => ({
        id: child.id,
        slug: child.slug,
        name: params.locale === 'ar' ? child.name_ar : child.name_en,
      })),
  }));

  return (
    <WizardShell locale={params.locale} step="category">
      <CategoryPicker
        locale={params.locale}
        categories={categories}
        initialCategoryId={draftRes.data?.category_id ?? null}
        initialSubcategoryId={draftRes.data?.subcategory_id ?? null}
      />
    </WizardShell>
  );
}
