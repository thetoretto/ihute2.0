# Consistency audit (Phase 1)

## Padding / horizontal content

| Area | Current value | Source |
|------|----------------|--------|
| Passenger Home | `landingHeaderPaddingHorizontal` (24), `screenContentPadding` (spacing.sm = 8) | Mixed |
| Passenger My Rides | `screenContentPadding` | layout.screen.horizontal |
| SearchResults | `screenContentPadding`, `searchResultsListPadding` | layout |
| Driver screens (Home, My Rides, Publish, VehicleGarage, ScanTicket, Notifications, Activity, Report, Add/Edit Vehicle) | `driverContentHorizontal` | layout.driver.contentHorizontal = spacing.md (16) |
| Profile | `spacing.lg` (24) for content/section | theme |
| Shared (Notifications, Wallet) | `spacing.lg` | theme |

**Inconsistency:** Three different horizontal insets: 8 (screenContentPadding), 16 (driverContentHorizontal), 24 (landing + Profile). Standardize on one (24 = landingHeaderPaddingHorizontal) for common look.

## Typography

- **ProfileScreen:** Hardcoded `fontSize: 24, 20, 12, 10, 9` in driver and non-driver blocks; should use typography.h2, bodySmall, caption, overline.
- **PassengerMyRidesScreen:** fontSize 10, 24; use typography.caption, h2.
- **PassengerHomeScreen:** Many inline fontSize (9–28) and fontWeight; align with typography.*.
- **DriverHomeScreen:** fontSize 9, 10, 12, 18, 22, 24; static `colors.*` in StyleSheet; use typography tokens and useThemeColors().
- **PublishRideScreen, DriverMyRidesScreen:** Multiple inline font sizes; use typography.*.
- **Other screens:** Various fontWeight overrides; prefer typography semantic variants where they exist.

## Colors

- **Static `colors.*` in StyleSheet:** DriverHomeScreen, DriverScanTicketScreen, ScannerReportScreen, PublishRideScreen, LoginScreen, RegisterScreen, OnboardingScreen, CompleteProfileScreen, VerifyOTPScreen, ProfileScreen (shadowColor). These do not respond to theme/dark mode. Replace with `useThemeColors()` and pass `c.*` into styles or use dynamic styles.
- **ProfileScreen:** shadowColor: colors.cardShadowColor in StyleSheet; make dynamic.

## Headers

- Landing screens use `LandingHeader` (Passenger Home, Driver Home, Profile, Passenger My Rides). Consistent.
- Sub-pages use stack header or in-screen header; no mixed pattern found.

## Profile-specific

- Driver block: `marginTop: -24` on stats row (overlap); avatar 112px; font sizes 24, 20, 12, 10.
- Non-driver block: avatar 96px; font sizes 20, 10, 9 in statBox.
- Both: Use `sizes.avatar` and typography tokens; remove negative margin.

## Cards / lists

- Card radius and padding vary (radii.xl, radii.cardLarge, spacing.md, spacing.lg). layout.card.radius and spacing.md/lg used; some one-offs (e.g. borderBottomLeftRadius: radii.xl + 8). Standardize on layout.card.radius and spacing constants.

## Touch targets

- Theme has sizes.touchTarget.min (44) and iconButton (40). Most icon buttons use iconButton (40); ensure no tappable area < 44 where possible.

---

## Phase 2–4 implementation summary

- **Phase 2:** layout.ts updated so `layout.screen.horizontal` and `layout.driver.contentHorizontal` both use `spacing.lg` (24px). All screens using `screenContentPadding` or `driverContentHorizontal` now share the same horizontal inset.
- **Phase 3:** ProfileScreen user-details block redesigned: unified padding via `landingHeaderPaddingHorizontal`, avatar sizes from `sizes.avatar.xl`, typography from theme (h2, caption, overline), negative margin removed; shadow color applied dynamically.
- **Phase 4:** NotificationsScreen and WalletScreen use `landingHeaderPaddingHorizontal` for content padding. Remaining static `colors.*` in StyleSheets (e.g. DriverHomeScreen, PublishRideScreen) can be migrated to `useThemeColors()` in a later pass.
