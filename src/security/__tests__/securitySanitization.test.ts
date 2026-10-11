import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isValidWord } from '../../engine/wordList';
import { isValidStoredGameState, loadDailyGameState } from '../../storage/gameStorage';
import { isValidStoredStats, loadGameStats } from '../../storage/statsStorage';
import { loadAppSettings } from '../../storage/settingsStorage';
import { MemoryStorage } from '../../storage/storageAdapter';
import { formatShareText } from '../../utils/share';
import { gameReducer, createInitialGameState } from '../../engine/gameEngine';
import { DailyPuzzleInfo } from '../../engine/dailySelector';

const MOCK_PUZZLE: DailyPuzzleInfo = {
  puzzleNumber: 283,
  dateKey: '2026-10-10',
  solution: 'LATCH',
};

describe('VAPT Security & Malformed Input Sanitization Suite', () => {
  it('1. Prototype pollution keys and special identifiers are rejected safely by dictionary validator', () => {
    const maliciousStrings = [
      '__proto__',
      'constructor',
      'prototype',
      'toString',
      'valueOf',
      '__defineGetter__',
      'hasOwnProperty',
      '<script>',
      'DROP TABLE',
      '../../etc/passwd',
      '\\0\\0\\0\\0\\0',
      '🐶🐱🐭🐹🐰',
      '12345',
      'LATCH\0',
      'LATCH ',
      ' LATCH',
      '\tLATCH',
      '\nLATCH',
    ];

    for (const str of maliciousStrings) {
      assert.equal(
        isValidWord(str),
        false,
        `Expected malicious string '${str}' to be rejected by isValidWord`
      );
    }

    // Verify Object prototype was not polluted
    const cleanObj: Record<string, unknown> = {};
    assert.equal(cleanObj['polluted'], undefined);
  });

  it('2. Game state schema rejects malformed, incomplete, or injected storage payloads', () => {
    const badPayloads = [
      null,
      undefined,
      12345,
      'just a string',
      {},
      { schemaVersion: 999 }, // wrong version
      { schemaVersion: 1 }, // missing fields
      { schemaVersion: 1, dateKey: 123 }, // wrong types
      {
        schemaVersion: 1,
        dateKey: '2026-10-10',
        puzzleNumber: 'not-a-number',
        solution: 'LATCH',
      },
      {
        schemaVersion: 1,
        dateKey: '2026-10-10',
        puzzleNumber: 283,
        solution: 'LATCH',
        guesses: 'not-an-array',
      },
      {
        schemaVersion: 1,
        dateKey: '2026-10-10',
        puzzleNumber: 283,
        solution: 'LATCH',
        guesses: ['CRANE'],
        evaluations: [],
        currentGuess: '',
        gameStatus: 'hacked_status', // invalid status
        keyboardStatus: {},
      },
    ];

    for (const payload of badPayloads) {
      assert.equal(
        isValidStoredGameState(payload),
        false,
        `Expected payload ${JSON.stringify(payload)} to fail validation`
      );
    }
  });

  it('3. Corrupted JSON strings in AsyncStorage/localStorage fail gracefully to default fallback', async () => {
    const storage = new MemoryStorage();

    // Inject corrupted malformed JSON
    await storage.setItem('@lexora/daily_game_state_v1', '{malformed json: true, broken');
    await storage.setItem('@lexora/game_stats_v1', 'null corrupt [{{');
    await storage.setItem('lexora_user_settings_v1', 'undefined');

    const loadedDaily = await loadDailyGameState(storage);
    assert.equal(loadedDaily, null);

    const loadedStats = await loadGameStats(storage);
    assert.equal(loadedStats.gamesPlayed, 0);
    assert.equal(loadedStats.gamesWon, 0);

    const loadedSettings = await loadAppSettings(storage);
    assert.equal(loadedSettings.hapticsEnabled, true);
    assert.equal(loadedSettings.dailyRemindersEnabled, true);
  });

  it('4. Share text generation strictly preserves privacy: never leaks secret solution word or raw guess letters', () => {
    const solution = 'LATCH';
    const guesses = ['CRANE', 'AUDIO', 'LATCH'];

    const shareOutput = formatShareText({
      puzzleNumber: 283,
      isPracticeMode: false,
      gameStatus: 'won',
      guessesCount: 3,
      evaluations: [
        ['absent', 'absent', 'correct', 'absent', 'absent'],
        ['correct', 'absent', 'absent', 'absent', 'absent'],
        ['correct', 'correct', 'correct', 'correct', 'correct'],
      ],
    });

    // Share text must not contain secret solution word
    assert.equal(shareOutput.includes(solution), false);

    // Share text must not contain guess letters
    for (const guess of guesses) {
      assert.equal(shareOutput.includes(guess), false);
    }

    // Share text must contain only emoji grid and branding
    assert.ok(shareOutput.startsWith('Lexora #283 3/6'));
    assert.ok(shareOutput.includes('🟩'));
    assert.ok(shareOutput.includes('⬛'));
  });

  it('5. Input buffer length security boundary: maximum 5 letters strictly enforced against overflow', () => {
    let state = createInitialGameState(MOCK_PUZZLE);

    // Send 50 keystrokes rapidly
    for (let i = 0; i < 50; i++) {
      state = gameReducer(state, { type: 'KEY_PRESS', key: 'A' });
    }

    // Buffer strictly bounded at length 5
    assert.equal(state.currentGuess.length, 5);
    assert.equal(state.currentGuess, 'AAAAA');

    // Attempting to inject control codes or backspace past boundary
    for (let i = 0; i < 100; i++) {
      state = gameReducer(state, { type: 'KEY_PRESS', key: 'BACKSPACE' });
    }
    assert.equal(state.currentGuess, '');
    assert.equal(state.currentGuess.length, 0);
  });

  it('6. Career stats schema validation rejects tampering, negative numbers, or invalid distribution', () => {
    const badStats = [
      null,
      { gamesPlayed: -10 },
      { gamesPlayed: 10, gamesWon: 20 }, // won > played
      { schemaVersion: 2 },
      { guessDistribution: { 1: -5 } },
    ];

    for (const stat of badStats) {
      assert.equal(isValidStoredStats(stat), false);
    }
  });
});
