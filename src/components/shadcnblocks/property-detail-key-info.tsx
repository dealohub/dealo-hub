import { useTranslations } from 'next-intl';
import { BadgeCheck } from 'lucide-react';
import type { PropertyDetail } from '@/lib/properties/types';

/**
 * Property detail — key info grid.
 *
 * Groups spec data into 5 semantic sections:
 *   Identity    — type, building, developer, PACI, plot block
 *   Dimensions  — built-up area, plot area, beds, baths, floor
 *   Condition   — furnished, completion status, year built
 *   Lifestyle   — view, orientation, parking
 *   Docs        — tenure, deed verified, registration refs
 *
 * Each section renders only the rows whose fields are populated —
 * empty specs are hidden rather than shown as em-dash (different from
 * rides' approach, which renders all rows consistently). Properties
 * vary widely: a land-plot has no bedrooms; a studio has no diwaniya;
 * silence is better than placeholder.
 */

interface Props {
  listing: PropertyDetail;
}

function Row({ label, value, verified }: { label: string; value: React.ReactNode; verified?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <span className="text-sm text-foreground/60">{label}</span>
      <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        {value}
        {verified && <BadgeCheck size={14} className="text-emerald-500" strokeWidth={2.25} />}
      </span>
    </div>
  );
}

function Group({
  title,
  rows,
}: {
  title: string;
  rows: React.ReactNode[];
}) {
  const nonNull = rows.filter(Boolean);
  if (nonNull.length === 0) return null;
  return (
    <div className="space-y-0 divide-y divide-border/40">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-foreground/50">
        {title}
      </h3>
      {nonNull}
    </div>
  );
}

export default function PropertyDetailKeyInfo({ listing }: Props) {
  const t = useTranslations('marketplace.properties.detail');
  const f = listing.fields;

  const typeLabel = t(
    ({
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
    }[f.propertyType] ?? 'typeApartment') as any,
  );

  const furnishedLabel = f.furnishedStatus
    ? t(
        ({
          unfurnished: 'furnishedUnfurnished',
          semi_furnished: 'furnishedSemi',
          fully_furnished: 'furnishedFully',
        }[f.furnishedStatus] ?? 'furnishedUnfurnished') as any,
      )
    : null;

  const completionLabel = f.completionStatus
    ? t(
        ({
          ready: 'completionReady',
          under_construction: 'completionUnderConstruction',
          off_plan: 'completionOffPlan',
        }[f.completionStatus] ?? 'completionReady') as any,
      )
    : null;

  const orientationLabel = f.orientation
    ? t(
        ({
          north: 'orientationNorth',
          south: 'orientationSouth',
          east: 'orientationEast',
          west: 'orientationWest',
          corner: 'orientationCorner',
        }[f.orientation] ?? 'orientationNorth') as any,
      )
    : null;

  const viewLabel = f.viewType
    ? t(
        ({
          sea: 'viewSea',
          city: 'viewCity',
          garden: 'viewGarden',
          courtyard: 'viewCourtyard',
          street: 'viewStreet',
        }[f.viewType] ?? 'viewSea') as any,
      )
    : null;

  const tenureLabel = f.tenure
    ? t(f.tenure === 'freehold' ? ('tenureFreehold' as any) : ('tenureLeasehold' as any))
    : null;

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-5 md:p-6">
      <h2 className="mb-5 font-sans text-xl font-semibold tracking-tight text-foreground">
        {t('keyInfoTitle')}
      </h2>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Group
          title={t('keyInfoIdentity')}
          rows={[
            <Row key="type" label={t('keyInfoPropertyType')} value={typeLabel} />,
            f.buildingName && (
              <Row key="bldg" label={t('keyInfoBuildingName')} value={f.buildingName} />
            ),
            f.developerName && (
              <Row key="dev" label={t('keyInfoDeveloper')} value={f.developerName} />
            ),
          ]}
        />

        <Group
          title={t('keyInfoDimensions')}
          rows={[
            <Row
              key="area"
              label={t('keyInfoArea')}
              value={`${f.areaSqm.toLocaleString('en-US')} ${t('keyInfoSqmShort')}`}
            />,
            f.plotAreaSqm != null && (
              <Row
                key="plot"
                label={t('keyInfoPlotArea')}
                value={`${f.plotAreaSqm.toLocaleString('en-US')} ${t('keyInfoSqmShort')}`}
              />
            ),
            f.bedrooms != null && (
              <Row
                key="bed"
                label={t('keyInfoBedrooms')}
                value={f.bedrooms === 0 ? t('typeStudio') : f.bedrooms.toString()}
              />
            ),
            f.bathrooms != null && (
              <Row key="bath" label={t('keyInfoBathrooms')} value={f.bathrooms.toString()} />
            ),
            f.floorNumber != null && f.totalFloors != null && (
              <Row
                key="floor"
                label={t('keyInfoFloor')}
                value={t('keyInfoFloorOf', {
                  current: f.floorNumber,
                  total: f.totalFloors,
                })}
              />
            ),
            f.floorNumber != null && f.totalFloors == null && (
              <Row key="floor" label={t('keyInfoFloor')} value={String(f.floorNumber)} />
            ),
          ]}
        />

        <Group
          title={t('keyInfoCondition')}
          rows={[
            furnishedLabel && (
              <Row key="furn" label={t('keyInfoFurnished')} value={furnishedLabel} />
            ),
            completionLabel && (
              <Row
                key="completion"
                label={t('keyInfoCompletionStatus')}
                value={completionLabel}
              />
            ),
            f.yearBuilt != null && (
              <Row key="year" label={t('keyInfoYearBuilt')} value={String(f.yearBuilt)} />
            ),
          ]}
        />

        <Group
          title={t('keyInfoLifestyle')}
          rows={[
            viewLabel && <Row key="view" label={t('keyInfoView')} value={viewLabel} />,
            orientationLabel && (
              <Row
                key="orient"
                label={t('keyInfoOrientation')}
                value={orientationLabel}
              />
            ),
            f.parkingSpaces != null && (
              <Row
                key="park"
                label={t('keyInfoParkingSpaces')}
                value={String(f.parkingSpaces)}
              />
            ),
          ]}
        />

        <Group
          title={t('keyInfoDocs')}
          rows={[
            tenureLabel && (
              <Row
                key="tenure"
                label={t('keyInfoTenure')}
                value={tenureLabel}
                verified={f.isDeedVerified}
              />
            ),
            f.paciNumber && (
              <Row
                key="paci"
                label={t('keyInfoPaciNumber')}
                value={<code className="font-mono text-xs">{f.paciNumber}</code>}
              />
            ),
            f.plotBlock && (
              <Row
                key="plotref"
                label={t('keyInfoPlotRef')}
                value={
                  <code className="font-mono text-xs">
                    {f.plotBlock.area} · {f.plotBlock.block} · {f.plotBlock.plot}
                  </code>
                }
              />
            ),
          ]}
        />
      </div>
    </section>
  );
}
