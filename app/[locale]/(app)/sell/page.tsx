import { redirect } from 'next/navigation';
import { getCurrentDraft } from '@/lib/listings/queries';

/**
 * /sell entry — redirects to the user's current draft step, or Step 1 if no
 * draft exists. Owner-only (guarded by (app) layout).
 */
export default async function SellEntry({ params }: { params: { locale: string } }) {
  const locale = params.locale === 'en' ? 'en' : 'ar';
  const draft = await getCurrentDraft();
  const step = draft?.current_step ?? 'category';
  redirect(`/${locale}/sell/${step}`);
}
