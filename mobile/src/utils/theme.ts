/**
 * Design system – mobile theme
 *
 * All UI color tokens are derived from the 6-color palette only:
 *   #171C22 (dark) – text, headers, tab bar, primary dark surfaces
 *   #F8F3EF (cream) – backgrounds, on-dark text
 *   #DF0827 (red) – accent, error, critical, agency role
 *   #94A9BC (muted) – secondary text, borders, info
 *   #E6DBEB (lavender) – borders, subtle surfaces
 *   #FEE46B (yellow) – primary CTA, success, warning, star rating
 *
 * Light: Surfaces = cream + white; text = dark + muted; primary/CTA = yellow; critical = red.
 * Dark: Elevation from dark; body text = cream; borders = lavender rgba.
 */

// --- Core palette (single source of truth) ---
const CORE_DARK = '#171C22';
const CORE_CREAM = '#F8F3EF';
const CORE_RED = '#DF0827';
const CORE_MUTED = '#94A9BC';
const CORE_LAVENDER = '#E6DBEB';
const CORE_YELLOW = '#FEE46B';

/** Primary pressed state (derived from CORE_YELLOW). */
const PRIMARY_PRESSED = '#FDD835';

/** Dark mode elevation: base, elevation 1, elevation 2 (derived from CORE_DARK). */
const ELEVATION_1 = '#1E252D';
const ELEVATION_2 = '#252D38';

/** Text on red/agency buttons (not in core 6). */
const ON_ACCENT = '#FFFFFF';

export const corePalette = {
  dark: CORE_DARK,
  cream: CORE_CREAM,
  red: CORE_RED,
  muted: CORE_MUTED,
  lavender: CORE_LAVENDER,
  yellow: CORE_YELLOW,
} as const;

export const colors = {
  // --- Surfaces ---
  background: CORE_CREAM,
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  card: '#FFFFFF',
  popupSurface: '#FFFFFF',
  ghostBg: CORE_CREAM,

  // --- Text hierarchy ---
  text: CORE_DARK,
  textSecondary: CORE_MUTED,
  textMuted: CORE_MUTED,
  onPrimary: CORE_DARK,
  buttonPrimaryText: CORE_DARK,
  buttonSecondaryText: CORE_MUTED,
  primaryTextOnLight: CORE_DARK,
  ghostText: CORE_MUTED,
  neutral: CORE_MUTED,

  // --- Primary & CTA ---
  primary: CORE_YELLOW,
  primaryDark: PRIMARY_PRESSED,
  primaryActive: PRIMARY_PRESSED,
  buttonPrimaryBg: CORE_YELLOW,
  primaryButtonBorder: 'rgba(254,228,107,0.5)',
  buttonSecondaryBg: 'transparent',
  primaryTint: 'rgba(254,228,107,0.1)',

  // --- Critical action ---
  accent: CORE_RED,
  error: CORE_RED,
  errorTint: 'rgba(223,8,39,0.12)',

  // --- Borders ---
  border: CORE_LAVENDER,
  borderLight: CORE_LAVENDER,
  ghostBorder: CORE_LAVENDER,
  soft: CORE_LAVENDER,
  cardBorder: CORE_LAVENDER,

  // --- Dark surfaces & on-dark ---
  dark: CORE_DARK,
  tabBarBackground: CORE_DARK,
  onDarkText: CORE_CREAM,
  onDarkTextMuted: 'rgba(248,243,239,0.7)',
  tabBarBorder: 'rgba(254,228,107,0.15)',
  decorativeLight: 'rgba(255,255,255,0.06)',
  surfaceOnDark: 'rgba(255,255,255,0.15)',
  surfaceOnDarkSubtle: 'rgba(255,255,255,0.1)',
  surfaceOnDarkOrb: 'rgba(255,255,255,0.05)',

  // --- Overlays ---
  overlay: 'rgba(23,28,34,0.35)',
  overlayModal: 'rgba(0,0,0,0.4)',

  // --- App-wide design system (all roles: headers, nav, surfaces) ---
  /** Headers, main buttons – from palette dark. */
  appPrimary: CORE_DARK,
  /** CTAs, active nav, focus – from palette yellow. */
  appAccent: CORE_YELLOW,
  /** Online, confirmed, success – from palette yellow. */
  appSuccess: CORE_YELLOW,
  /** Main screen background – from palette cream. */
  appBackground: CORE_CREAM,
  /** Inactive tab bar icon color. */
  navInactiveIcon: CORE_DARK,
  /** Text/icons on appPrimary (e.g. header). */
  onAppPrimary: ON_ACCENT,
  /** Floating tab bar background (80% opacity). */
  tabBarBlurBg: 'rgba(255,255,255,0.8)',
  /** Toast background – from palette dark. */
  toastBackground: CORE_DARK,
  /** Toast border. */
  toastBorder: 'rgba(255,255,255,0.1)',
  /** Muted text/icon on appPrimary background. */
  onAppPrimaryMuted: 'rgba(255,255,255,0.6)',
  /** Soft line/divider on appPrimary. */
  onAppPrimarySoft: 'rgba(255,255,255,0.2)',
  /** Button overlay on dark (e.g. "View ride"). */
  surfaceOverlay: 'rgba(0,0,0,0.2)',
  /** Light surface for stat cards – from palette lavender. */
  appSurfaceMuted: CORE_LAVENDER,
  /** Text on success/live blocks – from palette dark. */
  appSuccessDark: CORE_DARK,
  /** Shadow for cards (design system). */
  cardShadowColor: CORE_DARK,

  // --- Role (passenger, driver, agency) ---
  passengerBrand: CORE_YELLOW,
  passengerDark: CORE_DARK,
  passengerBgLight: CORE_CREAM,
  passengerOnBrand: CORE_DARK,
  driverDark: CORE_DARK,
  /** Driver app – from palette. */
  driverPrimary: CORE_DARK,
  driverAccent: CORE_YELLOW,
  driverBg: CORE_CREAM,
  driverInstaGreen: CORE_YELLOW,
  driverPrimaryTint: 'rgba(23,28,34,0.08)',
  driverAccentTint: 'rgba(254,228,107,0.12)',
  driverInstaGreenTint: 'rgba(254,228,107,0.12)',
  agency: CORE_RED,
  agencyDark: CORE_RED,
  agencyTint: 'rgba(223,8,39,0.14)',
  agencyBorder: 'rgba(223,8,39,0.5)',

  // --- Semantic (from palette) ---
  success: CORE_YELLOW,
  successLight: CORE_YELLOW,
  successTint: 'rgba(254,228,107,0.12)',
  warning: CORE_YELLOW,
  warningTint: 'rgba(254,228,107,0.12)',
  info: CORE_MUTED,
  starRating: CORE_YELLOW,

  // --- Other ---
  onAccent: ON_ACCENT,
} as const;

/** Dark theme colors. Use with ThemeContext for light/dark switching. */
export const colorsDark = {
  ...colors,

  // --- Surfaces (elevation) ---
  background: CORE_DARK,
  surface: ELEVATION_1,
  surfaceElevated: ELEVATION_2,
  card: ELEVATION_1,
  popupSurface: ELEVATION_2,
  ghostBg: ELEVATION_1,

  // --- App-wide (dark mode) – from palette ---
  appPrimary: CORE_DARK,
  appAccent: CORE_YELLOW,
  appSuccess: CORE_YELLOW,
  appBackground: ELEVATION_1,
  navInactiveIcon: CORE_CREAM,
  onAppPrimary: ON_ACCENT,
  tabBarBlurBg: 'rgba(30,37,45,0.9)',
  toastBackground: CORE_DARK,
  toastBorder: 'rgba(255,255,255,0.1)',
  onAppPrimaryMuted: 'rgba(255,255,255,0.6)',
  onAppPrimarySoft: 'rgba(255,255,255,0.2)',
  surfaceOverlay: 'rgba(0,0,0,0.2)',
  appSurfaceMuted: ELEVATION_2,
  appSuccessDark: CORE_DARK,
  cardShadowColor: CORE_DARK,

  // --- Text hierarchy ---
  text: CORE_CREAM,
  textSecondary: CORE_MUTED,
  textMuted: CORE_LAVENDER,
  onPrimary: CORE_DARK,
  ghostText: CORE_MUTED,

  // --- Borders ---
  border: 'rgba(248,243,239,0.18)',
  borderLight: 'rgba(248,243,239,0.1)',
  cardBorder: 'rgba(248,243,239,0.12)',

  // --- Dark surfaces & on-dark ---
  tabBarBackground: CORE_DARK,
  onDarkText: CORE_CREAM,
  onDarkTextMuted: 'rgba(248,243,239,0.7)',
  tabBarBorder: 'rgba(254,228,107,0.2)',
  decorativeLight: 'rgba(255,255,255,0.08)',
  surfaceOnDark: 'rgba(255,255,255,0.18)',
  surfaceOnDarkSubtle: 'rgba(255,255,255,0.12)',
  surfaceOnDarkOrb: 'rgba(255,255,255,0.06)',

  // --- Overlays ---
  overlay: 'rgba(0,0,0,0.5)',
  overlayModal: 'rgba(0,0,0,0.5)',

  // --- Role ---
  passengerBrand: CORE_YELLOW,
  passengerDark: CORE_DARK,
  passengerBgLight: ELEVATION_1,
  passengerOnBrand: CORE_DARK,
  driverPrimary: CORE_DARK,
  driverAccent: CORE_YELLOW,
  driverBg: CORE_CREAM,
  driverInstaGreen: CORE_YELLOW,
  driverPrimaryTint: 'rgba(23,28,34,0.15)',
  driverAccentTint: 'rgba(254,228,107,0.15)',
  driverInstaGreenTint: 'rgba(254,228,107,0.15)',

  // --- Tints (from palette) ---
  primaryTint: 'rgba(254,228,107,0.18)',
  errorTint: 'rgba(223,8,39,0.18)',
  warningTint: 'rgba(254,228,107,0.18)',

  onAccent: ON_ACCENT,
} as const;

export type ColorScheme = 'light' | 'dark';

/** Spacing scale – aligned with shared/design-tokens/CONTRACT.md (4,8,12,16,24,32,40,48). */
export const spacing = {
  xxs: 2,
  xs: 4,
  smDense: 6,
  sm: 8,
  smMd: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xlLg: 40,
  xxl: 48,
} as const;

/** Border radius – aligned with shared/design-tokens/CONTRACT.md (sm/md/lg/xl, no deep radii). */
export const radii = {
  xxs: 3,
  xs: 6,
  sm: 8,
  smMedium: 12,
  md: 12,
  lg: 16,
  xl: 24,
  /** Buttons – contract md (12px). */
  button: 12,
  panel: 24,
  cardLarge: 24,
  xlMobile: 24,
  xxl: 24,
  cardXLarge: 24,
  full: 9999,
} as const;

/** Layout / box sizes – icons, avatars, touch targets. */
export const sizes = {
  icon: { small: 12, mid: 16, medium: 20, large: 24 },
  avatar: { xs: 24, sm: 32, md: 36, lg: 48, xl: 56 },
  touchTarget: { min: 44, iconButton: 40 },
  timelineDot: 8,
  timelineDotLg: 12,
  routeDot: 10,
  sheetHandle: { width: 40, height: 4 },
  logo: { width: 56, height: 32 },
} as const;

/** Border widths for timeline dots, badges, buttons. */
export const borderWidths = {
  thin: 1,
  medium: 2,
} as const;

/** Card shadow (template-style). Shadow color aligned with core palette. */
export const cardShadow = {
  shadowColor: CORE_DARK,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 20,
  elevation: 4,
};

/** Stronger card shadow for elevated panels (e.g. booking summary). */
export const cardShadowStrong = {
  shadowColor: CORE_DARK,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 12,
  elevation: 6,
};

/** Card shadow (design system) – from palette dark. */
export const cardShadowTeal = {
  shadowColor: CORE_DARK,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 20,
  elevation: 4,
};

export const buttonHeights = {
  small: 38,
  medium: 44,
  large: 52,
} as const;

export const typography = {
  h1:        { fontSize: 28, fontWeight: '700' as const, fontFamily: 'Poppins_700Bold' },
  h2:        { fontSize: 22, fontWeight: '700' as const, fontFamily: 'Poppins_700Bold' },
  h3:        { fontSize: 18, fontWeight: '600' as const, fontFamily: 'Poppins_600SemiBold' },
  body:      { fontSize: 16, fontWeight: '400' as const, fontFamily: 'Poppins_400Regular' },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, fontFamily: 'Poppins_400Regular' },
  caption:   { fontSize: 12, fontWeight: '400' as const, fontFamily: 'Poppins_400Regular' },
  /** Semantic variants – use instead of ad‑hoc fontSize overrides. */
  overline:  { fontSize: 10, fontWeight: '700' as const, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  bodyBold:  { fontSize: 16, fontWeight: '700' as const, fontFamily: 'Poppins_700Bold' },
  bodyBold18: { fontSize: 18, fontWeight: '800' as const, fontFamily: 'Poppins_700Bold' },
  price:     { fontSize: 15, fontWeight: '700' as const, fontFamily: 'Poppins_700Bold' },
  priceLg:   { fontSize: 18, fontWeight: '800' as const, fontFamily: 'Poppins_700Bold' },
  time:      { fontSize: 20, fontWeight: '800' as const, fontFamily: 'Poppins_700Bold' },
  timeLg:    { fontSize: 24, fontWeight: '800' as const, fontFamily: 'Poppins_700Bold' },
  driverName: { fontSize: 13, fontWeight: '600' as const, fontFamily: 'Poppins_600SemiBold' },
  driverNameLg: { fontSize: 18, fontWeight: '800' as const, fontFamily: 'Poppins_700Bold' },
  captionBold: { fontSize: 12, fontWeight: '700' as const, fontFamily: 'Poppins_700Bold' },
  caption10: { fontSize: 10, fontWeight: '400' as const, fontFamily: 'Poppins_400Regular' },
  caption11: { fontSize: 11, fontWeight: '400' as const, fontFamily: 'Poppins_400Regular' },
  caption9: { fontSize: 9, fontWeight: '700' as const, fontFamily: 'Poppins_700Bold', letterSpacing: 0.5 },
  totalPrice: { fontSize: 22, fontWeight: '800' as const, fontFamily: 'Poppins_700Bold' },
  timeDisplayLg: { fontSize: 48, fontWeight: '300' as const, fontFamily: 'Poppins_400Regular' },
  timeColon: { fontSize: 32, fontWeight: '300' as const, fontFamily: 'Poppins_400Regular' },
} as const;
