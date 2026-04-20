'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Quote,
  ChevronDown,
  ChevronUp,
  Flag,
  Languages,
  Check,
  Sparkles,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { VEHICLE_COLORS, type RideListing } from './rides-data';
import { buildRideSpecs } from './build-ride-specs';

/**
 * RideDetailDescription — "كلام البائع" block.
 *
 * Synthesizes a believable seller blurb from listing data (title, year,
 * specA, color, warranty) and presents it like a real dealer wrote it,
 * with collapsible "read more" and highlight chips for key selling
 * points. Bilingual — toggle AR / EN inline.
 */

interface Props {
  listing: RideListing;
}

export const RideDetailDescription = ({ listing }: Props) => {
  const t = useTranslations('marketplace.rides.detail.description');
  const locale = useLocale();
  const catColor = VEHICLE_COLORS[listing.type];
  const specs = useMemo(() => buildRideSpecs(listing), [listing]);

  const [expanded, setExpanded] = useState(false);
  // Default language matches page locale — toggle flips between AR / EN
  const [lang, setLang] = useState<'ar' | 'en'>(locale === 'en' ? 'en' : 'ar');

  // Synthesize the blurb in two languages
  const { ar, en } = useMemo(
    () => ({
      ar: buildArabic(listing, specs),
      en: buildEnglish(listing, specs),
    }),
    [listing, specs],
  );

  const primary = lang === 'ar' ? ar : en;
  const body = primary.body;
  const highlights = primary.highlights;
  const oppositeLabel = lang === 'ar' ? 'EN' : 'AR';
  const contentDir = lang === 'ar' ? 'rtl' : 'ltr';

  // Word-boundary-aware truncation so we never chop mid-word
  const PREVIEW_CHARS = 320;
  const isLong = body.length > PREVIEW_CHARS;
  const preview = isLong
    ? body.slice(0, PREVIEW_CHARS).replace(/\s+\S*$/, '').trimEnd() + '…'
    : body;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border border-foreground/10 bg-background"
    >
      {/* Ambient tint header */}
      <div
        className="flex items-center justify-between gap-3 border-b border-foreground/[0.06] px-5 py-3"
        style={{
          background: `linear-gradient(90deg, ${catColor}10, transparent 70%)`,
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="grid size-8 place-items-center rounded-xl text-white shadow-sm"
            style={{ background: catColor }}
          >
            <Quote size={14} strokeWidth={2.4} />
          </div>
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.15em] text-foreground/55">
              {t('eyebrow')}
            </p>
            <h3 className="font-calSans text-[15px] font-bold leading-tight text-foreground">
              {listing.dealer}
            </h3>
          </div>
        </div>

        {/* Language toggle — switches between AR and EN content */}
        <button
          type="button"
          onClick={() => setLang((l) => (l === 'ar' ? 'en' : 'ar'))}
          className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/[0.03] px-2.5 py-1 text-[10.5px] font-semibold text-foreground/70 transition hover:border-foreground/25 hover:text-foreground"
          aria-label={`Switch to ${oppositeLabel}`}
        >
          <Languages size={11} strokeWidth={2.2} />
          {oppositeLabel}
        </button>
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Highlight chips */}
        {highlights.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {highlights.map((h, i) => (
              <motion.span
                key={h}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                className="inline-flex items-center gap-1 rounded-full border border-[#C9A86A]/30 bg-[#C9A86A]/10 px-2 py-0.5 text-[10.5px] font-semibold text-[#C9A86A]"
              >
                <Sparkles size={9} strokeWidth={2.4} />
                {h}
              </motion.span>
            ))}
          </div>
        )}

        {/* The text */}
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={lang + String(expanded)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="whitespace-pre-line text-[13.5px] leading-[1.85] text-foreground/75"
            dir={contentDir}
            style={{ textAlign: 'start' }}
          >
            {expanded || !isLong ? body : preview}
          </motion.div>
        </AnimatePresence>

        {/* Read more toggle */}
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="group mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-foreground/70 transition hover:text-foreground"
            style={{ color: expanded ? undefined : catColor }}
          >
            {expanded ? t('showLess') : t('readMore')}
            {expanded ? (
              <ChevronUp size={12} className="transition-transform group-hover:-translate-y-0.5" />
            ) : (
              <ChevronDown size={12} className="transition-transform group-hover:translate-y-0.5" />
            )}
          </button>
        )}

        {/* Footer: posted date + report */}
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-foreground/[0.06] pt-4 text-[11px] text-foreground/50">
          <span className="inline-flex items-center gap-1.5">
            <Check size={11} strokeWidth={2.4} className="text-emerald-500" />
            {t('writtenBy', { dealer: listing.dealer })}
          </span>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-foreground/50 transition hover:text-foreground/80"
          >
            <Flag size={11} strokeWidth={2.2} />
            {t('report')}
          </button>
        </div>
      </div>
    </motion.section>
  );
};

// ─── Text synthesis ──────────────────────────────────

type Specs = ReturnType<typeof buildRideSpecs>;

const buildArabic = (
  l: RideListing,
  s: Specs,
): { body: string; highlights: string[] } => {
  const lines: string[] = [];
  const hi: string[] = [];

  lines.push(
    `${l.title} بحالة ممتازة، ${l.specA} بأداء قوي وموثوقية عالية مناسبة لطرق الخليج.`,
  );

  if (s.mileageKm === 0) {
    lines.push(
      `السيارة جديدة (0 كم) — مواصفات ${arRegion(s.regionSpec)}، لون ${arColor(s.exteriorColor.key)} خارجي مع فرش ${arColor(s.interiorColor.key)} داخلي.`,
    );
    hi.push('جديدة 0 كم');
  } else {
    lines.push(
      `موديل ${l.year} بـ ${s.mileageKm.toLocaleString('en-US')} كيلومتر فقط — مواصفات ${arRegion(s.regionSpec)}، لون ${arColor(s.exteriorColor.key)} خارجي مع فرش ${arColor(s.interiorColor.key)} داخلي.`,
    );
    if (s.mileageVsMarketPct <= -20) hi.push('ميلاج قليل جداً');
  }

  if (s.warranty.active) {
    lines.push(
      `\nالسيارة تحت الضمان الساري لمدة ${s.warranty.remainingMonths} شهراً — صيانة كاملة في الوكالة وفحص شامل قبل العرض.`,
    );
    hi.push('ضمان ساري');
  } else {
    lines.push(
      `\nالسيارة فحصت بالكامل من فريقنا الفني قبل العرض — جميع التقارير متوفرة عند الطلب.`,
    );
  }

  lines.push(
    `\nالمميزات التقنية:\n• ناقل حركة ${arTransmission(s.transmission)}\n• نظام ${arDrivetrain(s.drivetrain)}\n• وقود ${arFuel(s.fuel)}${s.cylinders ? ` · ${s.cylinders} أسطوانات` : ''}\n• ${s.seats} مقاعد${s.doors ? ` · ${s.doors} أبواب` : ''}`,
  );

  lines.push(
    `\nخيارات التمويل متاحة من خلال شركائنا (أقساط من ${Math.round((priceNum(l.price) * 0.8) / 60 / 10) * 10} درهم شهرياً)، ونوفّر التوصيل داخل الإمارة مجاناً.`,
  );

  lines.push(
    `\nللمعاينة أو الحجز تواصل معنا مباشرة — نردّ عادة خلال 15 دقيقة.`,
  );

  if (l.featured) hi.push('عرض حصري');
  if (l.dealerVerified) hi.push('وكيل معتمد');
  if (l.hot) hi.push('رائج هذا الأسبوع');

  return { body: lines.join('\n'), highlights: hi };
};

const buildEnglish = (
  l: RideListing,
  s: Specs,
): { body: string; highlights: string[] } => {
  const lines: string[] = [];
  const hi: string[] = [];

  lines.push(
    `${l.title} in immaculate condition — ${l.specA} delivers the confident performance this model is known for, tuned for GCC roads.`,
  );

  if (s.mileageKm === 0) {
    lines.push(
      `Brand-new, 0 km. ${enRegion(s.regionSpec)} specifications, finished in ${s.exteriorColor.key} with a ${s.interiorColor.key} interior.`,
    );
    hi.push('Brand new');
  } else {
    lines.push(
      `${l.year} model with only ${s.mileageKm.toLocaleString('en-US')} km on the clock. ${enRegion(s.regionSpec)} specifications, finished in ${s.exteriorColor.key} over a ${s.interiorColor.key} interior.`,
    );
    if (s.mileageVsMarketPct <= -20) hi.push('Low mileage');
  }

  if (s.warranty.active) {
    lines.push(
      `\nStill covered by the manufacturer warranty — ${s.warranty.remainingMonths} months remaining, full dealer service history, and a multi-point inspection completed before listing.`,
    );
    hi.push('Under warranty');
  } else {
    lines.push(
      `\nInspected in full by our technicians before being listed — the complete report is available on request.`,
    );
  }

  lines.push(
    `\nKey highlights:\n• ${enTransmission(s.transmission)} transmission\n• ${enDrivetrain(s.drivetrain)}\n• ${enFuel(s.fuel)}${s.cylinders ? ` · ${s.cylinders}-cylinder` : ''}\n• ${s.seats} seats${s.doors ? ` · ${s.doors} doors` : ''}`,
  );

  lines.push(
    `\nFinance is available through our banking partners (from around AED ${Math.round((priceNum(l.price) * 0.8) / 60 / 10) * 10}/month), and we offer free delivery within the emirate.`,
  );

  lines.push(`\nMessage us to arrange a viewing — we usually reply within 15 minutes.`);

  if (l.featured) hi.push('Featured listing');
  if (l.dealerVerified) hi.push('Authorized dealer');
  if (l.hot) hi.push('Trending this week');

  return { body: lines.join('\n'), highlights: hi };
};

// ─── Tiny translators ────────────────────────────────
const priceNum = (p: string) => Number(p.replace(/[^0-9]/g, ''));

const arColor = (k: string) =>
  ({
    white: 'أبيض',
    black: 'أسود',
    silver: 'فضي',
    grey: 'رمادي',
    blue: 'أزرق',
    red: 'أحمر',
    green: 'أخضر',
    beige: 'بيج',
    brown: 'بنّي',
  })[k] || k;

const arRegion = (k: string) =>
  ({
    gcc: 'خليجية',
    american: 'أمريكية',
    european: 'أوروبية',
    japanese: 'يابانية',
  })[k] || k;

const arTransmission = (k: string) =>
  ({
    automatic: 'أوتوماتيك',
    manual: 'عادي',
    dct: 'DCT مزدوج',
  })[k] || k;

const arDrivetrain = (k: string) =>
  ({
    awd: 'دفع رباعي دائم',
    fwd: 'دفع أمامي',
    rwd: 'دفع خلفي',
    '4wd': 'دفع 4×4',
  })[k] || k;

const arFuel = (k: string) =>
  ({
    petrol: 'بنزين',
    diesel: 'ديزل',
    electric: 'كهربائي',
    hybrid: 'هجين',
  })[k] || k;

const enRegion = (k: string) =>
  ({ gcc: 'GCC', american: 'American', european: 'European', japanese: 'Japanese' })[k] || k;
const enTransmission = (k: string) =>
  ({ automatic: 'Automatic', manual: 'Manual', dct: 'Dual-clutch (DCT)' })[k] || k;
const enDrivetrain = (k: string) =>
  ({ awd: 'All-wheel drive', fwd: 'Front-wheel drive', rwd: 'Rear-wheel drive', '4wd': '4×4' })[k] || k;
const enFuel = (k: string) =>
  ({ petrol: 'Petrol', diesel: 'Diesel', electric: 'Electric', hybrid: 'Hybrid' })[k] || k;

export default RideDetailDescription;
