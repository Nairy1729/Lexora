import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { MemoryStorage } from '../storageAdapter';
import {
  saveDailyGameState,
  loadDailyGameState,
  DAILY_GAME_STATE_KEY,
} from '../gameStorage';
import {
  recordGameCompletion,
  saveGameStats,
  loadGameStats,
  INITIAL_GAME_STATS,
  GAME_STATS_KEY,
  getDaysBetweenDateKeys,
} from '../statsStorage';
import { GameEngineState } from '../../engine/gameEngine';

describe('Daily Game State Persistence', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  test('saves and restores an unfinished game accurately', async () => {
    const unfinishedState: GameEngineState = {
      puzzleInfo: {
        puzzleNumber: 283,
        dateKey: '2026-10-10',
        solution: 'LATCH',
      },
      guesses: ['CRANE'],
      evaluations: [['present', 'absent', 'present', 'absent', 'absent']],
      currentGuess: 'SL',
      gameStatus: 'playing',
      keyboardStatus: { C: 'present', R: 'absent', A: 'present', N: 'absent', E: 'absent' },
      message: null,
      isPracticeMode: false,
    };

    await saveDailyGameState(unfinishedState, storage);

    const restored = await loadDailyGameState(storage);
    assert.notStrictEqual(restored, null);
    assert.strictEqual(restored?.dateKey, '2026-10-10');
    assert.strictEqual(restored?.solution, 'LATCH');
    assert.deepStrictEqual(restored?.guesses, ['CRANE']);
    assert.strictEqual(restored?.currentGuess, 'SL');
    assert.strictEqual(restored?.gameStatus, 'playing');
    assert.strictEqual(restored?.keyboardStatus['C'], 'present');
  });

  test('saves and restores a completed game without losing final result', async () => {
    const wonState: GameEngineState = {
      puzzleInfo: {
        puzzleNumber: 283,
        dateKey: '2026-10-10',
        solution: 'LATCH',
      },
      guesses: ['CRANE', 'LATCH'],
      evaluations: [
        ['present', 'absent', 'present', 'absent', 'absent'],
        ['correct', 'correct', 'correct', 'correct', 'correct'],
      ],
      currentGuess: '',
      gameStatus: 'won',
      keyboardStatus: { L: 'correct', A: 'correct', T: 'correct', C: 'correct', H: 'correct' },
      message: 'Magnificent!',
      isPracticeMode: false,
    };

    await saveDailyGameState(wonState, storage);

    const restored = await loadDailyGameState(storage);
    assert.notStrictEqual(restored, null);
    assert.strictEqual(restored?.gameStatus, 'won');
    assert.strictEqual(restored?.guesses.length, 2);
    assert.notStrictEqual(restored?.completedAt, undefined);
  });

  test('does not persist practice games to daily storage', async () => {
    const practiceState: GameEngineState = {
      puzzleInfo: {
        puzzleNumber: 999,
        dateKey: '2026-10-10',
        solution: 'ROAST',
      },
      guesses: ['PLANT'],
      evaluations: [['absent', 'absent', 'correct', 'absent', 'correct']],
      currentGuess: '',
      gameStatus: 'playing',
      keyboardStatus: {},
      message: null,
      isPracticeMode: true, // Practice mode
    };

    await saveDailyGameState(practiceState, storage);

    const restored = await loadDailyGameState(storage);
    assert.strictEqual(restored, null);
  });

  test('safely handles corrupted or malformed stored game state', async () => {
    await storage.setItem(DAILY_GAME_STATE_KEY, '{ invalid json');
    const fromInvalidJson = await loadDailyGameState(storage);
    assert.strictEqual(fromInvalidJson, null);

    await storage.setItem(
      DAILY_GAME_STATE_KEY,
      JSON.stringify({ schemaVersion: 999, guesses: 'not an array' })
    );
    const fromOutdatedSchema = await loadDailyGameState(storage);
    assert.strictEqual(fromOutdatedSchema, null);
  });
});

describe('Career Statistics & Streak Rules', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  test('records initial win accurately', () => {
    const initial = INITIAL_GAME_STATS;
    const updated = recordGameCompletion(initial, '2026-10-10', true, 3);

    assert.strictEqual(updated.gamesPlayed, 1);
    assert.strictEqual(updated.gamesWon, 1);
    assert.strictEqual(updated.winPercentage, 100);
    assert.strictEqual(updated.currentStreak, 1);
    assert.strictEqual(updated.maxStreak, 1);
    assert.strictEqual(updated.guessDistribution[3], 1);
    assert.strictEqual(updated.guessDistribution[1], 0);
    assert.strictEqual(updated.lastCompletedDateKey, '2026-10-10');
  });

  test('increments winning streak on consecutive calendar days', () => {
    let stats = recordGameCompletion(INITIAL_GAME_STATS, '2026-10-10', true, 4);
    assert.strictEqual(stats.currentStreak, 1);

    // Consecutive day
    stats = recordGameCompletion(stats, '2026-10-11', true, 2);
    assert.strictEqual(stats.currentStreak, 2);
    assert.strictEqual(stats.maxStreak, 2);
    assert.strictEqual(stats.gamesPlayed, 2);
    assert.strictEqual(stats.gamesWon, 2);
  });

  test('resets streak to 0 on a loss, while maintaining maxStreak', () => {
    let stats = recordGameCompletion(INITIAL_GAME_STATS, '2026-10-10', true, 3);
    stats = recordGameCompletion(stats, '2026-10-11', true, 4);
    assert.strictEqual(stats.currentStreak, 2);
    assert.strictEqual(stats.maxStreak, 2);

    // Loss on day 3
    stats = recordGameCompletion(stats, '2026-10-12', false, 6);
    assert.strictEqual(stats.gamesPlayed, 3);
    assert.strictEqual(stats.gamesWon, 2);
    assert.strictEqual(stats.winPercentage, 67);
    assert.strictEqual(stats.currentStreak, 0); // Reset to 0
    assert.strictEqual(stats.maxStreak, 2); // Preserved
  });

  test('resets streak to 1 on win after skipping a calendar day', () => {
    let stats = recordGameCompletion(INITIAL_GAME_STATS, '2026-10-10', true, 3);
    assert.strictEqual(stats.currentStreak, 1);

    // Skipped Oct 11, played and won on Oct 12
    stats = recordGameCompletion(stats, '2026-10-12', true, 3);
    assert.strictEqual(stats.currentStreak, 1); // Reset to 1 (new streak)
    assert.strictEqual(stats.maxStreak, 1);
    assert.strictEqual(stats.gamesPlayed, 2);
    assert.strictEqual(stats.gamesWon, 2);
  });

  test('prevents duplicate completion recording for the exact same daily puzzle', () => {
    const stats1 = recordGameCompletion(INITIAL_GAME_STATS, '2026-10-10', true, 3);
    const stats2 = recordGameCompletion(stats1, '2026-10-10', true, 3); // Re-run for same date

    // Values must be identical and not incremented twice
    assert.deepStrictEqual(stats1, stats2);
    assert.strictEqual(stats2.gamesPlayed, 1);
    assert.strictEqual(stats2.guessDistribution[3], 1);
  });

  test('loads and saves statistics cleanly to storage', async () => {
    const stats = recordGameCompletion(INITIAL_GAME_STATS, '2026-10-10', true, 5);
    await saveGameStats(stats, storage);

    const loaded = await loadGameStats(storage);
    assert.deepStrictEqual(loaded, stats);
  });

  test('gracefully recovers default stats when stored JSON is corrupted', async () => {
    await storage.setItem(GAME_STATS_KEY, 'corrupt data');
    const recovered = await loadGameStats(storage);

    assert.deepStrictEqual(recovered, INITIAL_GAME_STATS);
  });

  test('getDaysBetweenDateKeys computes calendar differences accurately', () => {
    assert.strictEqual(getDaysBetweenDateKeys('2026-10-10', '2026-10-11'), 1);
    assert.strictEqual(getDaysBetweenDateKeys('2026-10-10', '2026-10-15'), 5);
    assert.strictEqual(getDaysBetweenDateKeys('2026-10-31', '2026-11-01'), 1); // Month boundary
  });
});
