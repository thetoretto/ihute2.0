export const colors = {
  background:       '#FFFFFF',
  surface:          '#FFFFFF',
  surfaceElevated:  '#FFFFFF',
  card:             '#FFFFFF',

  text:             '#171C22',
  textSecondary:    '#94A9BC',
  textMuted:        '#94A9BC',
  onPrimary:        '#171C22',

  primary:          '#FEE46B',
  primaryDark:      '#D9C25B',
  accent:           '#FEE46B',

  buttonPrimaryBg: '#171C22',
  buttonPrimaryText: '#FEE46B',
  buttonSecondaryBg: '#94A9BC',
  buttonSecondaryText: '#171C22',
  popupSurface:     '#F8F3EF',

  success:          '#2E7D32',
  successLight:     '#66BB6A',
  info:             '#1E88E5',
  neutral:          '#64748B',

  error:            '#DF0827',
  warning:          '#B7791F',

  border:           'rgba(23,28,34,0.18)',
  borderLight:      'rgba(23,28,34,0.10)',
  overlay:          'rgba(23,28,34,0.35)',
  primaryTint:      'rgba(254,228,107,0.14)',
  successTint:      'rgba(46,125,50,0.12)',
} as const;

export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

export const radii = {
  sm:   6,
  md:   12,
  lg:   16,
  xl:   24,
  full: 9999,
} as const;
