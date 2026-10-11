/**
 * Lexora Animation & Motion Timings
 * Pure configuration constants for tile animations, reveals, shakes, and transitions.
 */

export const MOTION_TIMINGS = {
  // Tile scale pop on entering a letter
  tilePopDuration: 120,
  tilePopScale: 1.14,

  // Staggered tile flip reveal
  tileFlipHalfDuration: 130, // Down to 0 and back to 1
  tileFlipStaggerDelay: 120, // Delay per tile column

  // Row shake on invalid submission
  rowShakeDuration: 350,
  rowShakeAmplitude: 8,

  // Celebratory bounce on winning row
  winBounceDuration: 280,
  winBounceStaggerDelay: 90,
  winBounceDistance: -12,

  // Keyboard key press feedback
  keyPressScale: 0.94,
  keyPressDuration: 90,
} as const;
