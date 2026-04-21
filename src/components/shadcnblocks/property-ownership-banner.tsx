import { ShieldAlert, Globe, Scale } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { PropertyCategoryKey } from '@/lib/properties/types';
import { deriveOwnershipEligibility } from '@/lib/properties/validators';

/**
 * PropertyOwnershipBanner — doctrine pillar P8.
 *
 * Kuwait Law 74/1979 restricts non-Kuwaiti property ownership with
 * narrow exceptions. Non-Kuwaiti buyers contacting a seller about a
 * residential-private sale have zero legal path to purchase — yet
 * competing platforms display no warning. Dealo renders this banner
 * at the top of every sale detail page so expectations are set before
 * conversation starts.
 *
 * Three states:
 *   - 'kuwaiti-only'    → amber shield, "Kuwaiti buyers only"
 *   - 'gcc-reciprocal'  → blue scale,   "GCC nationals welcome"
 *   - 'open'            → gray globe,   "International — no restriction"
 *
 * Returns null for rent listings (no ownership transfer) and any
 * configuration where deriveOwnershipEligibility returns null.
 *
 * Reference: planning/PHASE-4A-AUDIT.md §1 (P8), §4.6 (zoning), §12 A2
 */

interface Props {
  subCat: PropertyCategoryKey;
  zoningType: string | undefined;
}

export default function PropertyOwnershipBanner({ subCat, zoningType }: Props) {
  const t = useTranslations('marketplace.properties.detail');
  const eligibility = deriveOwnershipEligibility(subCat, zoningType as any);

  if (!eligibility) return null;

  const { icon: Icon, title, body, tone } =
    eligibility === 'kuwaiti-only'
      ? {
          icon: ShieldAlert,
          title: t('eligibilityKuwaitiTitle'),
          body: t('eligibilityKuwaitiBody'),
          tone: 'amber' as const,
        }
      : eligibility === 'gcc-reciprocal'
      ? {
          icon: Scale,
          title: t('eligibilityGccTitle'),
          body: t('eligibilityGccBody'),
          tone: 'sky' as const,
        }
      : {
          icon: Globe,
          title: t('eligibilityOpenTitle'),
          body: t('eligibilityOpenBody'),
          tone: 'slate' as const,
        };

  const toneClasses = {
    amber: {
      bg: 'bg-amber-500/10',
      ring: 'ring-amber-500/30',
      icon: 'text-amber-500',
      badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    },
    sky: {
      bg: 'bg-sky-500/10',
      ring: 'ring-sky-500/30',
      icon: 'text-sky-500',
      badge: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
    },
    slate: {
      bg: 'bg-foreground/5',
      ring: 'ring-foreground/10',
      icon: 'text-foreground/60',
      badge: 'bg-foreground/10 text-foreground/70',
    },
  }[tone];

  return (
    <div
      className={
        'flex items-start gap-3 rounded-xl px-4 py-3.5 ring-1 ' +
        toneClasses.bg +
        ' ' +
        toneClasses.ring
      }
      role="note"
      aria-label={title}
    >
      <Icon
        size={20}
        className={'mt-0.5 flex-shrink-0 ' + toneClasses.icon}
        strokeWidth={2.25}
      />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          <span
            className={
              'rounded-full px-2 py-0.5 text-[10px] font-medium ' + toneClasses.badge
            }
          >
            {t('eligibilityLawRef')}
          </span>
        </div>
        <p className="text-xs leading-relaxed text-foreground/70">{body}</p>
      </div>
    </div>
  );
}
