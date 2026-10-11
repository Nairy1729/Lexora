/**
 * Lexora Settings Persistence
 * Manages user preferences (such as haptics) and provides a secure data reset action.
 */

import { KeyValueStorage, defaultStorage } from './storageAdapter';
import { DAILY_GAME_STATE_KEY } from './gameStorage';
import { GAME_STATS_KEY } from './statsStorage';

export const SETTINGS_STORAGE_KEY = 'lexora_user_settings_v1';

export interface AppSettings {
  hapticsEnabled: boolean;
  dailyRemindersEnabled: boolean;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  hapticsEnabled: true,
  dailyRemindersEnabled: true,
};

/**
 * Loads user settings from storage with safe fallback to defaults.
 */
export async function loadAppSettings(
  storage: KeyValueStorage = defaultStorage
): Promise<AppSettings> {
  try {
    const raw = await storage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_APP_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      hapticsEnabled: typeof parsed.hapticsEnabled === 'boolean' ? parsed.hapticsEnabled : true,
      dailyRemindersEnabled:
        typeof parsed.dailyRemindersEnabled === 'boolean' ? parsed.dailyRemindersEnabled : true,
    };
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

/**
 * Saves user settings to storage.
 */
export async function saveAppSettings(
  settings: AppSettings,
  storage: KeyValueStorage = defaultStorage
): Promise<void> {
  try {
    await storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Fail silently
  }
}

/**
 * Clears all stored daily progress and career statistics.
 * Requires explicit user confirmation at the UI layer before calling.
 */
export async function clearAllGameData(
  storage: KeyValueStorage = defaultStorage
): Promise<void> {
  try {
    await storage.removeItem(DAILY_GAME_STATE_KEY);
    await storage.removeItem(GAME_STATS_KEY);
  } catch {
    // Fail silently
  }
}
