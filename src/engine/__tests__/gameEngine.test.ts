import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  createInitialGameState,
  gameReducer,
  GameEngineState,
} from '../gameEngine';
import { isValidWord } from '../wordList';
import { DailyPuzzleInfo } from '../dailySelector';

const TEST_PUZZLE: DailyPuzzleInfo = {
  puzzleNumber: 1,
  dateKey: '2026-10-10',
  solution: 'LATCH',
};

function typeWord(state: GameEngineState, word: string): GameEngineState {
  let s = state;
  for (const ch of word) {
    s = gameReducer(s, { type: 'KEY_PRESS', key: ch });
  }
  return s;
}

describe('Game Engine & Submission Flow', () => {
  test('confirms WOMEN is a valid 5-letter guess in the dictionary', () => {
    assert.strictEqual(isValidWord('WOMEN'), true);
  });

  test('valid 5-letter guess (WOMEN) advances active row and evaluates all tiles', () => {
    let state = createInitialGameState(TEST_PUZZLE);
    assert.strictEqual(state.guesses.length, 0);

    // Type WOMEN
    state = typeWord(state, 'WOMEN');
    assert.strictEqual(state.currentGuess, 'WOMEN');

    // Press ENTER to submit
    state = gameReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });

    // Must advance to next row
    assert.strictEqual(state.guesses.length, 1);
    assert.strictEqual(state.guesses[0], 'WOMEN');
    assert.strictEqual(state.currentGuess, ''); // Reset for next row
    assert.strictEqual(state.message, null); // Error-free

    // All 5 tiles must have evaluations
    assert.strictEqual(state.evaluations.length, 1);
    assert.strictEqual(state.evaluations[0].length, 5);

    // Solution is LATCH. For WOMEN: W, O, M, E, N are all absent
    assert.deepStrictEqual(state.evaluations[0], [
      'absent',
      'absent',
      'absent',
      'absent',
      'absent',
    ]);

    // Keyboard letter statuses must update
    assert.strictEqual(state.keyboardStatus['W'], 'absent');
    assert.strictEqual(state.keyboardStatus['O'], 'absent');
    assert.strictEqual(state.keyboardStatus['M'], 'absent');
    assert.strictEqual(state.keyboardStatus['E'], 'absent');
    assert.strictEqual(state.keyboardStatus['N'], 'absent');
  });

  test('incomplete guess (< 5 letters) is rejected with feedback and does not consume attempt', () => {
    let state = createInitialGameState(TEST_PUZZLE);
    state = typeWord(state, 'CAT');
    assert.strictEqual(state.currentGuess, 'CAT');

    state = gameReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });

    // Attempt must NOT be consumed
    assert.strictEqual(state.guesses.length, 0);
    assert.strictEqual(state.currentGuess, 'CAT');
    assert.strictEqual(state.message, 'Not enough letters');
  });

  test('invalid word (not in dictionary) is rejected with feedback and does not consume attempt', () => {
    let state = createInitialGameState(TEST_PUZZLE);
    state = typeWord(state, 'ZZZZZ');
    assert.strictEqual(state.currentGuess, 'ZZZZZ');

    state = gameReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });

    // Attempt must NOT be consumed
    assert.strictEqual(state.guesses.length, 0);
    assert.strictEqual(state.currentGuess, 'ZZZZZ');
    assert.strictEqual(state.message, 'Not in word list');
  });

  test('rapid Enter taps cannot submit duplicate guess once currentGuess is reset', () => {
    let state = createInitialGameState(TEST_PUZZLE);
    state = typeWord(state, 'CRANE');

    // First Enter
    state = gameReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });
    assert.strictEqual(state.guesses.length, 1);
    assert.strictEqual(state.currentGuess, '');

    // Second rapid Enter
    state = gameReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });
    // Must NOT add second attempt because currentGuess is empty
    assert.strictEqual(state.guesses.length, 1);
    assert.strictEqual(state.message, 'Not enough letters');
  });

  test('game transitions to won on exact match and blocks further input', () => {
    let state = createInitialGameState(TEST_PUZZLE); // Solution is LATCH
    state = typeWord(state, 'LATCH');
    state = gameReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });

    assert.strictEqual(state.gameStatus, 'won');
    assert.strictEqual(state.message, 'Genius!');
    assert.strictEqual(state.guesses.length, 1);

    // Any further key presses must be ignored
    state = gameReducer(state, { type: 'KEY_PRESS', key: 'S' });
    assert.strictEqual(state.currentGuess, '');
  });

  test('game ends in lost after 6 failed attempts and displays the solution', () => {
    let state = createInitialGameState(TEST_PUZZLE); // Solution is LATCH
    const validGuesses = ['CRANE', 'SLATE', 'ROAST', 'PLANT', 'SHINE', 'CLOUD'];

    for (let i = 0; i < 6; i++) {
      state = typeWord(state, validGuesses[i]);
      state = gameReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });
    }

    assert.strictEqual(state.guesses.length, 6);
    assert.strictEqual(state.gameStatus, 'lost');
    assert.strictEqual(state.message, 'The word was LATCH');

    // Further inputs must be blocked
    state = gameReducer(state, { type: 'KEY_PRESS', key: 'A' });
    assert.strictEqual(state.currentGuess, '');
  });

  test('backspace deletes last character of currentGuess', () => {
    let state = createInitialGameState(TEST_PUZZLE);
    state = typeWord(state, 'WOME');
    assert.strictEqual(state.currentGuess, 'WOME');

    state = gameReducer(state, { type: 'KEY_PRESS', key: 'BACKSPACE' });
    assert.strictEqual(state.currentGuess, 'WOM');

    state = gameReducer(state, { type: 'KEY_PRESS', key: '⌫' });
    assert.strictEqual(state.currentGuess, 'WO');
  });

  test('backspace on empty guess is a safe no-op', () => {
    let state = createInitialGameState(TEST_PUZZLE);
    state = gameReducer(state, { type: 'KEY_PRESS', key: 'BACKSPACE' });
    assert.strictEqual(state.currentGuess, '');
  });

  test('ignores non-alphabetical characters, symbols and numbers', () => {
    let state = createInitialGameState(TEST_PUZZLE);
    state = gameReducer(state, { type: 'KEY_PRESS', key: '1' });
    state = gameReducer(state, { type: 'KEY_PRESS', key: '?' });
    state = gameReducer(state, { type: 'KEY_PRESS', key: ' ' });
    state = gameReducer(state, { type: 'KEY_PRESS', key: 'A' });
    assert.strictEqual(state.currentGuess, 'A');
  });

  test('typing past 5 letters is strictly blocked', () => {
    let state = createInitialGameState(TEST_PUZZLE);
    state = typeWord(state, 'CRANES'); // 6 letters
    assert.strictEqual(state.currentGuess, 'CRANE'); // Exactly 5
  });

  test('CLEAR_MESSAGE action resets transient message', () => {
    let state = createInitialGameState(TEST_PUZZLE);
    state = gameReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });
    assert.strictEqual(state.message, 'Not enough letters');

    state = gameReducer(state, { type: 'CLEAR_MESSAGE' });
    assert.strictEqual(state.message, null);
  });
});
