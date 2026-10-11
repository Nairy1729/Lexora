import { test, describe } from 'node:test';
import assert from 'node:assert';
import { evaluateGuess, updateKeyboardStatus } from '../evaluator';
import { isValidWord, ANSWERS } from '../wordList';
import type { KeyStatus } from '../../types/game';

describe('Letter Evaluator', () => {
  test('evaluates exact match on all positions', () => {
    const result = evaluateGuess('ROAST', 'ROAST');
    assert.deepStrictEqual(result, ['correct', 'correct', 'correct', 'correct', 'correct']);
  });

  test('evaluates completely absent letters', () => {
    const result = evaluateGuess('PLUMB', 'FIGHT');
    assert.deepStrictEqual(result, ['absent', 'absent', 'absent', 'absent', 'absent']);
  });

  test('evaluates misplaced letters without duplicates', () => {
    // Solution: SLATE, Guess: LEAST -> All letters present in different positions
    const result = evaluateGuess('LEAST', 'SLATE');
    assert.deepStrictEqual(result, ['present', 'present', 'correct', 'present', 'present']);
  });

  test('handles repeated letters in guess when solution has only one copy', () => {
    // Solution: ROBOT (B: 1, O: 2 at 1,3), Guess: BOBBY (B at 0, 2, 3; O at 1)
    // Pass 1: index 1 ('O' === 'O') is 'correct'.
    //         index 2 ('B' === 'B') is 'correct'. B count becomes 0.
    // Pass 2: indices 0 and 3 ('B') get 'absent' because remaining B count is 0.
    const result = evaluateGuess('BOBBY', 'ROBOT');
    assert.deepStrictEqual(result, ['absent', 'correct', 'correct', 'absent', 'absent']);
  });

  test('handles repeated letters when exact match claims one and another is present', () => {
    // Solution: APPLE (P: 2), Guess: PUPPY (P at 0, 2, 3)
    // Pass 1: index 2 is exact match ('correct'). Remaining P count is 1.
    // Pass 2: index 0 gets 'present' (remaining P count becomes 0).
    // index 3 gets 'absent' (0 remaining).
    const result = evaluateGuess('PUPPY', 'APPLE');
    assert.deepStrictEqual(result, ['present', 'absent', 'correct', 'absent', 'absent']);
  });

  test('handles repeated letters in guess when solution has fewer occurrences (SPEED vs ERASE)', () => {
    // Solution: SPEED (E at 2, 3), Guess: ERASE (E at 0, 4)
    // No exact matches. Both E's in guess can be marked 'present' since SPEED has two E's.
    const result = evaluateGuess('ERASE', 'SPEED');
    assert.deepStrictEqual(result, ['present', 'absent', 'absent', 'present', 'present']);
  });

  test('handles repeated letters in guess when solution has only one (GEESE vs EAGLE)', () => {
    // Solution: EAGLE (E at 0, 4), Guess: EERIE (E at 0, 1, 4)
    // Exact match at index 0 ('E' === 'E') and index 4 ('E' === 'E').
    // Solution has 2 E's, both consumed in Pass 1.
    // Index 1 'E' must be marked 'absent'.
    const result = evaluateGuess('EERIE', 'EAGLE');
    assert.deepStrictEqual(result, ['correct', 'absent', 'absent', 'absent', 'correct']);
  });

  test('case-insensitivity of evaluation', () => {
    const result = evaluateGuess('crane', 'CRANE');
    assert.deepStrictEqual(result, ['correct', 'correct', 'correct', 'correct', 'correct']);
  });

  test('throws error for inputs with length other than 5', () => {
    assert.throws(() => evaluateGuess('CAT', 'CRANE'), /must be exactly 5 letters/);
    assert.throws(() => evaluateGuess('CRANES', 'CRANE'), /must be exactly 5 letters/);
  });
});

describe('Keyboard Status Updates', () => {
  test('promotes unused keys to evaluated status', () => {
    const initial: Record<string, KeyStatus> = {};
    const updated = updateKeyboardStatus(initial, 'CRANE', ['correct', 'present', 'absent', 'absent', 'unused' as any]);

    assert.strictEqual(updated['C'], 'correct');
    assert.strictEqual(updated['R'], 'present');
    assert.strictEqual(updated['A'], 'absent');
    assert.strictEqual(updated['N'], 'absent');
  });

  test('never downgrades correct key to present or absent', () => {
    const initial: Record<string, KeyStatus> = { C: 'correct' };
    const updated = updateKeyboardStatus(initial, 'CHAIR', ['absent', 'absent', 'absent', 'absent', 'absent']);

    assert.strictEqual(updated['C'], 'correct');
  });

  test('promotes present key to correct when hit exactly', () => {
    const initial: Record<string, KeyStatus> = { R: 'present' };
    const updated = updateKeyboardStatus(initial, 'ROAST', ['correct', 'absent', 'absent', 'absent', 'absent']);

    assert.strictEqual(updated['R'], 'correct');
  });

  test('does not overwrite present key with absent', () => {
    const initial: Record<string, KeyStatus> = { R: 'present' };
    const updated = updateKeyboardStatus(initial, 'RIVER', ['absent', 'absent', 'absent', 'absent', 'absent']);

    assert.strictEqual(updated['R'], 'present');
  });
});

describe('Word List & Validation', () => {
  test('accepts valid words in curated dictionary', () => {
    assert.strictEqual(isValidWord('CRANE'), true);
    assert.strictEqual(isValidWord('SLATE'), true);
    assert.strictEqual(isValidWord('crane'), true); // case-insensitive
  });

  test('rejects words not in dictionary or wrong length', () => {
    assert.strictEqual(isValidWord('XYZWV'), false);
    assert.strictEqual(isValidWord('CAT'), false);
    assert.strictEqual(isValidWord('BANANAS'), false);
    assert.strictEqual(isValidWord(''), false);
  });

  test('all curated answers are exactly 5 characters and in valid guesses', () => {
    assert.ok(ANSWERS.length >= 150);
    const uniqueAnswers = new Set(ANSWERS);
    assert.strictEqual(uniqueAnswers.size, ANSWERS.length); // Zero duplicates

    for (const word of ANSWERS) {
      assert.strictEqual(word.length, 5);
      assert.strictEqual(isValidWord(word), true);
    }
  });

  test('regression: four-letter words are strictly rejected', () => {
    const fourLetterWords = ['FLAT', 'GRIP', 'IDLE', 'LEAD', 'LEAF', 'LEAN', 'SEAL', 'SEED', 'THIN', 'WAVE'];
    for (const word of fourLetterWords) {
      assert.strictEqual(isValidWord(word), false);
    }
  });
});
