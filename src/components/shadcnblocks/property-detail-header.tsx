'use client';

import { motion } from 'framer-motion';
import {
  ChevronRight,
  Eye,
  Camera,
  MessageSquare,
  Heart,
  ShieldCheck,
  Flame,
  Sparkle,
  MapPin,
  Maximize2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import type { PropertyDetail } from '@/lib/properties/types';

const SUB_CAT_COLOR: Record<string, string> = {
  'property-for-rent':     '#0ea5e9',
  'rooms-for-rent':        '#0ea5e9',
  'property-for-sale':     '#f59e0b',
  'land':                  '#84cc16',
  'property-for-exchange': '#8b5cf6',
  'international-property':'#f97316',
  'property-management':   '#64748b',
  'realestate-offices':    '#64748b',
};

function propertyTypeKey(value: string): string {
  return (
    {
      apartment: 'typeApartment',
      villa: 'typeVilla',
      townhouse: 'typeTownhouse',
      chalet: 'typeChalet',
      studio: 'typeStudio',
      duplex: 'typeDuplex',
      penthouse: 'typePenthouse',
      floor: 'typeFloor',
      annex: 'typeAnnex',
      office: 'typeOffice',
      shop: 'typeShop',
      warehouse: 'typeWarehouse',
      room: 'typeRoom',
      'land-plot': 'typeLandPlot',
    }[value] ?? 'typeApartment'
  );
}

interface Props {
  listing: PropertyDetail;
  locale: 'ar' | 'en';
}

export default function PropertyDetailHeader({ listing, locale }: Props) {
  const t = useTranslations('marketplace.properties.detail');
  const f = listing.fields;
  const catColor = SUB_CAT_COLOR[listing.subCat] ?? '#64748b';
  const typeLabel = t(propertyTypeKey(f.propertyType) as any);

  const dealerLabel =
    listing.seller.dealerName?.trim() || listing.seller.displayName;
  const initials = dealerLabel
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('');
  const isVerifiedDealer =
    listing.seller.isDealer && Boolean(listing.seller.dealerVerifiedAt);

  return (
    <section className="relative w-full overflow-hidden border-b border-foreground/10 bg-background">
      {/* Ambient radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background: `radial-gradient(700px 280px at 85% 0%, ${catColor}1a, transparent 55%), radial-gradient(500px 220px at 10% 100%, ${catColor}12, transparent 60%)`,
        }}
      />
      {/* Shimmer scan line */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -inset-x-full"
        style={{
          background:
            'linear-gradient(100deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)',
        }}
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{ duration: 3.8, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
      />

      <div className="relative mx-auto max-w-7xl px-6 pb-6 pt-5 md:pb-8 md:pt-6">
        {/* Breadcrumb — centered */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex min-w-0 flex-wrap items-center justify-center gap-1.5 text-[11.5px] text-foreground/55"
        >
          <Link href={`/${locale}`} className="transition hover:text-foreground">
            {t('crumbHome')}
          </Link>
          <ChevronRight size={12} className="shrink-0 text-foreground/30 rtl:rotate-180" />
          <Link href={`/${locale}/properties`} className="transition hover:text-foreground">
            {t('crumbProperties')}
          </Link>
          <ChevronRight size={12} className="shrink-0 text-foreground/30 rtl:rotate-180" />
          <span
            className="inline-flex items-center gap-1.5 font-medium"
            style={{ color: catColor }}
          >
            <span
              className="inline-block size-1.5 rounded-full"
              style={{ background: catColor }}
            />
            {typeLabel}
          </span>
          <ChevronRight size={12} className="shrink-0 text-foreground/30 rtl:rotate-180" />
          <span className="truncate font-medium text-foreground/80">{listing.title}</span>
        </nav>

        {/* Title block — centered hero */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
          className="mx-auto flex max-w-3xl flex-col items-center text-center"
        >
          {/* Badges */}
          <div className="mb-4 flex flex-wrap items-center justify-center gap-1.5">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em]"
              style={{
                background: `${catColor}1a`,
                color: catColor,
                border: `1px solid ${catColor}44`,
              }}
            >
              <span
                className="inline-block size-1.5 rounded-full"
                style={{ background: catColor }}
              />
              {typeLabel}
            </span>

            {listing.verificationTier !== 'unverified' && (
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-400/30 bg-blue-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-400">
                <ShieldCheck size={10} strokeWidth={2.4} />
                {listing.verificationTier === 'dealo_inspected'
                  ? t('tierDealoInspected')
                  : t('tierAiVerified')}
              </span>
            )}

            {listing.isFeatured && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#C9A86A]/40 bg-[#C9A86A]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#C9A86A]">
                <Sparkle size={9} strokeWidth={2.6} />
                Featured
              </span>
            )}

            {listing.isHot && (
              <motion.span
                className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-500"
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Flame size={10} strokeWidth={2.4} />
                Hot
              </motion.span>
            )}
          </div>

          {/* H1 */}
          <h1 className="font-calSans text-[28px] font-extrabold leading-[1.1] tracking-tight text-foreground md:text-[36px] lg:text-[44px]">
            {listing.title}
          </h1>

          {/* Spec line */}
          <p className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[13px] text-foreground/65 md:text-[14px]">
            {f.bedrooms != null && (
              <span>
                <strong className="font-semibold text-foreground/85">{f.bedrooms}</strong>{' '}
                {f.bedrooms === 1 ? t('keyInfoBedShort') : t('keyInfoBedShortPlural')}
              </span>
            )}
            {f.bathrooms != null && f.bedrooms != null && <Dot />}
            {f.bathrooms != null && (
              <span>
                <strong className="font-semibold text-foreground/85">{f.bathrooms}</strong>{' '}
                {f.bathrooms === 1 ? t('keyInfoBathShort') : t('keyInfoBathShortPlural')}
              </span>
            )}
            <Dot />
            <span className="inline-flex items-center gap-1.5">
              <Maximize2 size={12} strokeWidth={2.2} className="text-foreground/40" />
              <strong className="font-semibold text-foreground/85">
                {f.areaSqm.toLocaleString('en-US')}
              </strong>{' '}
              {t('keyInfoSqmShort')}
            </span>
            {(listing.areaName || listing.cityName) && (
              <>
                <Dot />
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={13} strokeWidth={2.2} className="text-foreground/40" />
                  {[listing.areaName, listing.cityName].filter(Boolean).join(' · ')}
                </span>
              </>
            )}
          </p>
        </motion.div>

        {/* Seller + stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 0.61, 0.36, 1] }}
          className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-foreground/10 pt-4"
        >
          {/* Seller */}
          <div className="flex items-center gap-3">
            <div
              className="grid size-10 place-items-center rounded-xl text-[11px] font-extrabold tracking-tight"
              style={{ background: `${catColor}18`, color: catColor }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-[13px] font-semibold text-foreground">
                  {dealerLabel}
                </span>
                {isVerifiedDealer && (
                  <svg width="12" height="12" viewBox="0 0 24 24" className="shrink-0">
                    <path
                      d="M12 2l2.4 2.4 3.3-.4.6 3.3 3 1.5-1.5 3 1.5 3-3 1.5-.6 3.3-3.3-.4L12 22l-2.4-2.4-3.3.4-.6-3.3-3-1.5 1.5-3-1.5-3 3-1.5.6-3.3 3.3.4L12 2z"
                      fill="#3B82F6"
                    />
                    <path
                      d="M9 12l2 2 4-4"
                      stroke="white"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <p className="text-[10px] uppercase tracking-wider text-foreground/45">
                {listing.seller.isDealer ? t('panelDealerSeller') : t('panelPrivateSeller')}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11.5px]">
            <StatChip
              icon={<Eye size={12} strokeWidth={2.2} />}
              value={listing.viewCount}
              label={t('statViews')}
            />
            <StatChip
              icon={<Heart size={12} strokeWidth={2.2} />}
              value={listing.saveCount}
              label={t('statSaves')}
            />
            <StatChip
              icon={<MessageSquare size={12} strokeWidth={2.2} />}
              value={listing.chatInitiationCount}
              label={t('statInquiries')}
            />
            <StatChip
              icon={<Camera size={12} strokeWidth={2.2} />}
              value={listing.images.length}
              label={t('statPhotos')}
            />
            <StatChip value={`#${listing.id}`} label={t('statListingId')} mono />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const Dot = () => <span className="text-foreground/20">·</span>;

const StatChip = ({
  icon,
  value,
  label,
  mono,
}: {
  icon?: React.ReactNode;
  value: string | number;
  label: string;
  mono?: boolean;
}) => (
  <span className="inline-flex items-center gap-1.5 text-foreground/55">
    {icon && <span className="text-foreground/40">{icon}</span>}
    <span
      className={
        'font-semibold text-foreground/85 ' +
        (mono ? 'font-mono text-[11px]' : 'tabular-nums')
      }
    >
      {value}
    </span>
    <span className="text-foreground/45">{label}</span>
  </span>
);
