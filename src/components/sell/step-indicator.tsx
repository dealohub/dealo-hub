import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { WizardStep } from '@/lib/listings/draft';

/**
 * WizardStepIndicator — horizontal progress indicator for /sell/*.
 *
 * Current step is highlighted with the primary colour + ring. Completed
 * steps show a checkmark. Future steps are dimmed.
 *
 * Luxury-authenticity is always rendered; the page wrapper skips it
 * visually when the listing's sub-cat isn't luxury (passes
 * `hideLuxury` to filter it out here).
 */

interface Props {
  currentStep: WizardStep;
  hideLuxury?: boolean;
}

const DEFAULT_ORDER: WizardStep[] = [
  'category',
  'media',
  'details',
  'price',
  'location',
  'delivery',
  'authenticity',
  'preview',
];

export default function WizardStepIndicator({ currentStep, hideLuxury }: Props) {
  const t = useTranslations('sell.steps');
  const tCurrent = useTranslations('sell.step');
  void tCurrent; // reserved for future copy

  const steps = hideLuxury
    ? DEFAULT_ORDER.filter(s => s !== 'authenticity')
    : DEFAULT_ORDER;
  const currentIndex = steps.indexOf(currentStep);

  return (
    <ol
      aria-label="Listing wizard steps"
      className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs"
    >
      {steps.map((step, i) => {
        const status: 'done' | 'current' | 'future' =
          i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'future';

        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={
                'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold transition ' +
                (status === 'done'
                  ? 'bg-emerald-500 text-white'
                  : status === 'current'
                  ? 'bg-primary text-primary-foreground ring-4 ring-primary/15'
                  : 'bg-foreground/5 text-foreground/50')
              }
              aria-current={status === 'current' ? 'step' : undefined}
            >
              {status === 'done' ? <Check size={12} strokeWidth={3} /> : i + 1}
            </span>
            <span
              className={
                status === 'future'
                  ? 'text-foreground/40'
                  : status === 'current'
                  ? 'font-semibold text-foreground'
                  : 'text-foreground/60'
              }
            >
              {t(`${step}.metaTitle` as any)}
            </span>
            {i < steps.length - 1 && (
              <span
                aria-hidden="true"
                className="hidden h-px w-6 bg-foreground/10 sm:inline-block"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
