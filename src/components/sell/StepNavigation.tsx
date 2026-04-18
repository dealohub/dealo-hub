'use client';

import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StepNavigationProps {
  onBack?: () => void;
  onContinue?: () => void;
  /** False → continue button is disabled (step not valid yet). */
  canContinue?: boolean;
  /** True → show "Publish" variant on the primary button. */
  isLastStep?: boolean;
  /** Disable both buttons while a server action is in flight. */
  isPending?: boolean;
  /** Hide back on the first step. */
  showBack?: boolean;
}

/**
 * StepNavigation — sticky bottom nav for the wizard.
 *
 * RTL: ArrowLeft/Right auto-flip via `rtl:rotate-180` where visual direction
 * must match reading flow.
 */
export function StepNavigation({
  onBack,
  onContinue,
  canContinue = true,
  isLastStep = false,
  isPending = false,
  showBack = true,
}: StepNavigationProps) {
  const t = useTranslations('sell.nav');

  return (
    <div
      className="
        sticky bottom-0 z-20
        bg-pure-surface/95 backdrop-blur-md
        border-t border-whisper-divider
      "
    >
      <div className="container max-w-2xl py-3 flex items-center justify-between gap-3">
        {showBack ? (
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onBack}
            disabled={isPending}
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
            <span>{t('back')}</span>
          </Button>
        ) : (
          <span aria-hidden="true" />
        )}

        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={onContinue}
          disabled={!canContinue || isPending}
        >
          <span>{isLastStep ? t('publish') : t('continue')}</span>
          <ArrowRight className="size-4 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}
