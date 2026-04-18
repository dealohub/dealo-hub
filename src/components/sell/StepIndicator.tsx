import { getTranslations } from 'next-intl/server';
import { WIZARD_STEPS, type WizardStep } from '@/lib/listings/draft';
import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  currentStep: WizardStep;
  /** Luxury listings include Step 7 "authenticity"; non-luxury skip it. */
  includeAuthenticity: boolean;
}

/**
 * StepIndicator — thin horizontal progress bar.
 *
 * Each step is a rounded pill colored amber once complete or active, zinc
 * when future. Replaces spinners/ring progress (DESIGN.md Section 22 bans
 * circular loaders).
 */
export async function StepIndicator({ currentStep, includeAuthenticity }: StepIndicatorProps) {
  const t = await getTranslations('sell.steps');

  const visibleSteps = WIZARD_STEPS.filter(s =>
    includeAuthenticity ? true : s !== 'authenticity'
  );
  const currentIndex = visibleSteps.indexOf(currentStep);

  return (
    <div className="flex flex-col gap-2 py-4">
      <div
        role="progressbar"
        aria-valuenow={currentIndex + 1}
        aria-valuemin={1}
        aria-valuemax={visibleSteps.length}
        aria-label="Wizard progress"
        className="flex items-center gap-1.5"
      >
        {visibleSteps.map((step, idx) => (
          <span
            key={step}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-300',
              idx <= currentIndex ? 'bg-warm-amber' : 'bg-zinc-200'
            )}
          />
        ))}
      </div>

      <p className="text-caption text-muted-steel" lang="en">
        <span>{currentIndex + 1}</span>
        <span className="mx-1">/</span>
        <span>{visibleSteps.length}</span>
        <span className="mx-2 text-whisper-divider" aria-hidden="true">·</span>
        <span className="text-charcoal-ink" lang={undefined}>
          {t(`${currentStep}.title`)}
        </span>
      </p>
    </div>
  );
}
