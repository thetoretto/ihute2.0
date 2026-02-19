// #region agent log
if (typeof fetch !== 'undefined') { fetch('http://127.0.0.1:7242/ingest/e2426e2f-6eb8-4ea6-91af-e79e0dbac3a5',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f694c9'},body:JSON.stringify({sessionId:'f694c9',location:'theme.ts:exports',message:'theme module loaded',data:{},timestamp:Date.now(),hypothesisId:'H3'})}).catch(()=>{}); }
// #endregion
export const colors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  card: '#FFFFFF',

  text: '#171C22',
  textSecondary: '#94A9BC',
  textMuted: '#94A9BC',
  onPrimary: '#171C22',

  primary: '#FEE46B',
  primaryDark: '#E5B840',
  accent: '#FEE46B',

  buttonPrimaryBg: '#FEE46B',
  buttonPrimaryText: '#171C22',
  primaryButtonBorder: 'rgba(254,228,107,0.5)',
  buttonSecondaryBg: '#94A9BC',
  buttonSecondaryText: '#171C22',
  primaryTextOnLight: '#171C22',

  popupSurface: '#F8F3EF',

  success: '#2E7D32',
  successLight: '#66BB6A',
  info: '#1E88E5',
  neutral: '#64748B',

  error: '#DF0827',
  warning: '#B7791F',

  border: 'rgba(23,28,34,0.18)',
  borderLight: 'rgba(23,28,34,0.10)',
  overlay: 'rgba(23,28,34,0.35)',
  primaryTint: 'rgba(254,228,107,0.14)',
  successTint: 'rgba(46,125,50,0.12)',
  ghostBg: '#FFFFFF',
  ghostBorder: 'rgba(23,28,34,0.18)',
  ghostText: '#94A9BC',

  /** Tab bar background (light grey). */
  tabBarBackground: '#F1F5F9',
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
  tabBarBackground: '#1E252D',
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
  sm: 6,
  button: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

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
