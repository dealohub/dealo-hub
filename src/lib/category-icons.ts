import {
  Smartphone,
  Sofa,
  Gem,
  Baby,
  Gamepad2,
  Mountain,
  Dumbbell,
  Utensils,
  Sparkles,
  Package,
  type LucideIcon,
} from 'lucide-react';

import type { LucideIconName } from '@/lib/categories';

/**
 * Registry mapping category icon names to Lucide React components.
 * Add new icons here when extending `LucideIconName` in categories.ts.
 */
export const CATEGORY_ICONS: Record<LucideIconName, LucideIcon> = {
  Smartphone,
  Sofa,
  Gem,
  Baby,
  Gamepad2,
  Mountain,
  Dumbbell,
  Utensils,
  Sparkles,
  Package,
};

/**
 * Safe icon lookup with Package fallback.
 */
export function getCategoryIcon(name: LucideIconName | string): LucideIcon {
  return CATEGORY_ICONS[name as LucideIconName] ?? Package;
}
