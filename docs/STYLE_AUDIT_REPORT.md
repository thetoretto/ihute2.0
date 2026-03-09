# Cross-App Hardcoded Style Audit Report

Generated for design token unification (see `shared/design-tokens/CONTRACT.md`). Status: **migrated** (token contract and guardrail in place).

---

## 1. Landing page (`landing-page/`)

### 1.1 Approved token file (literal values allowed)

| File | Note |
|------|------|
| `landing-page/src/styles.css` | `:root` and class definitions – canonical tokens only |

### 1.2 Violations: literal colors / shadows outside `:root`

| File | Line(s) | Category | Finding | Action |
|------|---------|----------|---------|--------|
| `landing-page/src/styles.css` | 593, 800, 1090, 1131, 1740, 1895, 1976, 1982, 3019, 3132, 3589–3635, 3830, 4081 | literal rgba/hex/shadow | box-shadow, background, color using raw rgba/hex (e.g. `#252d38`, `#2d3642`, `#1e252d`, `rgba(255,255,255,0.7)`) | Replace with var(--lp-*) or new tokens (e.g. --lp-dark-elevation-1/2) |
| `landing-page/src/styles.css` | 2270 | literal color | `color: rgba(147, 197, 253, 0.95)` | Replace with semantic token or var |

### 1.3 Violations: components (Tailwind arbitrary / one-off values)

| File | Category | Finding | Action |
|------|----------|---------|--------|
| `landing-page/src/components/DateTimePicker.tsx` | arbitrary utilities | `p-4`, `rounded-2xl`, `text-4xl`, `bg-black/40`, `active:scale-[0.98]`, etc. | Use token-backed classes (rounded-lg, text-2xl) or CSS classes from styles.css |

### 1.4 Violations: non-token px in styles.css

| File | Note |
|------|------|
| `landing-page/src/styles.css` | ~248+ uses of `border-radius`/`font-size` with px – many already use var(--lp-radius-*); remaining raw px (e.g. in media queries, component blocks) to be replaced with vars or contract spacing/type scale |

---

## 2. Admin web (`admin-web/`)

### 2.1 Approved token files

| File | Note |
|------|------|
| `admin-web/tailwind.config.js` | Theme extend (colors, borderRadius, spacing, etc.) |
| `admin-web/src/styles.css` | `:root` and chart/layout classes |

### 2.2 Violations: arbitrary Tailwind classes

| File | Line(s) | Finding | Action |
|------|----------|---------|--------|
| `admin-web/src/pages/DashboardPage.tsx` | 133, 168, 205, 227, 231, 236, 244, 267–276, 308, 322, 345, 374, 383, 406 | `rounded-[32px]`, `text-[10px]`, `text-[11px]`, `min-h-[260px]` | Use `rounded-xl`, `text-xs`, `min-h-*` from theme |
| `admin-web/src/pages/ActivitiesPage.tsx` | 78, 80, 135, 170, 176 | `rounded-[32px]`, `text-[10px]`, `text-[11px]` | Same |
| `admin-web/src/pages/VehiclesPage.tsx` | 31, 33, 58 | `text-[10px]`, `rounded-[32px]` | Same |
| `admin-web/src/pages/TicketsPage.tsx` | 58, 60, 90 | Same | Same |
| `admin-web/src/pages/UsersPage.tsx` | 54, 76–80, 93 | Same | Same |
| `admin-web/src/pages/HotpointsPage.tsx` | 127, 129, 184, 194–195, 202, 212–213 | `rounded-[32px]`, `max-w-[420px]`, `w-[90%]`, `min-h-[38px]` | Use theme `rounded-xl`, `max-w-md` or token, `min-h-*` |
| `admin-web/src/pages/DisputesPage.tsx` | 92, 94, 140, 165, 169, 188–189, 197 | Same patterns | Same |
| `admin-web/src/pages/LoginPage.tsx` | 43, 94, 99 | `max-w-[420px]`, `text-[11px]`, `min-h-[38px]` | Same |
| `admin-web/src/pages/AgencyManagementPage.tsx` | 38, 40, 68, 91 | `rounded-[32px]`, `text-[11px]` | Same |
| `admin-web/src/pages/RoutesPage.tsx` | 73, 75 | Same | Same |
| `admin-web/src/pages/ScannerOperatorsPage.tsx` | 18, 21, 34, 61 | Same | Same |
| `admin-web/src/pages/IncomePage.tsx` | 32, 54, 71, 82, 95 | Same | Same |
| `admin-web/src/App.tsx` | 170, 242, 243 | `text-[10px]`, `max-w-[120px]` | Same |
| `admin-web/src/components/DateTimePicker.tsx` | 306, 344 | `text-[56px]` | Use theme fontSize (e.g. text-4xl or custom token) |

### 2.3 Violations: inline style objects (visual values)

| File | Line | Finding | Action |
|------|------|---------|--------|
| `admin-web/src/pages/DashboardPage.tsx` | 187 | `style={{ height: \`${h}%\` }}` | Keep for layout; ensure no color/font/radius in inline |
| `admin-web/src/components/BarChartTrend.tsx` | 34 | `style={{ minHeight: height }}` | Prefer className + CSS var or theme height |
| `admin-web/src/components/DonutChartBreakdown.tsx` | 33 | Same | Same |

---

## 3. Mobile (`mobile/`)

### 3.1 Approved token files

| File | Note |
|------|------|
| `mobile/src/utils/theme.ts` | colors, spacing, radii, typography, shadows |
| `mobile/src/utils/layout.ts` | layout constants, shared styles |

### 3.2 Violations: literal color strings

| File | Line(s) | Finding | Action |
|------|----------|---------|--------|
| `mobile/src/screens/shared/ProfileScreen.tsx` | 542, 624 | `borderColor: 'white'` | Use theme color (e.g. colors.surface or onDarkText) |
| `mobile/src/screens/driver/PublishRideScreen.tsx` | 848, 1001 | `backgroundColor: 'transparent'` | Use theme (e.g. transparent or ghostBg) |
| `mobile/src/screens/passenger/PassengerHomeScreen.tsx` | 596, 598, 822, 879 | `backgroundColor: 'white'`, `borderColor: 'transparent'`, `borderColor: 'white'` | Use colors.surface, colors.ghostBorder / border |
| `mobile/src/components/DateTimePicker.tsx` | 404 | `borderColor: 'transparent'` | Use theme |
| `mobile/src/components/Button.tsx` | 45, 62 | `backgroundColor: 'transparent'`, `borderColor: 'transparent'` | Use theme (buttonSecondaryBg, ghostBorder) |

### 3.3 Violations: inline style objects (visual / layout)

| File | Line(s) | Finding | Action |
|------|----------|---------|--------|
| `mobile/src/screens/driver/DriverHomeScreen.tsx` | 325, 351, 623 | `style={{ alignItems }}, style={{ marginBottom }}` | Move to StyleSheet using spacing/theme |
| `mobile/src/screens/driver/EditVehicleScreen.tsx` | 81 | `style={{ color: c.text }}` | Use theme text color in StyleSheet |
| `mobile/src/components/RideCard.tsx` | 130, 170, 214 | `style={{ transform: [{ scale }] }}` (animation) | Allow for animation; ensure no literal colors/sizes |
| `mobile/src/navigation/AppNavigator.tsx` | 87 | `style={{ height, width, resizeMode, borderRadius }}` | Use sizes.logo + radii.sm from theme (already token-backed; verify no literals) |
| `mobile/App.tsx` | 55 | `style={{ flex: 1 }}` | Layout-only; acceptable or move to StyleSheet |
| `mobile/src/components/DriverPinPulse.tsx` | 75 | `style={{ transform }}` (animation) | Allow for animation |

### 3.4 Violations: hardcoded numeric visual values

| File | Note |
|------|------|
| `mobile/src/screens/passenger/PassengerHomeScreen.tsx` | fontSize 32, lineHeight 38, width 80, borderRadius (radii.xl + 8) – use typography/sizes/radii |
| `mobile/src/screens/driver/DriverHomeScreen.tsx` | fontSize 24, borderRadius 12/16/24, paddingTop (spacing.lg + 24) – use theme |
| `mobile/src/screens/driver/PublishRideScreen.tsx` | borderRadius 24/16, minHeight 24 – use radii and spacing |
| `mobile/src/screens/shared/ProfileScreen.tsx` | avatar 96/112, borderBottomLeftRadius 48, borderRadius 40 – use sizes.avatar and radii |
| `mobile/src/components/DateTimePicker.tsx` | borderTopLeftRadius 28, maxHeight 400, day cell width 13% – use radii and layout tokens |
| `mobile/src/navigation/DriverTabBar.tsx` | marginTop -28, button 56x56, label fontSize 9 – use layout/typography tokens |

---

## 4. Summary counts (pre-migration)

| App | Literal colors/shadows | Arbitrary Tailwind | Inline style (visual) | Literal numeric (mobile) |
|-----|------------------------|--------------------|------------------------|---------------------------|
| landing-page | styles.css: many lines (see 1.2) | DateTimePicker + any other | 0 | N/A |
| admin-web | 0 in components (vars in CSS) | 60+ instances across pages | 3 | N/A |
| mobile | 5 files, ~10 lines | N/A | 6+ files (layout/animation mixed) | 6+ files |

---

## 5. Migration status

- [x] **Landing:** Non-:root literals in styles.css replaced with vars; DateTimePicker uses token-backed classes and `.lp-modal-backdrop`.
- [x] **Admin:** `rounded-[32px]` → `rounded-xl`; `text-[10px]`/`text-[11px]` → `text-xs`/`text-sm`; arbitrary w/h → theme (`min-h-10`, `max-w-md`, `w-modal`, `z-modal`).
- [x] **Mobile:** Literal 'white'/'transparent' replaced with `colors.surface`/`colors.buttonSecondaryBg`; radii/spacing aligned to contract.

## 6. Deliverables

| Deliverable | Location |
|-------------|----------|
| Token contract (human + rules) | `shared/design-tokens/CONTRACT.md` |
| Token values (machine-readable) | `shared/design-tokens/values.json` |
| Audit report | `docs/STYLE_AUDIT_REPORT.md` (this file) |
| Guardrail script | `scripts/check-design-tokens.js` (run from repo root: `node scripts/check-design-tokens.js`) |
| Normalized token sources | `landing-page/src/styles.css`, `landing-page/tailwind.config.js`, `admin-web/tailwind.config.js`, `admin-web/src/styles.css`, `mobile/src/utils/theme.ts`, `mobile/src/utils/layout.ts` |
