# Design Token Contract (Cross-App)

This document defines the **single source of truth** for visual design tokens used across **mobile**, **landing-page**, and **admin-web**. Each app keeps its own style sources (CSS variables, Tailwind config, or theme.ts) but must map to this contract so all platforms share the same palette, typography, spacing, radius, and elevation.

---

## 1. Colors (semantic)

| Token | Value | Usage |
|-------|--------|--------|
| `primary` | #FEE46B | CTAs, links, active states, highlights |
| `primaryActive` | #FDD835 | Primary hover/pressed |
| `onPrimary` | #171C22 | Text/icons on primary background |
| `background` | #F8F3EF | Page/screen background |
| `surface` | #FFFFFF | Cards, panels, inputs |
| `text` | #171C22 | Primary text |
| `muted` | #64748B (or #94A9BC) | Secondary text, captions |
| `error` | #DF0827 | Errors, destructive actions |
| `border` | #E6DBEB | Borders, dividers (alias: soft) |
| `success` | #22c55e (or #10B981) | Success states |
| `warning` | #B7791F | Warnings |
| `dark` | #171C22 | Dark surfaces (headers, footers) |
| `darkElevation1` | #1E252D | Dark mode surface 1 |
| `darkElevation2` | #252D38 | Dark mode surface 2 |

Alpha variants (e.g. primary tint, overlay) must be derived from these base values in each app’s token file; no ad-hoc rgba in components.

---

## 2. Typography scale

| Token | Font size | Weight | Use |
|-------|-----------|--------|-----|
| `xs` | 10px | 700 | Overlines, labels |
| `sm` | 12px | 400/700 | Captions, meta |
| `md` | 14px | 400/600 | Body small, inputs |
| `base` | 16px | 400/700 | Body, buttons |
| `lg` | 18px | 600/800 | Subheadings |
| `xl` | 20–22px | 700 | H3 |
| `2xl` | 28px | 700 | H2 |
| `3xl` | 31–44px (clamp ok) | 700/800 | H1 |

Font family: **Poppins** (or system sans fallback). No hardcoded font-size in components; use token names.

---

## 3. Spacing scale

Use a single scale. Prefer: **4, 8, 12, 16, 24, 32, 40, 48** (px or equivalent). Optional: 2, 6, 20 for fine tuning only in token files.

- No arbitrary spacing values (e.g. 7, 11, 13) in components.
- Map gutter, padding, margin to these steps.

---

## 4. Border radius (moderate only)

| Token | Value | Use |
|-------|--------|-----|
| `sm` | 8px | Buttons, inputs, chips |
| `md` | 12px | Cards, panels |
| `lg` | 16px | Modals, large cards |
| `xl` | 24px | Max for cards/sheets |
| `pill` | 9999px | Pills, full-round buttons |

**Rule:** No “deep” or very large radii (e.g. avoid 32px, 40px, 48px for standard UI). Use at most `lg`/`xl` for corners; reserve larger values only for special cases (e.g. mobile sheet top corners) and define them in the app token file, not inline.

---

## 5. Elevation (shadows)

| Token | Use |
|-------|-----|
| `none` | No shadow |
| `soft` | 0 8px 30px rgb(0 0 0 / 0.04) or equivalent |
| `medium` | 0 4px 12px rgb(0 0 0 / 0.06) or equivalent |

Define in each app; no ad-hoc box-shadow values in components.

---

## 6. Migration rules (enforced)

1. **No hardcoded colors** in components: no hex, rgb, rgba, or named colors (e.g. `white`, `transparent`) except in approved token/theme files.
2. **No hardcoded font-size, line-height, or letter-spacing** in components; use typography tokens.
3. **No hardcoded spacing** (padding, margin, gap) in components; use spacing scale tokens.
4. **No hardcoded border-radius** in components; use radius tokens (sm/md/lg/xl/pill).
5. **No inline style objects** for visual properties (color, fontSize, padding, margin, borderRadius, etc.); use StyleSheet/className/token-backed utilities.
6. **No arbitrary Tailwind values** (e.g. `rounded-[32px]`, `text-[10px]`, `w-[420px]`); use theme-extended utilities or token-backed classes.

Approved token files (only places where literal values are allowed):

- **landing-page:** `landing-page/src/styles.css` (`:root` and class definitions)
- **admin-web:** `admin-web/tailwind.config.js`, `admin-web/src/styles.css`
- **mobile:** `mobile/src/utils/theme.ts`, `mobile/src/utils/layout.ts`

**CI guardrail:** Run `node scripts/check-design-tokens.js` from the repo root to fail on new violations (literal colors in mobile, arbitrary Tailwind in admin-web, hex in landing components).

---

## 7. Consistency checklist

- Buttons: same primary color, same radius (sm or md).
- Inputs: same border color, same radius (sm).
- Cards: same surface color, same radius (md or lg), same elevation (soft).
- Modals/panels: radius lg/xl at most; no deep rounding.
