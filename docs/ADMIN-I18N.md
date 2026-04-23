# Admin i18n — Dashboard9 + AppSidebar translation pass

> Phase follow-up to 9a (admin shell) and 9c (Dashboard9 wire).
> Every visible English string inside `/admin` now flows through next-intl
> so the dashboard reads naturally in AR (RTL) and EN (LTR) without a
> second translation source.

---

## 1. Why this exists

Phase 9c landed the shadcnblocks `dashboard9` block as-shipped — branding,
demo data, and UI strings intact in English. The same pass installed the
`dashboard-01` `AppSidebar` at `src/components/app-sidebar.tsx` for the
moderation shell. Both carried hardcoded English: KPI labels, chart
legends, status filters, pagination copy, nav items, user-menu actions.

A marketplace whose default locale is Arabic cannot ship admin surfaces
in English-only. This phase replaces every hardcoded string with
`useTranslations()` calls backed by `messages/{ar,en}.json`, keeping the
reference block's visual design untouched.

---

## 2. Files changed

### Components (i18n wire only — no visual changes)

| File | Namespace consumed | Responsibility |
|------|-------------------|----------------|
| `src/components/dashboard9.tsx` | `admin.dashboard9` + sub-namespaces | Whole dashboard block — header, KPI cards, both charts, recent-orders table, fulfillment panel. Chart configs localized inside each component (moved off module scope). |
| `src/components/app-sidebar.tsx` | `admin.sidebar` | Brand, nav groups, items. `side` flips to `right` when `locale === 'ar'`. |
| `src/components/nav-main.tsx` | `admin.sidebar` | Quick Create button + Inbox sr-only label. |
| `src/components/nav-documents.tsx` | `admin.sidebar` | Documents group label + per-row More/Open/Share dropdown + tail More entry. |
| `src/components/nav-user.tsx` | `admin.sidebar.userMenu` | Footer dropdown (Account, Billing, Notifications, Log out). Also swaps the hardcoded `CN` avatar fallback for initials derived from `user.name` (`Fawzi` → `FA`). Dropdown side flips on RTL. |

### Locale catalogs

- `messages/en.json` — added `admin.dashboard9.*` (KPIs, charts, tooltips, orders table, fulfillment, user menu, a11y skip-link) and the new `admin.sidebar.*` leaves listed below.
- `messages/ar.json` — same shape, Arabic copy.

### Temporary scaffolding (removed)

- `app/[locale]/admin-i18n-preview/page.tsx` — created then deleted. Bypassed `requireAdmin()` to render `<Dashboard9 />` without auth during the translation pass.
- `app/[locale]/admin-shell-preview/page.tsx` — created then deleted. Same idea for the `AdminShell` + `AppSidebar` combo. Both routes existed only because the live `/admin` is auth-gated and verification demanded a Playwright-accessible surface.

---

## 3. Namespace map

All admin-facing keys live under `admin.*`. Two top-level children:

```
admin.dashboard9.*       (the Dashboard9 block)
  header                 (title + subtitle)
  dateRange              (Today / 7d / 30d / …)
  filters                (platform + product selects)
  kpi                    (inStoreSales / websiteSales / wholesale + basedOn({count}))
  sales                  (pipeline chart labels)
  orders                 (table + filters + pagination({from,to,total}) + allStatuses)
  orderStatuses          (processing / packed / shipped / delivered / cancelled)
  revenue                (title({period}) + last6Months + lastYear)
  tooltip                (thisYear / prevYear / vsLastYear({pct}))
  fulfillment            (panel labels)
  userMenu               (Account / Logout for the header avatar)
  a11y                   (skipToMain)

admin.sidebar.*          (both the dashboard-01 sidebar and its sub-components)
  brand                  ("Dealo — الإدارة" / "Dealo Admin")
  quickCreate / inbox
  more / open / share
  groups                 (main / documents)
  items                  (dashboard / lifecycle / analytics / projects / team /
                          dataLibrary / reports / wordAssistant /
                          settings / getHelp / search)
  userMenu               (account / billing / notifications / logOut)
```

ICU placeholders are used where the UI mixes numbers with text:
`kpi.basedOn({count})`, `orders.pagination({from,to,total})`,
`revenue.title({period})`, `tooltip.vsLastYear({pct})`.

---

## 4. Patterns locked in

**Chart configs must be localized inside the component**, not at module
scope. Recharts reads `ChartConfig` labels at render time, so building
them from `t()` calls inside the component is the only way to keep
legends/tooltips in sync with the active locale. The previous
module-level `ordersBarConfig` / `salesBarConfig` / `revenueFlowChartConfig`
were dropped; each chart component now builds its config from a
component-scoped `useTranslations()` handle.

**Recharts' `<Tooltip content={...}>` can't host hooks directly** — it
reconstructs the custom component through its own mount path, which was
flaky when we called `useTranslations()` inside `CustomTooltip`. The
tooltip now accepts a pre-translated `labels` prop; hooks stay in
`RevenueFlowChart` which owns the translation lookup once:

```tsx
type CustomTooltipLabels = {
  thisYear: string;
  prevYear: string;
  vsLastYearTemplate: (pct: number) => string;
};
```

**Sidebar side and dropdown side flip on `useLocale()`**, not on a
separate RTL flag. `side="right"` for AR, `side="left"` for EN — applied
on `<Sidebar>` in `app-sidebar.tsx` and on the user-menu
`<DropdownMenuContent>` in `nav-user.tsx`. This reuses next-intl's
existing locale machinery; no new context needed.

**Avatar fallback derives from `user.name`**, not hardcoded. Single-word
names take the first two characters; multi-word names take the first +
last initial. Fallback to `"U"` if somehow empty. The demo-block `CN`
placeholder no longer appears.

**Status code ⇄ translation key mapping is explicit**. The recent-orders
table carries status codes like `"Processing"` as data; the translation
lookup goes through a `statusKey: Record<OrderStatus, string>` mapping
(e.g. `"Processing" → "processing"`) so renames on either side fail
loudly at the mapping table rather than silently producing a missing-key
warning at runtime.

---

## 5. Verification

### Type + schema gates

- `npx tsc --noEmit` — clean. (One pre-existing unrelated warning in `data-table.tsx` for an unused `CheckCircleIcon` import; not introduced here.)
- `JSON.parse()` on both locale files — both parse.
- Every `t("...")` key in the touched files cross-checked against both `en.json` and `ar.json` — no missing keys on either side.

### Visual (Playwright MCP, 1440 viewport)

| Surface | Locale | Screenshot | Status |
|---------|--------|-----------|--------|
| Dashboard9 (via temp preview) | ar | `ar-admin-i18n-check-1440.png` | ✅ all Arabic |
| Dashboard9 (via temp preview) | en | `en-admin-i18n-check-1440.png` | ✅ all English |
| AdminShell (via temp preview) | ar | `ar-admin-shell-i18n-v2-1440.png` | ✅ all Arabic, RTL side flips |
| AdminShell (via temp preview) | en | `en-admin-shell-i18n-v2-1440.png` | ✅ all English, LTR side flips |

Pre-fix screenshot `ar-admin-shell-1440.png` is kept for the diff
record — it shows the remaining English pieces (`Quick Create`,
`Documents`, `More`, `Inbox`) that this phase closed.

### Live `/admin`

The real `/admin` route is auth-gated by `requireAdmin()` and redirects
to `/signin?next=%2Far%2Fadmin` when signed-out. Verification used two
temporary preview routes that bypassed the gate; both are now deleted.
Signed-in verification on the live route is the next step before any
git push.

---

## 6. Known follow-ups (not in this pass)

- **Hardcoded data**: `Dashboard9`'s mock orders/metrics/chart values
  are still the reference block's demo data. Substituting live data is
  Phase 9d, not this one.
- **Brand name**: "Acme Store" in header/avatar placeholder copy stays
  until the branding pass decides on final header copy.
- **Dead code**: `src/components/admin/app-sidebar.tsx` and
  `src/components/admin/nav-user.tsx` are orphans — nothing imports the
  sidebar, and `nav-user.tsx` is only imported by the orphan sidebar.
  They're leftovers from the 9a moderation shell before 9c swapped to
  the shadcn dashboard-01 scaffold. Deleting them is a separate cleanup
  commit; flagged here so it doesn't get forgotten.
- **Avatar image**: real admins still lack an uploaded avatar, so the
  fallback initials are what actually renders in production. Avatar
  upload is part of the profile-edit polish phase.

---

## 7. Rule for future admin components

Any new component rendered inside `/admin` MUST wire
`useTranslations("admin.<namespace>")` before it ships. Never commit a
hardcoded English string in an admin surface — even placeholder labels,
even sr-only text. The AR default locale is a hard constraint, not a
v2 nicety.

When in doubt: grep for `<span>` with a literal English word inside an
admin component, and for `placeholder="..."` / `aria-label="..."` /
`tooltip="..."` with literal strings. Both patterns produced every
regression caught in this phase.
