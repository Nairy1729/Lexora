/**
 * Lexora Haptics Utility
 * Provides safe, tactile feedback hooks with platform guards and silent fallbacks
 * for web, unsupported hardware, and non-native test environments.
 */

export type HapticStyle = 'light' | 'medium' | 'heavy';
export type HapticNotificationType = 'success' | 'warning' | 'error';

export interface HapticsAdapter {
  impactAsync(style: HapticStyle): Promise<void>;
  notificationAsync(type: HapticNotificationType): Promise<void>;
}

let nativeHapticsModule: any = null;
let isNativePlatform = false;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const RN = require('react-native');
  isNativePlatform = RN.Platform?.OS === 'android' || RN.Platform?.OS === 'ios';
  if (isNativePlatform) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    nativeHapticsModule = require('expo-haptics');
  }
} catch {
  isNativePlatform = false;
  nativeHapticsModule = null;
}

const defaultAdapter: HapticsAdapter = {
  async impactAsync(style: HapticStyle): Promise<void> {
    if (!isNativePlatform || !nativeHapticsModule) return;
    try {
      let feedbackStyle = nativeHapticsModule.ImpactFeedbackStyle?.Light;
      if (style === 'medium') feedbackStyle = nativeHapticsModule.ImpactFeedbackStyle?.Medium;
      if (style === 'heavy') feedbackStyle = nativeHapticsModule.ImpactFeedbackStyle?.Heavy;
      await nativeHapticsModule.impactAsync(feedbackStyle);
    } catch {
      // Silently ignore unsupported hardware or permission denials
    }
  },

  async notificationAsync(type: HapticNotificationType): Promise<void> {
    if (!isNativePlatform || !nativeHapticsModule) return;
    try {
      let notificationType = nativeHapticsModule.NotificationFeedbackType?.Warning;
      if (type === 'success') notificationType = nativeHapticsModule.NotificationFeedbackType?.Success;
      if (type === 'error') notificationType = nativeHapticsModule.NotificationFeedbackType?.Error;
      await nativeHapticsModule.notificationAsync(notificationType);
    } catch {
      // Silently ignore unsupported hardware or permission denials
    }
  },
};

let currentAdapter: HapticsAdapter = defaultAdapter;
let hapticsEnabled = true;

/**
 * Configure whether haptics are globally enabled (e.g. user settings).
 */
export function setHapticsEnabled(enabled: boolean): void {
  hapticsEnabled = enabled;
}

export function isHapticsEnabled(): boolean {
  return hapticsEnabled;
}

/**
 * Replace active haptics adapter (useful for testing and mocks).
 */
export function setHapticsAdapter(adapter: HapticsAdapter): void {
  currentAdapter = adapter;
}

/**
 * Reset adapter to default native adapter.
 */
export function resetHapticsAdapter(): void {
  currentAdapter = defaultAdapter;
}

/**
 * Subtle tactile tap for keyboard keypress and backspace.
 */
export async function hapticKeyTap(): Promise<void> {
  if (!hapticsEnabled) return;
  await currentAdapter.impactAsync('light');
}

/**
 * Satisfying medium impact when submitting a valid guess.
 */
export async function hapticGuessSubmit(): Promise<void> {
  if (!hapticsEnabled) return;
  await currentAdapter.impactAsync('medium');
}

/**
 * Warning vibration pattern when submitting an invalid word or short guess.
 */
export async function hapticInvalidWord(): Promise<void> {
  if (!hapticsEnabled) return;
  await currentAdapter.notificationAsync('warning');
}

/**
 * Celebratory success pattern upon solving the puzzle.
 */
export async function hapticVictory(): Promise<void> {
  if (!hapticsEnabled) return;
  await currentAdapter.notificationAsync('success');
}

/**
 * Subdued notification pattern when running out of attempts.
 */
export async function hapticLoss(): Promise<void> {
  if (!hapticsEnabled) return;
  await currentAdapter.notificationAsync('error');
}
