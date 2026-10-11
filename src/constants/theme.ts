/**
 * Lexora - Core Theme & Design Tokens
 * 
 * Strict palette constraints:
 * - Primary orange: #FF7A00 (brand accent)
 * - Main background: #1A100A
 * - Elevated surface: #292019
 * - Primary text: #FFF8F0
 * - Secondary text: #B8AAA0
 * - Border: #45372E
 * - Correct letter: #538D4E
 * - Present letter: #B59F3B
 * - Absent letter: #49413B
 */

export const colors = {
  // Brand
  primary: '#FF7A00',
  primaryMuted: '#B35600',
  primaryDark: '#803D00',
  primarySubtle: '#2A170A',

  // Surfaces & Backgrounds
  background: '#1A100A',
  surface: '#292019',
  surfaceElevated: '#382D24',
  surfaceSubtle: '#211812',

  // Text
  textPrimary: '#FFF8F0',
  textSecondary: '#B8AAA0',
  textMuted: '#7D7066',
  textInverse: '#1A100A',

  // Borders & Dividers
  border: '#45372E',
  borderLight: '#5A483D',
  borderSubtle: '#332720',

  // Wordle Letter Feedback
  correct: '#538D4E',      // Green: letter in correct slot
  present: '#B59F3B',      // Yellow: letter present, wrong slot
  absent: '#49413B',       // Dark gray: letter absent from solution
  empty: 'transparent',
  tbd: '#45372E',          // Border for typed unsubmitted tile

  // Keyboard - Lexora Dark Glass Design System
  keyBackground: '#292019',           // Warm, dark, understated surface (matches Lexora surface)
  keyBackgroundElevated: '#332820',   // Subtly elevated surface for action keys (ENTER, BACKSPACE)
  keyBackgroundPressed: '#3D3025',    // Subtle warm pressed state
  keyBackgroundHovered: '#31271F',    // Desktop hover state
  keyBorder: '#45372E',               // Fine, restrained border (matches Lexora border token)
  keyBorderElevated: '#4D3E33',       // Action key border
  keyBorderHighlight: 'rgba(255, 248, 240, 0.16)', // Subtle keycap highlight
  keyText: '#FFF8F0',                 // Primary warm ivory
  keyTextSecondary: '#B8AAA0',        // Secondary stone text (absent keys)
  keyTextMuted: '#7D7066',            // Muted text

  // State indicators
  success: '#538D4E',
  error: '#D94841',
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
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  pill: 9999,
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
    wide: 1,
    expanded: 2,
    brand: 4,
  },
} as const;

export const theme = {
  colors,
  shadows,
  spacing,
  borderRadius,
  typography,
} as const;

export type Theme = typeof theme;
export type ColorKey = keyof typeof colors;
