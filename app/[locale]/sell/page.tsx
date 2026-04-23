import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ensureDraftId } from '@/lib/listings/actions';

/**
 * /sell — wizard entry point.
 *
 * 1. Auth gate: redirect to /signin if not signed in.
 * 2. Ensure a draft row exists for this user.
 * 3. Read the draft's current_step and route to that step (resume).
 *    First-time users land on /sell/category.
 *
 * This is a Server Component with no UI — it only routes.
 */

export default async function SellEntryPage(
  props: {
    params: Promise<{ locale: 'ar' | 'en' }>;
  }
) {
  const params = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${params.locale}/signin?next=/${params.locale}/sell`);
  }

  const draftResult = await ensureDraftId();
  if (!draftResult.ok) {
    // Surface generic error on the signin page — most likely 'not_authenticated' despite user check
    redirect(`/${params.locale}/signin?next=/${params.locale}/sell`);
  }

  // Resume from the current step — fallback to 'category' for fresh drafts.
  const { data: draft } = await supabase
    .from('listing_drafts')
    .select('current_step')
    .eq('user_id', user.id)
    .maybeSingle();

  const currentStep = draft?.current_step ?? 'category';
  redirect(`/${params.locale}/sell/${currentStep}`);
}
