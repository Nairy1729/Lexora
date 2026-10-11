import { KeyValueStorage, defaultStorage } from './storageAdapter';

export const STATS_SCHEMA_VERSION = 1;
export const GAME_STATS_KEY = '@lexora/game_stats_v1';

export interface StoredGameStats {
  schemaVersion: number;
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  winPercentage: number;
  guessDistribution: Record<1 | 2 | 3 | 4 | 5 | 6, number>;
  lastCompletedDateKey?: string; // e.g. "2026-10-10"
}

export const INITIAL_GAME_STATS: StoredGameStats = {
  schemaVersion: STATS_SCHEMA_VERSION,
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  winPercentage: 0,
  guessDistribution: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
  },
  lastCompletedDateKey: undefined,
};

/**
 * Calculates calendar day difference between two YYYY-MM-DD UTC date strings.
 */
export function getDaysBetweenDateKeys(dateKeyA?: string, dateKeyB?: string): number {
  if (!dateKeyA || !dateKeyB) {
    return 999;
  }
  const [y1, m1, d1] = dateKeyA.split('-').map(Number);
  const [y2, m2, d2] = dateKeyB.split('-').map(Number);

  const utcMsA = Date.UTC(y1, m1 - 1, d1);
  const utcMsB = Date.UTC(y2, m2 - 1, d2);

  return Math.round((utcMsB - utcMsA) / 86_400_000);
}

/**
 * Validates parsed data against the StoredGameStats schema.
 */
export function isValidStoredStats(data: unknown): data is StoredGameStats {
  if (!data || typeof data !== 'object') {
    return false;
  }
  const obj = data as Record<string, unknown>;
  if (obj.schemaVersion !== STATS_SCHEMA_VERSION) {
    return false;
  }
  if (
    typeof obj.gamesPlayed !== 'number' ||
    typeof obj.gamesWon !== 'number' ||
    typeof obj.currentStreak !== 'number' ||
    typeof obj.maxStreak !== 'number' ||
    typeof obj.winPercentage !== 'number'
  ) {
    return false;
  }
  if (!obj.guessDistribution || typeof obj.guessDistribution !== 'object') {
    return false;
  }
  const dist = obj.guessDistribution as Record<string, unknown>;
  for (let i = 1; i <= 6; i++) {
    if (typeof dist[i] !== 'number') {
      return false;
    }
  }
  return true;
}

/**
 * Pure function that calculates updated career statistics following Wordle daily rules:
 * - Prevents duplicate recording if the same date was already recorded.
 * - Increments gamesPlayed and gamesWon.
 * - Wins on consecutive calendar days increment currentStreak.
 * - Skipped days reset streak to 1 on a win.
 * - A loss resets currentStreak to 0.
 * - Updates maxStreak.
 * - Increments appropriate attempt count in guessDistribution.
 */
export function recordGameCompletion(
  currentStats: StoredGameStats,
  dateKey: string,
  won: boolean,
  attempts: number
): StoredGameStats {
  // Prevent duplicate completion recording for the same daily puzzle
  if (currentStats.lastCompletedDateKey === dateKey) {
    return currentStats;
  }

  const gamesPlayed = currentStats.gamesPlayed + 1;
  const gamesWon = won ? currentStats.gamesWon + 1 : currentStats.gamesWon;
  const winPercentage = Math.round((gamesWon / gamesPlayed) * 100);

  let currentStreak = 0;
  if (won) {
    if (!currentStats.lastCompletedDateKey) {
      currentStreak = 1;
    } else {
      const daysDiff = getDaysBetweenDateKeys(currentStats.lastCompletedDateKey, dateKey);
      if (daysDiff === 1) {
        // Consecutive calendar day
        currentStreak = currentStats.currentStreak + 1;
      } else if (daysDiff > 1) {
        // Skipped a day; streak resets to 1
        currentStreak = 1;
      } else {
        // Same day offset fallback
        currentStreak = currentStats.currentStreak + 1;
      }
    }
  } else {
    // Loss resets streak to 0
    currentStreak = 0;
  }

  const maxStreak = Math.max(currentStats.maxStreak, currentStreak);

  const guessDistribution = { ...currentStats.guessDistribution };
  if (won && attempts >= 1 && attempts <= 6) {
    const validKey = attempts as 1 | 2 | 3 | 4 | 5 | 6;
    guessDistribution[validKey] = (guessDistribution[validKey] || 0) + 1;
  }

  return {
    schemaVersion: STATS_SCHEMA_VERSION,
    gamesPlayed,
    gamesWon,
    currentStreak,
    maxStreak,
    winPercentage,
    guessDistribution,
    lastCompletedDateKey: dateKey,
  };
}

/**
 * Persists player career statistics.
 */
export async function saveGameStats(
  stats: StoredGameStats,
  storage: KeyValueStorage = defaultStorage
): Promise<void> {
  try {
    await storage.setItem(GAME_STATS_KEY, JSON.stringify(stats));
  } catch {
    // Fail gracefully
  }
}

/**
 * Loads career statistics, returning default stats if missing or corrupted.
 */
export async function loadGameStats(
  storage: KeyValueStorage = defaultStorage
): Promise<StoredGameStats> {
  try {
    const raw = await storage.getItem(GAME_STATS_KEY);
    if (!raw) {
      return { ...INITIAL_GAME_STATS };
    }

    const parsed = JSON.parse(raw);
    if (isValidStoredStats(parsed)) {
      return parsed;
    }

    return { ...INITIAL_GAME_STATS };
  } catch {
    return { ...INITIAL_GAME_STATS };
  }
}

/**
 * Resets career statistics.
 */
export async function clearGameStats(
  storage: KeyValueStorage = defaultStorage
): Promise<void> {
  try {
    await storage.removeItem(GAME_STATS_KEY);
  } catch {
    // Ignore error
  }
}
