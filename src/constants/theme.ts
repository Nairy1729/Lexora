/**
 * Lexora - Design System Tokens & Specifications
 * 
 * Strict palette constraints:
 * - Background: #1A100A (dark espresso)
 * - Elevated surface: #292019 (warm dark charcoal)
 * - Primary text: #FFF8F0 (warm ivory)
 * - Secondary text: #B8AAA0 (stone)
 * - Border: #45372E (subtle bronze border)
 * - Brand orange: #FF7A00 (editorial accent)
 * - Correct letter: #538D4E (muted forest green)
 * - Present letter: #B59F3B (warm ochre gold)
 * - Absent letter: #49413B (dark slate)
 */

export const colors = {
  // Brand
  primary: '#FF7A00',
  primaryMuted: '#B35600',
  primaryDark: '#803D00',
  primarySubtle: '#2A170A',
  primaryBorderGlow: 'rgba(255, 122, 0, 0.40)',
  primaryGlowSubtle: 'rgba(255, 122, 0, 0.15)',

  // Surfaces & Backgrounds
  background: '#1A100A',
  surface: '#292019',
  surfaceElevated: '#382D24',
  surfaceSubtle: '#211812',
  surfaceDark: '#140C07',

  // Text
  textPrimary: '#FFF8F0',
  textSecondary: '#B8AAA0',
  textMuted: '#7D7066',
  textInverse: '#1A100A',
  textWhite: '#FFFFFF',

  // Borders & Dividers
  border: '#45372E',
  borderLight: '#5A483D',
  borderSubtle: '#332720',
  borderHighlight: 'rgba(255, 248, 240, 0.12)',

  // Wordle Letter Feedback
  correct: '#538D4E',      // Green: letter in correct slot
  correctBorder: '#5B9A56',
  present: '#B59F3B',      // Yellow: letter present, wrong slot
  presentBorder: '#C0AA3F',
  absent: '#49413B',       // Dark gray: letter absent from solution
  absentBorder: '#3D3631',
  empty: 'transparent',
  tbd: '#45372E',          // Border for typed unsubmitted tile
  winningGlowBorder: '#72B06D',

  // Keyboard Design System
  keyBackground: '#292019',
  keyBackgroundElevated: '#332820',
  keyBackgroundPressed: '#3D3025',
  keyBackgroundHovered: '#31271F',
  keyBorder: '#45372E',
  keyBorderElevated: '#4D3E33',
  keyBorderHighlight: 'rgba(255, 248, 240, 0.16)',
  keyBorderPressed: 'rgba(255, 122, 0, 0.40)',
  keyText: '#FFF8F0',
  keyTextSecondary: '#B8AAA0',
  keyTextMuted: '#7D7066',
  keyTextEvaluated: '#FFFFFF',

  // Standalone ENTER Button
  enterBackground: '#261D17',
  enterBackgroundHovered: '#30241C',
  enterBackgroundPressed: '#3D3025',
  enterBorder: 'rgba(255, 122, 0, 0.40)',
  enterBorderHovered: 'rgba(255, 122, 0, 0.65)',
  enterBorderPressed: '#FF7A00',
  enterPip: '#FF7A00',
  enterText: '#FFF8F0',

  // State indicators
  success: '#538D4E',
  error: '#D94841',
  errorSubtle: 'rgba(217, 72, 65, 0.12)',
  warning: '#B59F3B',

  // Overlays & Glassmorphism
  modalBackdrop: 'rgba(10, 6, 4, 0.82)',
  overlaySubtle: 'rgba(255, 248, 240, 0.06)',
  glassBackground: 'rgba(26, 16, 10, 0.76)',
  glassCard: 'rgba(41, 32, 25, 0.74)',
  glassCardElevated: 'rgba(54, 42, 33, 0.82)',
  glassBorder: 'rgba(255, 248, 240, 0.12)',
  glassBorderHighlight: 'rgba(255, 248, 240, 0.22)',
  glassBorderSubtle: 'rgba(255, 248, 240, 0.07)',
  glassHighlight: 'rgba(255, 248, 240, 0.09)',
  glowPrimary: 'rgba(255, 122, 0, 0.25)',
  glowSuccess: 'rgba(83, 141, 78, 0.32)',
  ambientGlow: 'rgba(255, 122, 0, 0.045)',
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  glass: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  victoryGlow: {
    shadowColor: '#538D4E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 16,
  },
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const borderRadius = {
  xs: 2,
  sm: 4,      // Wordle tiles
  md: 6,      // Keyboard keys, standard inputs
  lg: 8,      // Action buttons, cards
  xl: 12,     // Modal cards, major panels
  pill: 9999, // Badges, pill buttons
} as const;

export const typography = {
  fontSizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 26,
    display: 34,
    hero: 38,
  },
  fontWeights: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    black: '800' as const,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.8,
    expanded: 1.5,
    brand: 4,
    brandHero: 6,
  },
} as const;

export const controls = {
  buttonHeightSm: 36,
  buttonHeightMd: 42,
  buttonHeightLg: 48,
  minTouchTarget: 44,
} as const;

export const theme = {
  colors,
  shadows,
  spacing,
  borderRadius,
  typography,
  controls,
} as const;

export type Theme = typeof theme;
export type ColorKey = keyof typeof colors;
