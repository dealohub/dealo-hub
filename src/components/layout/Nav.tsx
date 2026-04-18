import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';
import { UserMenu } from '@/components/layout/UserMenu';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

/**
 * Top navigation — server component so it can read the Supabase session
 * and render signed-in vs signed-out variants without a flash.
 */
export async function Nav() {
  const t = await getTranslations('app');
  const tAuth = await getTranslations('auth');
  const tSell = await getTranslations('sell');

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName: string | null = null;
  let handle: string | null = null;
  let avatarUrl: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, handle, avatar_url')
      .eq('id', user.id)
      .maybeSingle();
    displayName = profile?.display_name ?? null;
    handle = profile?.handle ?? null;
    avatarUrl = profile?.avatar_url ?? null;
  }

  return (
    <header
      className="
        sticky top-0 z-40
        h-16 bg-pure-surface/95 backdrop-blur-md
        border-b border-whisper-divider
      "
    >
      <div className="container h-full flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <span
            className="
              flex items-center justify-center
              size-8 rounded-lg bg-warm-amber text-white
              transition-transform duration-200
              group-hover:rotate-[-3deg] group-hover:scale-105
            "
          >
            <Sparkles className="size-4" strokeWidth={2.5} />
          </span>
          <span className="text-heading-3 font-bold tracking-tight text-charcoal-ink">
            {t('name')}
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user && (
            <Link href="/sell" className="inline-flex">
              <Button variant="primary" size="sm" className="gap-1.5">
                <Plus className="size-4" strokeWidth={2.5} />
                <span>{tSell('ctaShort')}</span>
              </Button>
            </Link>
          )}

          <LocaleSwitcher />

          {user ? (
            <UserMenu
              displayName={displayName ?? user.email?.split('@')[0] ?? ''}
              handle={handle}
              avatarUrl={avatarUrl}
            />
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/signin">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                  {tAuth('signin.cta')}
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="primary" size="sm">
                  {tAuth('signup.cta')}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
