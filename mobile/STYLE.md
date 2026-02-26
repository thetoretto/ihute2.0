# Mobile app design system

This document describes how to keep the mobile app's look and feel consistent and maintainable.

## Design tokens

- **Colors, spacing, radii, typography:** Use only values from [src/utils/theme.ts](src/utils/theme.ts). For colors, prefer `useThemeColors()` from `ThemeContext` so light/dark mode is respected; in static `StyleSheet.create` use the `colors` export from theme.
- **Layout:** Use [src/utils/layout.ts](src/utils/layout.ts) for `screenContentPadding`, `listBottomPaddingTab`, `cardRadius`, `sectionTitleStyle`, etc.
- **No hardcoded values:** Do not use literal hex colors (e.g. `#FFFFFF`), `rgba(...)`, or magic numbers for spacing/radius/font size in screens or components. Add new semantic tokens to `theme.ts` (and `colorsDark` when applicable) if you need a new color or layout constant.

## Shared components

Use these for a consistent UI:

- **Screen** – Page wrapper with safe area and optional scroll; applies theme background and content padding.
- **Button** – Primary, secondary, outline, ghost, agency, danger variants; uses theme only.
- **Input** – Text field with optional label and error; uses theme.
- **Card** – Container with background, border, radius, optional shadow; `variant`: `'elevated' | 'outlined'`.
- **ScreenHeader** – In-screen header (back, title, right action) for screens with `headerShown: false`.
- **BottomSheet** – Modal overlay + sheet with handle; use for sort, filters, pickers.
- **EmptyState** – Centered icon + title + optional subtitle.
- **RideCard, ExpansionDetailsCard, PaymentMethodIcons, etc.** – Use theme colors only.

For modals and pickers that must follow theme (e.g. dark mode), use the **useSelectorStyles()** hook from [src/utils/useSelectorStyles.ts](src/utils/useSelectorStyles.ts) instead of the static `selectorStyles` where appropriate.

## Typography and layout

- Use `typography.h1 | h2 | h3 | body | bodySmall | caption` from theme; avoid inline `fontSize` or `fontWeight` in StyleSheets.
- Section headings should use `sectionTitleStyle` from layout or the same typography tokens.
- Horizontal padding and list bottom padding should come from layout or theme `spacing`.

## Navigation

- Stack and tab bar styles (header, tab bar, borders) use `useThemeColors()` in [AppNavigator](src/navigation/AppNavigator.tsx). New tokens (e.g. `tabBarBorder`) are defined in theme.

Following these rules keeps the app clean, symmetric, and easy to change globally via theme and layout.
