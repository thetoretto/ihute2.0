/**
 * Design system – mobile theme
 *
 * Core palette (6 colors): All token values are derived from these or from
 * documented extended palette (success, warning, agency).
 *
 * Light: Surfaces = cream (#F8F3EF) + white; text = dark (#171C22) + muted (#94A9BC);
 * primary/CTA = yellow (#FEE46B); critical = red (#DF0827).
 *
 * Dark: Elevation = #171C22 → #1E252D → #252D38; body text = cream (#F8F3EF);
 * links = muted (#94A9BC); captions/tertiary = lavender (#E6DBEB).
 *
 * Extended: success (green), warning (amber), agency (indigo) for semantic/role use.
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

  // --- Role (passenger, driver, agency) ---
  passengerBrand: CORE_YELLOW,
  passengerDark: CORE_DARK,
  passengerBgLight: CORE_CREAM,
  passengerOnBrand: CORE_DARK,
  driverDark: CORE_DARK,
  agency: '#6366f1',
  agencyDark: '#4f46e5',
  agencyTint: 'rgba(99,102,241,0.14)',
  agencyBorder: 'rgba(99,102,241,0.5)',

  // --- Semantic (extended palette) ---
  success: '#00D382',
  successLight: '#5EEAD4',
  successTint: 'rgba(0,211,130,0.12)',
  warning: '#B7791F',
  warningTint: 'rgba(183,121,31,0.12)',
  info: '#1E88E5',
  starRating: '#FBBF24',

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

  // --- Tints ---
  primaryTint: 'rgba(254,228,107,0.18)',
  errorTint: 'rgba(223,8,39,0.18)',
  warningTint: 'rgba(183,121,31,0.18)',

  onAccent: ON_ACCENT,
} as const;

export type ColorScheme = 'light' | 'dark';

export const spacing = {
  xxs: 2,
  xs: 4,
  smDense: 6,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  xxs: 3,
  xs: 6,
  sm: 8,
  smMedium: 12,
  button: 20,
  md: 16,
  lg: 28,
  xl: 40,
  xxl: 28,
  xlMobile: 32,
  panel: 24,
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
