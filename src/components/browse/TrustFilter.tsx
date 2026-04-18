'use client';

import { useTranslations } from 'next-intl';
import { Checkbox } from '@/components/ui/checkbox';
import { useFilterState } from './filter-store';
import { FilterBlock } from './FilterBlock';

export function TrustFilter() {
  const t = useTranslations('browse.filter.trust');
  const { filters, patch } = useFilterState();

  return (
    <FilterBlock labelKey="browse.filter.trust.title">
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 cursor-pointer select-none text-body">
          <Checkbox
            checked={!!filters.sellerPhoneVerified}
            onCheckedChange={checked => patch({ sellerPhoneVerified: checked ? true : undefined })}
          />
          <span>{t('phoneVerified')}</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none text-body">
          <Checkbox
            checked={!!filters.hasVideo}
            onCheckedChange={checked => patch({ hasVideo: checked ? true : undefined })}
          />
          <span>{t('hasVideo')}</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none text-body">
          <Checkbox
            checked={!!filters.hasDocumentation}
            onCheckedChange={checked => patch({ hasDocumentation: checked ? true : undefined })}
          />
          <span>{t('hasDocumentation')}</span>
        </label>
      </div>
    </FilterBlock>
  );
}
