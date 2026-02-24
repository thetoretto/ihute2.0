export const colors = {
  background: '#f8fafc',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  card: '#FFFFFF',

  text: '#054752',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  onPrimary: '#FFFFFF',

  primary: '#00AFF5',
  primaryDark: '#0084b8',
  accent: '#00AFF5',

  buttonPrimaryBg: '#00AFF5',
  buttonPrimaryText: '#FFFFFF',
  primaryButtonBorder: 'rgba(0,175,245,0.5)',
  buttonSecondaryBg: '#e2e8f0',
  buttonSecondaryText: '#054752',
  primaryTextOnLight: '#054752',

  popupSurface: '#FFFFFF',

  success: '#00D382',
  successLight: '#5EEAD4',
  successTint: 'rgba(0,211,130,0.12)',
  info: '#1E88E5',
  neutral: '#64748B',

  error: '#FF4757',
  warning: '#B7791F',

  border: '#f1f5f9',
  borderLight: '#f1f5f9',
  overlay: 'rgba(5,71,82,0.35)',
  primaryTint: 'rgba(0,175,245,0.14)',
  ghostBg: '#f8fafc',
  ghostBorder: '#f1f5f9',
  ghostText: '#64748B',

  /** Tab bar background. */
  tabBarBackground: '#FFFFFF',

  /** Passenger / brand (template). */
  passengerBrand: '#00AFF5',
  passengerDark: '#054752',
  passengerBgLight: '#f8fafc',
  passengerOnBrand: '#FFFFFF',

  /** Driver context (dark teal). */
  driverDark: '#054752',

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
  onPrimary: '#FFFFFF',
  popupSurface: '#252D38',
  ghostBg: '#1E252D',
  ghostText: '#94A9BC',
  border: 'rgba(241,245,249,0.18)',
  borderLight: 'rgba(241,245,249,0.10)',
  overlay: 'rgba(0,0,0,0.5)',
  primaryTint: 'rgba(0,175,245,0.18)',
  tabBarBackground: '#1E252D',
  passengerBrand: '#00AFF5',
  passengerDark: '#054752',
  passengerBgLight: '#1E252D',
  passengerOnBrand: '#FFFFFF',
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
