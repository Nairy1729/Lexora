/**
 * Lexora Animation & Motion Constants and Utilities
 * Centralizes animation timings, easing functions, and accessibility checks.
 */

import { useReducedMotion } from 'react-native-reanimated';
import { MOTION_TIMINGS } from '../constants/motion';

export { MOTION_TIMINGS };

/**
 * Hook to inspect whether the user prefers reduced motion.
 * When true, instant state transitions should replace transform/scale animations.
 */
export function usePrefersReducedMotion(): boolean {
  try {
    return useReducedMotion();
  } catch {
    return false;
  }
}
