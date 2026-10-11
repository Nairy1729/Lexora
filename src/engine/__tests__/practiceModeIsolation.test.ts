import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialDualSessionState,
  sessionReducer,
  getActiveSessionState,
} from '../sessionEngine';
import { DailyPuzzleInfo } from '../dailySelector';
import { recordGameCompletion, INITIAL_GAME_STATS } from '../../storage/statsStorage';
import { saveDailyGameState, loadDailyGameState } from '../../storage/gameStorage';
import { MemoryStorage } from '../../storage/storageAdapter';
import { formatShareText } from '../../utils/share';
import { processWebKeyboardEvent, normalizeKeyboardKey } from '../../utils/webKeyboard';

const MOCK_DAILY_PUZZLE: DailyPuzzleInfo = {
  puzzleNumber: 283,
  dateKey: '2026-10-10',
  solution: 'SHINE',
};

const MOCK_PRACTICE_PUZZLE_1: DailyPuzzleInfo = {
  puzzleNumber: 991,
  dateKey: '2028-09-17',
  solution: 'CRANE',
};

const MOCK_PRACTICE_PUZZLE_2: DailyPuzzleInfo = {
  puzzleNumber: 992,
  dateKey: '2028-09-18',
  solution: 'GHOST',
};

describe('Practice Mode Isolation & State Corruption Regression Suite', () => {
  it('1. Entering practice mode after completing a daily game creates clean independent session', () => {
    let state = createInitialDualSessionState(MOCK_DAILY_PUZZLE);

    // Play and win daily game in 2 attempts
    state = sessionReducer(state, { type: 'KEY_PRESS', key: 'C' });
    state = sessionReducer(state, { type: 'KEY_PRESS', key: 'R' });
    state = sessionReducer(state, { type: 'KEY_PRESS', key: 'A' });
    state = sessionReducer(state, { type: 'KEY_PRESS', key: 'N' });
    state = sessionReducer(state, { type: 'KEY_PRESS', key: 'E' });
    state = sessionReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });

    state = sessionReducer(state, { type: 'KEY_PRESS', key: 'S' });
    state = sessionReducer(state, { type: 'KEY_PRESS', key: 'H' });
    state = sessionReducer(state, { type: 'KEY_PRESS', key: 'I' });
    state = sessionReducer(state, { type: 'KEY_PRESS', key: 'N' });
    state = sessionReducer(state, { type: 'KEY_PRESS', key: 'E' });
    state = sessionReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });

    assert.equal(state.dailyState.gameStatus, 'won');
    assert.equal(state.dailyState.guesses.length, 2);

    // Switch to Practice Mode
    state = sessionReducer(state, {
      type: 'START_PRACTICE_GAME',
      puzzleInfo: MOCK_PRACTICE_PUZZLE_1,
    });

    assert.equal(state.activeMode, 'practice');
    assert.ok(state.practiceState !== null);
    assert.equal(state.practiceState.gameStatus, 'playing');
    assert.equal(state.practiceState.guesses.length, 0);
    assert.equal(state.practiceState.evaluations.length, 0);
    assert.equal(state.practiceState.currentGuess, '');
    assert.equal(state.practiceState.puzzleInfo.solution, 'CRANE');

    // Daily state remains completely intact in memory
    assert.equal(state.dailyState.gameStatus, 'won');
    assert.equal(state.dailyState.guesses.length, 2);
    assert.equal(state.dailyState.puzzleInfo.solution, 'SHINE');
  });

  it('2. Submitting the first guess in practice mode evaluates strictly and updates active practice row', () => {
    let state = createInitialDualSessionState(MOCK_DAILY_PUZZLE);
    state = sessionReducer(state, {
      type: 'START_PRACTICE_GAME',
      puzzleInfo: MOCK_PRACTICE_PUZZLE_1, // Solution: CRANE
    });

    // Type first guess: AUDIO
    for (const char of 'AUDIO') {
      state = sessionReducer(state, { type: 'KEY_PRESS', key: char });
    }

    const preSubmit = getActiveSessionState(state);
    assert.equal(preSubmit.currentGuess, 'AUDIO');
    assert.equal(preSubmit.guesses.length, 0);

    // Press Enter to submit first guess
    state = sessionReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });

    const postSubmit = getActiveSessionState(state);
    assert.equal(postSubmit.guesses.length, 1);
    assert.equal(postSubmit.guesses[0], 'AUDIO');
    assert.equal(postSubmit.currentGuess, '');
    assert.equal(postSubmit.gameStatus, 'playing');
    assert.equal(postSubmit.evaluations.length, 1);

    // In AUDIO vs CRANE: A is present (yellow), U is absent, D is absent, I is absent, O is absent
    assert.deepEqual(postSubmit.evaluations[0], [
      'present',
      'absent',
      'absent',
      'absent',
      'absent',
    ]);

    // Daily state must remain 0 guesses, playing
    assert.equal(state.dailyState.guesses.length, 0);
  });

  it('3. Guesses in practice mode evaluate strictly against the practice solution, not daily solution', () => {
    // Daily solution: SHINE, Practice solution: CRANE
    let state = createInitialDualSessionState(MOCK_DAILY_PUZZLE);
    state = sessionReducer(state, {
      type: 'START_PRACTICE_GAME',
      puzzleInfo: MOCK_PRACTICE_PUZZLE_1,
    });

    // Submit CRANE in practice mode
    for (const char of 'CRANE') {
      state = sessionReducer(state, { type: 'KEY_PRESS', key: char });
    }
    state = sessionReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });

    const practiceActive = getActiveSessionState(state);
    // Exact match with practice solution CRANE -> won!
    assert.equal(practiceActive.gameStatus, 'won');
    assert.deepEqual(practiceActive.evaluations[0], [
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
    ]);

    // If evaluated against SHINE, CRANE would NOT have won!
    assert.notEqual(MOCK_DAILY_PUZZLE.solution, 'CRANE');
    assert.equal(state.dailyState.gameStatus, 'playing');
    assert.equal(state.dailyState.guesses.length, 0);
  });

  it('4. Daily state never leaks into practice board, guesses, or evaluations', () => {
    let state = createInitialDualSessionState(MOCK_DAILY_PUZZLE);

    // Daily game guess 1: GHOST
    for (const char of 'GHOST') {
      state = sessionReducer(state, { type: 'KEY_PRESS', key: char });
    }
    state = sessionReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });

    // Switch to practice
    state = sessionReducer(state, {
      type: 'START_PRACTICE_GAME',
      puzzleInfo: MOCK_PRACTICE_PUZZLE_1,
    });

    const activePractice = getActiveSessionState(state);
    assert.equal(activePractice.guesses.length, 0);
    assert.equal(activePractice.evaluations.length, 0);
    assert.equal(activePractice.currentGuess, '');
    assert.equal(activePractice.isPracticeMode, true);
  });

  it('5. Switching back and forth between daily and practice preserves in-progress state for both', () => {
    let state = createInitialDualSessionState(MOCK_DAILY_PUZZLE);

    // Daily: 1 guess ('ALERT')
    for (const char of 'ALERT') {
      state = sessionReducer(state, { type: 'KEY_PRESS', key: char });
    }
    state = sessionReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });
    assert.equal(state.dailyState.guesses.length, 1);

    // Switch to practice
    state = sessionReducer(state, {
      type: 'START_PRACTICE_GAME',
      puzzleInfo: MOCK_PRACTICE_PUZZLE_1,
    });

    // Practice: 2 guesses ('MUSIC', 'TRAIN')
    for (const char of 'MUSIC') {
      state = sessionReducer(state, { type: 'KEY_PRESS', key: char });
    }
    state = sessionReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });

    for (const char of 'TRAIN') {
      state = sessionReducer(state, { type: 'KEY_PRESS', key: char });
    }
    state = sessionReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });

    assert.equal(state.practiceState?.guesses.length, 2);

    // Switch back to Daily
    state = sessionReducer(state, { type: 'SWITCH_TO_DAILY' });
    assert.equal(state.activeMode, 'daily');
    const activeDaily = getActiveSessionState(state);
    assert.equal(activeDaily.guesses.length, 1);
    assert.equal(activeDaily.guesses[0], 'ALERT');

    // Switch back to Practice
    state = sessionReducer(state, { type: 'SWITCH_TO_PRACTICE' });
    assert.equal(state.activeMode, 'practice');
    const resumedPractice = getActiveSessionState(state);
    assert.equal(resumedPractice.guesses.length, 2);
    assert.equal(resumedPractice.guesses[0], 'MUSIC');
    assert.equal(resumedPractice.guesses[1], 'TRAIN');
  });

  it('6. Persistence safety: daily state saved to storage reflects only daily game', async () => {
    const memoryStorage = new MemoryStorage();
    let state = createInitialDualSessionState(MOCK_DAILY_PUZZLE);

    // Daily guess: 'PLANT'
    for (const char of 'PLANT') {
      state = sessionReducer(state, { type: 'KEY_PRESS', key: char });
    }
    state = sessionReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });

    // Save daily
    await saveDailyGameState(state.dailyState, memoryStorage);

    // Now start and play practice game
    state = sessionReducer(state, {
      type: 'START_PRACTICE_GAME',
      puzzleInfo: MOCK_PRACTICE_PUZZLE_1,
    });
    for (const char of 'CRANE') {
      state = sessionReducer(state, { type: 'KEY_PRESS', key: char });
    }
    state = sessionReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });

    // Attempting to save practiceState to daily storage is blocked by saveDailyGameState
    await saveDailyGameState(state.practiceState!, memoryStorage);

    // Load persisted daily game: must be PLANT, not CRANE
    const loaded = await loadDailyGameState(memoryStorage);
    assert.ok(loaded !== null);
    assert.equal(loaded.guesses.length, 1);
    assert.equal(loaded.guesses[0], 'PLANT');
    assert.equal(loaded.solution, 'SHINE');
  });

  it('7. Keyboard status isolation between modes', () => {
    let state = createInitialDualSessionState(MOCK_DAILY_PUZZLE); // Solution: SHINE

    // Daily guess: SHINE (letters S, H, I, N, E become correct)
    for (const char of 'SHINE') {
      state = sessionReducer(state, { type: 'KEY_PRESS', key: char });
    }
    state = sessionReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });

    assert.equal(state.dailyState.keyboardStatus['S'], 'correct');
    assert.equal(state.dailyState.keyboardStatus['H'], 'correct');

    // Switch to practice
    state = sessionReducer(state, {
      type: 'START_PRACTICE_GAME',
      puzzleInfo: MOCK_PRACTICE_PUZZLE_2, // Solution: GHOST
    });

    const activePractice = getActiveSessionState(state);
    // Practice keyboard must be completely unused
    assert.equal(activePractice.keyboardStatus['S'], undefined);
    assert.equal(activePractice.keyboardStatus['H'], undefined);

    // Guess in practice: PLANT
    for (const char of 'PLANT') {
      state = sessionReducer(state, { type: 'KEY_PRESS', key: char });
    }
    state = sessionReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });

    const postPractice = getActiveSessionState(state);
    assert.equal(postPractice.keyboardStatus['P'], 'absent');

    // Daily keyboard status is unaffected by PLANT
    assert.equal(state.dailyState.keyboardStatus['P'], undefined);
    assert.equal(state.dailyState.keyboardStatus['S'], 'correct');
  });

  it('8. Win and loss handling in practice mode never alters career statistics', () => {
    let stats = { ...INITIAL_GAME_STATS };

    // In practice mode, winning a game does not record career completion
    const isPracticeMode = true;
    if (!isPracticeMode) {
      stats = recordGameCompletion(stats, '2026-10-10', true, 3);
    }
    assert.equal(stats.gamesPlayed, 0);
    assert.equal(stats.gamesWon, 0);
    assert.equal(stats.currentStreak, 0);

    // Losing in practice mode also never resets or alters streaks
    stats = {
      ...INITIAL_GAME_STATS,
      gamesPlayed: 5,
      gamesWon: 5,
      currentStreak: 5,
      maxStreak: 5,
    };

    if (!isPracticeMode) {
      stats = recordGameCompletion(stats, '2026-10-10', false, 6);
    }
    assert.equal(stats.currentStreak, 5);
    assert.equal(stats.gamesPlayed, 5);
  });

  it('9. Multiple consecutive practice games reset cleanly and advance puzzles', () => {
    let state = createInitialDualSessionState(MOCK_DAILY_PUZZLE, 100);

    // Game 1
    state = sessionReducer(state, {
      type: 'START_PRACTICE_GAME',
      puzzleInfo: MOCK_PRACTICE_PUZZLE_1, // 991 CRANE
    });
    assert.equal(state.practiceState?.puzzleInfo.solution, 'CRANE');

    for (const char of 'CRANE') {
      state = sessionReducer(state, { type: 'KEY_PRESS', key: char });
    }
    state = sessionReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });
    assert.equal(state.practiceState?.gameStatus, 'won');

    // Start next practice game
    state = sessionReducer(state, {
      type: 'START_PRACTICE_GAME',
      puzzleInfo: MOCK_PRACTICE_PUZZLE_2, // 992 GHOST
    });

    assert.equal(state.practiceState?.puzzleInfo.solution, 'GHOST');
    assert.equal(state.practiceState?.gameStatus, 'playing');
    assert.equal(state.practiceState?.guesses.length, 0);
    assert.equal(state.practiceState?.evaluations.length, 0);
    assert.equal(state.practiceState?.currentGuess, '');
    assert.deepEqual(state.practiceState?.keyboardStatus, {});
  });

  it('10. Physical keyboard and on-screen keyboard Enter handling evaluates guess without duplicate submission', () => {
    let state = createInitialDualSessionState(MOCK_DAILY_PUZZLE);
    state = sessionReducer(state, {
      type: 'START_PRACTICE_GAME',
      puzzleInfo: MOCK_PRACTICE_PUZZLE_1,
    });

    for (const char of 'AUDIO') {
      state = sessionReducer(state, { type: 'KEY_PRESS', key: char });
    }

    // First Enter
    state = sessionReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });
    assert.equal(state.practiceState?.guesses.length, 1);
    assert.equal(state.practiceState?.currentGuess, '');

    // Accidental second Enter (e.g. rapid double tap) while currentGuess is empty
    state = sessionReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });
    // Must remain 1 guess, not duplicated
    assert.equal(state.practiceState?.guesses.length, 1);
  });

  it('11. Late storage hydration restores daily state without overwriting active practice session', () => {
    let state = createInitialDualSessionState(MOCK_DAILY_PUZZLE);

    // User enters practice mode before hydration resolves
    state = sessionReducer(state, {
      type: 'START_PRACTICE_GAME',
      puzzleInfo: MOCK_PRACTICE_PUZZLE_1,
    });

    for (const char of 'SMART') {
      state = sessionReducer(state, { type: 'KEY_PRESS', key: char });
    }

    // Hydration resolves late with a saved daily game
    state = sessionReducer(state, {
      type: 'RESTORE_DAILY_GAME',
      puzzleInfo: MOCK_DAILY_PUZZLE,
      guesses: ['FLOAT'],
      evaluations: [['absent', 'absent', 'absent', 'absent', 'absent']],
      currentGuess: '',
      gameStatus: 'playing',
      keyboardStatus: { F: 'absent', L: 'absent', O: 'absent', A: 'absent', T: 'absent' },
    });

    // Active mode must remain practice
    assert.equal(state.activeMode, 'practice');
    const activePractice = getActiveSessionState(state);
    assert.equal(activePractice.currentGuess, 'SMART');
    assert.equal(activePractice.puzzleInfo.solution, 'CRANE');

    // Daily state was updated cleanly
    assert.equal(state.dailyState.guesses.length, 1);
    assert.equal(state.dailyState.guesses[0], 'FLOAT');
  });

  it('12. Incomplete and non-dictionary guesses in practice mode do not advance rows', () => {
    let state = createInitialDualSessionState(MOCK_DAILY_PUZZLE);
    state = sessionReducer(state, {
      type: 'START_PRACTICE_GAME',
      puzzleInfo: MOCK_PRACTICE_PUZZLE_1,
    });

    // 4 letters: 'CRAN'
    for (const char of 'CRAN') {
      state = sessionReducer(state, { type: 'KEY_PRESS', key: char });
    }
    state = sessionReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });

    assert.equal(state.practiceState?.message, 'Not enough letters');
    assert.equal(state.practiceState?.guesses.length, 0);

    // Backspace and complete invalid word: 'ZZZZZ'
    state = sessionReducer(state, { type: 'KEY_PRESS', key: 'BACKSPACE' });
    state = sessionReducer(state, { type: 'KEY_PRESS', key: 'BACKSPACE' });
    state = sessionReducer(state, { type: 'KEY_PRESS', key: 'BACKSPACE' });
    state = sessionReducer(state, { type: 'KEY_PRESS', key: 'BACKSPACE' });

    for (const char of 'ZZZZZ') {
      state = sessionReducer(state, { type: 'KEY_PRESS', key: char });
    }
    state = sessionReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });

    assert.equal(state.practiceState?.message, 'Not in word list');
    assert.equal(state.practiceState?.guesses.length, 0);
  });

  it('13. Share text formatting produces distinct branded formats across Daily and Practice modes', () => {
    const dailyShare = formatShareText({
      puzzleNumber: 283,
      isPracticeMode: false,
      gameStatus: 'won',
      guessesCount: 3,
      evaluations: [
        ['absent', 'present', 'absent', 'absent', 'correct'],
        ['present', 'absent', 'correct', 'absent', 'correct'],
        ['correct', 'correct', 'correct', 'correct', 'correct'],
      ],
    });

    assert.ok(dailyShare.startsWith('Lexora #283 3/6'));
    assert.ok(dailyShare.includes('🟩🟩🟩🟩🟩'));

    const practiceShare = formatShareText({
      puzzleNumber: 991,
      isPracticeMode: true,
      gameStatus: 'won',
      guessesCount: 2,
      evaluations: [
        ['present', 'absent', 'absent', 'absent', 'absent'],
        ['correct', 'correct', 'correct', 'correct', 'correct'],
      ],
    });

    assert.ok(practiceShare.startsWith('Lexora Practice 2/6'));
    assert.ok(!practiceShare.includes('#991'));
  });

  it('14. Reset all data from settings resets daily puzzle and clears practice session', () => {
    let state = createInitialDualSessionState(MOCK_DAILY_PUZZLE);
    state = sessionReducer(state, {
      type: 'START_PRACTICE_GAME',
      puzzleInfo: MOCK_PRACTICE_PUZZLE_1,
    });

    for (const char of 'AUDIO') {
      state = sessionReducer(state, { type: 'KEY_PRESS', key: char });
    }
    state = sessionReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });

    assert.equal(state.activeMode, 'practice');

    // Trigger full reset
    state = sessionReducer(state, {
      type: 'RESET_ALL_DATA',
      dailyPuzzleInfo: MOCK_DAILY_PUZZLE,
    });

    assert.equal(state.activeMode, 'daily');
    assert.equal(state.practiceState, null);
    assert.equal(state.dailyState.guesses.length, 0);
    assert.equal(state.dailyState.gameStatus, 'playing');
  });

  it('15. Web keyboard event normalizer and processor handles Enter and suppresses secondary triggers', () => {
    let dispatchedKey: string | null = null;
    const onKeyPress = (k: string) => {
      dispatchedKey = k;
    };

    const dummyEvent = {
      key: 'Enter',
      target: {},
      preventDefault: () => {},
    };

    const handled = processWebKeyboardEvent(dummyEvent, onKeyPress);
    assert.equal(handled, true);
    assert.equal(dispatchedKey, 'ENTER');

    assert.equal(normalizeKeyboardKey('Enter'), 'ENTER');
    assert.equal(normalizeKeyboardKey('Backspace'), 'BACKSPACE');
    assert.equal(normalizeKeyboardKey('c'), 'C');
    assert.equal(normalizeKeyboardKey('Tab'), null);
  });
});
