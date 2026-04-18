import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { Button } from '@/components/ui/Button';
import { Sparkles, UserCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

/**
 * Top navigation — server component so it can read the Supabase session
 * and render signed-in vs signed-out variants without a flash.
 */
export async function Nav() {
  const t = await getTranslations('app');
  const tAuth = await getTranslations('auth');

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle();
    displayName = profile?.display_name ?? null;
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
          <LocaleSwitcher />

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/my-listings"
                className="
                  hidden sm:inline-flex items-center gap-1.5
                  h-9 px-3 rounded-md
                  text-body-small text-charcoal-ink
                  hover:bg-zinc-100
                  transition-colors duration-150
                "
              >
                <UserCircle2 className="size-4" />
                <span className="max-w-[120px] truncate">
                  {displayName ?? user.email?.split('@')[0]}
                </span>
              </Link>
              <SignOutButton />
            </div>
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
