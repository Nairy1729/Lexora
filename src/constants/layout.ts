/**
 * Lexora - Layout & Geometry Constants
 */

export const layout = {
  // Mobile content boundary
  maxContentWidth: 440,
  headerHeight: 50,
  footerHeight: 44,

  // Puzzle rules
  wordLength: 5,
  maxGuesses: 6,

  // Grid styling
  gridGap: 6,
  tileCornerRadius: 4,

  // Keyboard dimensions & geometry
  keyHeight: 48,
  keyboardRowGap: 6,
  keyboardKeyGap: 4,
  actionKeyFlex: 1.45,
  keyboardBottomBreathingRoom: 24,
  keyboardGridGap: 20,

  // Spacing & dividers
  contentPadding: 16,
  dividerThickness: 1,

  // Accessibility
  minTouchTarget: 44,
} as const;

export type Layout = typeof layout;
