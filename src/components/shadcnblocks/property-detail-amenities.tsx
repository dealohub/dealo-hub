import { useTranslations } from 'next-intl';
import {
  Snowflake,
  Wind,
  ArrowUpNarrowWide,
  Car,
  Zap,
  Droplet,
  PanelTop,
  Package,
  Waves,
  Dumbbell,
  BedDouble,
  CarTaxiFront,
  ShieldCheck,
  Camera,
  Fence,
  Trees,
  ToyBrick,
  Sun,
  DoorOpen,
  Building2,
  Sparkles,
} from 'lucide-react';
import type { PropertyDetail } from '@/lib/properties/types';
import type { Amenity } from '@/lib/properties/validators';

/**
 * Property detail — amenities (22-slug locked list, tiered).
 *
 * Doctrine P14 adjacency: amenities are an *enumerated* checklist, never
 * free text (Dubizzle + Q84Sale both use free text; ours doesn't).
 * Grouped into 4 tiers per PHASE-4A-AUDIT §5:
 *   Essentials · Comfort · Security · Lifestyle
 *
 * Each amenity renders with a lucide icon + i18n label. Unchecked
 * amenities don't render (no "N/A" noise). Diwaniya is intentionally
 * NOT in this list — it has its own structured section (P14).
 */

const AMENITY_TIERS: Record<string, Amenity[]> = {
  essentials: [
    'central_ac',
    'split_ac',
    'elevator',
    'covered_parking',
    'backup_generator',
    'water_tank',
    'balcony',
    'storage_room',
  ],
  comfort: [
    'swimming_pool_shared',
    'swimming_pool_private',
    'gym',
    'maid_room',
    'driver_room',
  ],
  security: ['24h_security', 'cctv', 'gated_community'],
  lifestyle: [
    'sea_view',
    'garden',
    'kids_play_area',
    'beachfront',
    'private_entrance',
    'roof_access',
  ],
};

const AMENITY_I18N: Record<Amenity, string> = {
  central_ac: 'amenityCentralAc',
  split_ac: 'amenitySplitAc',
  elevator: 'amenityElevator',
  covered_parking: 'amenityCoveredParking',
  backup_generator: 'amenityBackupGenerator',
  water_tank: 'amenityWaterTank',
  balcony: 'amenityBalcony',
  storage_room: 'amenityStorageRoom',
  swimming_pool_shared: 'amenitySwimmingPoolShared',
  swimming_pool_private: 'amenitySwimmingPoolPrivate',
  gym: 'amenityGym',
  maid_room: 'amenityMaidRoom',
  driver_room: 'amenityDriverRoom',
  '24h_security': 'amenity24hSecurity',
  cctv: 'amenityCctv',
  gated_community: 'amenityGatedCommunity',
  sea_view: 'amenitySeaView',
  garden: 'amenityGarden',
  kids_play_area: 'amenityKidsPlayArea',
  beachfront: 'amenityBeachfront',
  private_entrance: 'amenityPrivateEntrance',
  roof_access: 'amenityRoofAccess',
};

const AMENITY_ICON: Record<Amenity, typeof Snowflake> = {
  central_ac: Snowflake,
  split_ac: Wind,
  elevator: ArrowUpNarrowWide,
  covered_parking: Car,
  backup_generator: Zap,
  water_tank: Droplet,
  balcony: PanelTop,
  storage_room: Package,
  swimming_pool_shared: Waves,
  swimming_pool_private: Waves,
  gym: Dumbbell,
  maid_room: BedDouble,
  driver_room: CarTaxiFront,
  '24h_security': ShieldCheck,
  cctv: Camera,
  gated_community: Fence,
  sea_view: Waves,
  garden: Trees,
  kids_play_area: ToyBrick,
  beachfront: Sun,
  private_entrance: DoorOpen,
  roof_access: Building2,
};

interface Props {
  listing: PropertyDetail;
}

export default function PropertyDetailAmenities({ listing }: Props) {
  const t = useTranslations('marketplace.properties.detail');
  const active = new Set(listing.fields.amenities);

  if (active.size === 0) return null;

  const tiers = [
    { key: 'essentials', title: t('amenitiesCategoryEssentials') },
    { key: 'comfort', title: t('amenitiesCategoryComfort') },
    { key: 'security', title: t('amenitiesCategorySecurity') },
    { key: 'lifestyle', title: t('amenitiesCategoryLifestyle') },
  ];

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-5 md:p-6">
      <div className="mb-5 flex items-center gap-2">
        <Sparkles size={18} className="text-primary" strokeWidth={2.25} />
        <h2 className="font-sans text-xl font-semibold tracking-tight text-foreground">
          Amenities
        </h2>
        <span className="ms-auto text-xs text-foreground/50">
          {active.size} / 22
        </span>
      </div>

      <div className="space-y-5">
        {tiers.map(tier => {
          const slugs = AMENITY_TIERS[tier.key].filter(s => active.has(s));
          if (slugs.length === 0) return null;
          return (
            <div key={tier.key}>
              <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-foreground/50">
                {tier.title}
              </h3>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {slugs.map(slug => {
                  const Icon = AMENITY_ICON[slug];
                  return (
                    <div
                      key={slug}
                      className="flex items-center gap-2 rounded-lg bg-foreground/5 px-3 py-2 text-sm text-foreground/80"
                    >
                      <Icon size={16} className="shrink-0 text-foreground/60" />
                      <span>{t(AMENITY_I18N[slug] as any)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
