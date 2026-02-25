export const colors = {
  background: '#F8F3EF',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  card: '#FFFFFF',

  text: '#171C22',
  textSecondary: '#94A9BC',
  textMuted: '#94A9BC',
  onPrimary: '#171C22',

  primary: '#FEE46B',
  primaryDark: '#FDD835',
  accent: '#DF0827',

  buttonPrimaryBg: '#FEE46B',
  buttonPrimaryText: '#171C22',
  primaryButtonBorder: 'rgba(254,228,107,0.5)',
  buttonSecondaryBg: 'transparent',
  buttonSecondaryText: '#94A9BC',
  primaryTextOnLight: '#171C22',

  popupSurface: '#FFFFFF',

  /** Semantic: deep neutral (tab bar, premium card). */
  dark: '#171C22',
  /** Semantic: highlight/tertiary, empty states. */
  soft: '#E6DBEB',
  /** Primary pressed state. */
  primaryActive: '#FDD835',

  success: '#00D382',
  successLight: '#5EEAD4',
  successTint: 'rgba(0,211,130,0.12)',
  info: '#1E88E5',
  neutral: '#94A9BC',

  error: '#DF0827',
  warning: '#B7791F',

  border: '#E6DBEB',
  borderLight: '#E6DBEB',
  overlay: 'rgba(23,28,34,0.35)',
  primaryTint: 'rgba(254,228,107,0.1)',
  ghostBg: '#F8F3EF',
  ghostBorder: '#E6DBEB',
  ghostText: '#94A9BC',

  /** Tab bar background (dark). */
  tabBarBackground: '#171C22',

  /** Passenger / brand = primary. */
  passengerBrand: '#FEE46B',
  passengerDark: '#171C22',
  passengerBgLight: '#F8F3EF',
  passengerOnBrand: '#171C22',

  /** Driver context (dark). */
  driverDark: '#171C22',

  /** Agency role (indigo). */
  agency: '#6366f1',
  agencyDark: '#4f46e5',
  agencyTint: 'rgba(99,102,241,0.14)',
} as const;

/** Dark theme colors. Use with ThemeContext for light/dark switching. */
export const colorsDark = {
  ...colors,
  background: '#171C22',
  surface: '#1E252D',
  surfaceElevated: '#252D38',
  card: '#1E252D',
  text: '#F1F5F9',
  textSecondary: '#94A9BC',
  textMuted: '#94A9BC',
  onPrimary: '#171C22',
  popupSurface: '#252D38',
  ghostBg: '#1E252D',
  ghostText: '#94A9BC',
  border: 'rgba(241,245,249,0.18)',
  borderLight: 'rgba(241,245,249,0.10)',
  overlay: 'rgba(0,0,0,0.5)',
  primaryTint: 'rgba(254,228,107,0.18)',
  tabBarBackground: '#171C22',
  passengerBrand: '#FEE46B',
  passengerDark: '#171C22',
  passengerBgLight: '#1E252D',
  passengerOnBrand: '#171C22',
} as const;

export type ColorScheme = 'light' | 'dark';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 8,
  button: 20,
  md: 16,
  lg: 28,
  xl: 40,
  xxl: 28,
  xlMobile: 32,
  full: 9999,
} as const;

/** Card shadow (template-style). */
export const cardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
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
} as const;
