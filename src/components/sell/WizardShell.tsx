import type { ReactNode } from 'react';
import { StepIndicator } from './StepIndicator';
import type { WizardStep } from '@/lib/listings/draft';

interface WizardShellProps {
  step: WizardStep;
  title: string;
  subtitle?: string;
  includeAuthenticity: boolean;
  children: ReactNode;
}

/**
 * WizardShell — page-level wrapper for every step.
 *
 * Layout:
 *   Sticky header with brand + locale switcher → inherited from (app) layout.
 *   StepIndicator at the top of content
 *   Large display title + subtitle
 *   Step content (children)
 *   StepNavigation rendered by the consuming page (it owns state).
 *
 * Mobile-first. Max 640px content column for all steps.
 */
export function WizardShell({ step, title, subtitle, includeAuthenticity, children }: WizardShellProps) {
  return (
    <main className="min-h-[100dvh] bg-canvas-zinc">
      <div className="container max-w-2xl">
        <StepIndicator currentStep={step} includeAuthenticity={includeAuthenticity} />

        <header className="flex flex-col gap-2 pb-6 pt-2">
          <h1 className="text-display font-bold text-charcoal-ink text-balance">
            {title}
          </h1>
          {subtitle && (
            <p className="text-body-large text-muted-steel text-balance">{subtitle}</p>
          )}
        </header>

        <section className="pb-24">{children}</section>
      </div>
    </main>
  );
}
