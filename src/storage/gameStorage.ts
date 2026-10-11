import { LetterEvaluation, KeyStatus, GameStatus } from '../types/game';
import { GameEngineState } from '../engine/gameEngine';
import { KeyValueStorage, defaultStorage } from './storageAdapter';

export const GAME_STATE_SCHEMA_VERSION = 1;
export const DAILY_GAME_STATE_KEY = '@lexora/daily_game_state_v1';

export interface StoredDailyGameState {
  schemaVersion: number;
  dateKey: string;
  puzzleNumber: number;
  solution: string;
  guesses: string[];
  evaluations: LetterEvaluation[][];
  currentGuess: string;
  gameStatus: GameStatus;
  keyboardStatus: Record<string, KeyStatus>;
  completedAt?: string;
}

/**
 * Validates whether an unknown object adheres to the StoredDailyGameState schema.
 */
export function isValidStoredGameState(data: unknown): data is StoredDailyGameState {
  if (!data || typeof data !== 'object') {
    return false;
  }
  const obj = data as Record<string, unknown>;
  if (obj.schemaVersion !== GAME_STATE_SCHEMA_VERSION) {
    return false;
  }
  if (typeof obj.dateKey !== 'string' || typeof obj.solution !== 'string') {
    return false;
  }
  if (typeof obj.puzzleNumber !== 'number') {
    return false;
  }
  if (!Array.isArray(obj.guesses) || !Array.isArray(obj.evaluations)) {
    return false;
  }
  if (typeof obj.currentGuess !== 'string') {
    return false;
  }
  if (obj.gameStatus !== 'playing' && obj.gameStatus !== 'won' && obj.gameStatus !== 'lost') {
    return false;
  }
  if (!obj.keyboardStatus || typeof obj.keyboardStatus !== 'object') {
    return false;
  }
  return true;
}

/**
 * Persists the current daily game state to local storage.
 * Practice games are deliberately ignored to preserve daily integrity.
 */
export async function saveDailyGameState(
  state: GameEngineState,
  storage: KeyValueStorage = defaultStorage
): Promise<void> {
  if (state.isPracticeMode) {
    return;
  }

  const payload: StoredDailyGameState = {
    schemaVersion: GAME_STATE_SCHEMA_VERSION,
    dateKey: state.puzzleInfo.dateKey,
    puzzleNumber: state.puzzleInfo.puzzleNumber,
    solution: state.puzzleInfo.solution,
    guesses: state.guesses,
    evaluations: state.evaluations,
    currentGuess: state.currentGuess,
    gameStatus: state.gameStatus,
    keyboardStatus: state.keyboardStatus,
    completedAt: state.gameStatus !== 'playing' ? new Date().toISOString() : undefined,
  };

  try {
    await storage.setItem(DAILY_GAME_STATE_KEY, JSON.stringify(payload));
  } catch {
    // Fail gracefully without crashing game loop
  }
}

/**
 * Loads and validates the persisted daily game state.
 * Returns null if missing, malformed, or outdated.
 */
export async function loadDailyGameState(
  storage: KeyValueStorage = defaultStorage
): Promise<StoredDailyGameState | null> {
  try {
    const raw = await storage.getItem(DAILY_GAME_STATE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (isValidStoredGameState(parsed)) {
      return parsed;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Clears the stored daily game state.
 */
export async function clearDailyGameState(
  storage: KeyValueStorage = defaultStorage
): Promise<void> {
  try {
    await storage.removeItem(DAILY_GAME_STATE_KEY);
  } catch {
    // Ignore error
  }
}
