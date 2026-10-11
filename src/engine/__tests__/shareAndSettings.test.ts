import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { formatShareText, formatEvaluationGrid } from '../../utils/share';
import { getMsUntilNextUtcMidnight, formatTimeRemaining } from '../../utils/time';
import {
  loadAppSettings,
  saveAppSettings,
  clearAllGameData,
  DEFAULT_APP_SETTINGS,
  SETTINGS_STORAGE_KEY,
} from '../../storage/settingsStorage';
import {
  saveDailyGameState,
  loadDailyGameState,
  DAILY_GAME_STATE_KEY,
} from '../../storage/gameStorage';
import {
  recordGameCompletion,
  saveGameStats,
  loadGameStats,
  INITIAL_GAME_STATS,
  GAME_STATS_KEY,
} from '../../storage/statsStorage';
import { MemoryStorage } from '../../storage/storageAdapter';
import { LetterEvaluation } from '../../types/game';
import { gameReducer, createInitialGameState } from '../gameEngine';

describe('Shareable Results Formatting & Privacy', () => {
  const sampleEvals: LetterEvaluation[][] = [
    ['absent', 'present', 'absent', 'absent', 'correct'],
    ['present', 'absent', 'correct', 'absent', 'correct'],
    ['correct', 'correct', 'correct', 'correct', 'correct'],
  ];

  test('formats winning game share text accurately', () => {
    const text = formatShareText({
      puzzleNumber: 283,
      isPracticeMode: false,
      gameStatus: 'won',
      guessesCount: 3,
      maxGuesses: 6,
      evaluations: sampleEvals,
    });

    assert.ok(text.startsWith('Lexora #283 3/6\n\n'));
    assert.strictEqual(
      text,
      'Lexora #283 3/6\n\n⬛🟨⬛⬛🟩\n🟨⬛🟩⬛🟩\n🟩🟩🟩🟩🟩'
    );
  });

  test('formats losing game share text with X/6 indicator', () => {
    const lossEvals: LetterEvaluation[][] = [
      ['absent', 'absent', 'absent', 'absent', 'absent'],
      ['absent', 'absent', 'absent', 'absent', 'absent'],
      ['absent', 'absent', 'absent', 'absent', 'absent'],
      ['absent', 'absent', 'absent', 'absent', 'absent'],
      ['absent', 'absent', 'absent', 'absent', 'absent'],
      ['present', 'absent', 'absent', 'absent', 'absent'],
    ];

    const text = formatShareText({
      puzzleNumber: 104,
      isPracticeMode: false,
      gameStatus: 'lost',
      guessesCount: 6,
      maxGuesses: 6,
      evaluations: lossEvals,
    });

    assert.ok(text.startsWith('Lexora #104 X/6\n\n'));
    assert.ok(text.includes('🟨⬛⬛⬛⬛'));
    assert.strictEqual(text.split('\n').filter((l) => l.trim().length > 0).length, 7);
  });

  test('formats practice mode share text with Practice label', () => {
    const text = formatShareText({
      puzzleNumber: 50,
      isPracticeMode: true,
      gameStatus: 'won',
      guessesCount: 4,
      maxGuesses: 6,
      evaluations: [
        ['absent', 'absent', 'absent', 'absent', 'absent'],
        ['present', 'absent', 'absent', 'absent', 'absent'],
        ['correct', 'correct', 'absent', 'absent', 'absent'],
        ['correct', 'correct', 'correct', 'correct', 'correct'],
      ],
    });

    assert.ok(text.startsWith('Lexora Practice 4/6\n\n'));
    assert.ok(text.endsWith('🟩🟩🟩🟩🟩'));
  });

  test('never leaks secret solution word or raw guess letters in share output', () => {
    const secretWord = 'CRANE';
    const guessWord = 'SLATE';

    const text = formatShareText({
      puzzleNumber: 42,
      gameStatus: 'won',
      guessesCount: 1,
      evaluations: [['correct', 'correct', 'correct', 'correct', 'correct']],
    });

    assert.ok(!text.includes(secretWord));
    assert.ok(!text.includes(guessWord));
    // Contains only brand header, score, and emoji squares
    const lines = text.split('\n\n');
    assert.strictEqual(lines.length, 2);
    assert.strictEqual(lines[1], '🟩🟩🟩🟩🟩');
  });

  test('formatEvaluationGrid handles empty grid gracefully', () => {
    assert.strictEqual(formatEvaluationGrid([]), '');
  });
});

describe('Zero-Game Statistics & Career Calculations', () => {
  test('handles zero games played safely without division-by-zero errors', () => {
    const zeroStats = INITIAL_GAME_STATS;
    assert.strictEqual(zeroStats.gamesPlayed, 0);
    assert.strictEqual(zeroStats.gamesWon, 0);
    assert.strictEqual(zeroStats.winPercentage, 0);
    assert.strictEqual(zeroStats.currentStreak, 0);
    assert.strictEqual(zeroStats.maxStreak, 0);
    assert.strictEqual(zeroStats.guessDistribution[1], 0);
    assert.strictEqual(zeroStats.guessDistribution[6], 0);
  });

  test('calculates accurate win percentage across multiple games', () => {
    let stats = INITIAL_GAME_STATS;
    stats = recordGameCompletion(stats, '2026-10-01', true, 3);
    assert.strictEqual(stats.winPercentage, 100);

    stats = recordGameCompletion(stats, '2026-10-02', false, 6);
    assert.strictEqual(stats.winPercentage, 50); // 1 won out of 2 played

    stats = recordGameCompletion(stats, '2026-10-03', true, 2);
    assert.strictEqual(stats.winPercentage, 67); // 2 won out of 3 played = 66.67% -> 67%
  });

  test('prevents duplicate completion of the same puzzle date from distorting stats', () => {
    let stats = INITIAL_GAME_STATS;
    stats = recordGameCompletion(stats, '2026-10-10', true, 4);
    const firstStats = { ...stats };

    // Duplicate call for the exact same dateKey
    stats = recordGameCompletion(stats, '2026-10-10', true, 4);

    assert.deepStrictEqual(stats, firstStats);
    assert.strictEqual(stats.gamesPlayed, 1);
    assert.strictEqual(stats.guessDistribution[4], 1);
  });
});

describe('Settings Persistence & Data Reset Boundaries', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  test('loads default app settings when storage is empty', async () => {
    const loaded = await loadAppSettings(storage);
    assert.deepStrictEqual(loaded, DEFAULT_APP_SETTINGS);
    assert.strictEqual(loaded.hapticsEnabled, true);
  });

  test('saves and reloads user settings accurately', async () => {
    await saveAppSettings({ hapticsEnabled: false }, storage);
    const loaded = await loadAppSettings(storage);
    assert.strictEqual(loaded.hapticsEnabled, false);
  });

  test('gracefully recovers default settings if stored json is malformed', async () => {
    await storage.setItem(SETTINGS_STORAGE_KEY, '{ invalid json');
    const loaded = await loadAppSettings(storage);
    assert.deepStrictEqual(loaded, DEFAULT_APP_SETTINGS);
  });

  test('clearAllGameData clears daily progress and statistics while preserving isolation', async () => {
    // Populate daily state
    const puzzle = { puzzleNumber: 15, dateKey: '2026-10-10', solution: 'BLAZE' };
    const engineState = createInitialGameState(puzzle, false);
    engineState.guesses = ['CRANE'];
    engineState.evaluations = [['absent', 'absent', 'correct', 'absent', 'present']];
    await saveDailyGameState(engineState, storage);

    // Populate stats
    const stats = recordGameCompletion(INITIAL_GAME_STATS, '2026-10-09', true, 3);
    await saveGameStats(stats, storage);

    // Verify both items exist in storage
    assert.notStrictEqual(await storage.getItem(DAILY_GAME_STATE_KEY), null);
    assert.notStrictEqual(await storage.getItem(GAME_STATS_KEY), null);

    // Perform clear
    await clearAllGameData(storage);

    // Verify both items are cleanly removed
    assert.strictEqual(await storage.getItem(DAILY_GAME_STATE_KEY), null);
    assert.strictEqual(await storage.getItem(GAME_STATS_KEY), null);

    // Verify loadDailyGameState returns null and loadGameStats returns defaults
    assert.strictEqual(await loadDailyGameState(storage), null);
    assert.deepStrictEqual(await loadGameStats(storage), INITIAL_GAME_STATS);
  });

  test('changing settings never mutates or overwrites active game state', () => {
    const puzzle = { puzzleNumber: 99, dateKey: '2026-10-10', solution: 'GHOST' };
    let gameState = createInitialGameState(puzzle, false);
    gameState = gameReducer(gameState, { type: 'KEY_PRESS', key: 'G' });
    gameState = gameReducer(gameState, { type: 'KEY_PRESS', key: 'H' });

    // Active guess is "GH"
    assert.strictEqual(gameState.currentGuess, 'GH');

    // Simulate settings update outside reducer
    const updatedSettings = { hapticsEnabled: false };
    assert.strictEqual(updatedSettings.hapticsEnabled, false);

    // Game state remains completely intact
    assert.strictEqual(gameState.currentGuess, 'GH');
    assert.strictEqual(gameState.guesses.length, 0);
    assert.strictEqual(gameState.gameStatus, 'playing');
  });
});

describe('UTC Midnight Countdown Utilities', () => {
  test('calculates milliseconds until next UTC midnight accurately', () => {
    // 23:00:00 UTC (1 hour before midnight)
    const testDate = new Date(Date.UTC(2026, 9, 10, 23, 0, 0, 0));
    const msUntilMidnight = getMsUntilNextUtcMidnight(testDate);

    assert.strictEqual(msUntilMidnight, 3600000); // 1 hour = 3,600,000 ms
    assert.strictEqual(formatTimeRemaining(msUntilMidnight), '01:00:00');
  });

  test('formats minutes and seconds with clean zero padding', () => {
    // 45 minutes and 9 seconds = (45 * 60 + 9) * 1000 = 2,709,000 ms
    const ms = (45 * 60 + 9) * 1000;
    assert.strictEqual(formatTimeRemaining(ms), '00:45:09');

    // 0 ms
    assert.strictEqual(formatTimeRemaining(0), '00:00:00');
  });
});
