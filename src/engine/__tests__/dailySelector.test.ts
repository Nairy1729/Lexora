import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  getDailyPuzzle,
  getPuzzleByNumber,
  getUtcDateKey,
  REFERENCE_EPOCH_MS,
  MS_PER_DAY,
} from '../dailySelector';
import { ANSWERS, isValidWord } from '../wordList';

describe('Daily Puzzle Selector', () => {
  test('selects puzzle #1 on the reference epoch date (2026-01-01)', () => {
    const epochDate = new Date(REFERENCE_EPOCH_MS);
    const puzzle = getDailyPuzzle(epochDate);

    assert.strictEqual(puzzle.puzzleNumber, 1);
    assert.strictEqual(puzzle.dateKey, '2026-01-01');
    assert.strictEqual(puzzle.solution, ANSWERS[0]);
  });

  test('is deterministic: repeatedly calling for the same date yields identical results', () => {
    const testDate = new Date('2026-10-10T12:00:00.000Z');
    const firstCall = getDailyPuzzle(testDate);
    const secondCall = getDailyPuzzle(testDate);
    const thirdCall = getDailyPuzzle(new Date('2026-10-10T23:30:00.000Z')); // different time, same UTC day

    assert.deepStrictEqual(firstCall, secondCall);
    assert.strictEqual(firstCall.puzzleNumber, thirdCall.puzzleNumber);
    assert.strictEqual(firstCall.solution, thirdCall.solution);
    assert.strictEqual(firstCall.dateKey, thirdCall.dateKey);
  });

  test('respects strict UTC midnight boundaries', () => {
    // 1 millisecond before midnight UTC
    const beforeMidnight = new Date('2026-05-15T23:59:59.999Z');
    // Exactly at midnight UTC
    const atMidnight = new Date('2026-05-16T00:00:00.000Z');

    const puzzleBefore = getDailyPuzzle(beforeMidnight);
    const puzzleAtMidnight = getDailyPuzzle(atMidnight);

    assert.strictEqual(puzzleBefore.dateKey, '2026-05-15');
    assert.strictEqual(puzzleAtMidnight.dateKey, '2026-05-16');
    assert.strictEqual(puzzleAtMidnight.puzzleNumber, puzzleBefore.puzzleNumber + 1);
  });

  test('formats date keys accurately', () => {
    const d = new Date(Date.UTC(2026, 3, 5)); // April 5, 2026
    assert.strictEqual(getUtcDateKey(d), '2026-04-05');
  });

  test('selected solution is always a valid five-letter word in ANSWERS', () => {
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const d = new Date(REFERENCE_EPOCH_MS + dayOffset * MS_PER_DAY);
      const puzzle = getDailyPuzzle(d);

      assert.strictEqual(puzzle.solution.length, 5);
      assert.strictEqual(isValidWord(puzzle.solution), true);
      assert.strictEqual(ANSWERS.includes(puzzle.solution), true);
    }
  });

  test('getPuzzleByNumber returns corresponding puzzle info accurately', () => {
    const puzzle1 = getPuzzleByNumber(1);
    assert.strictEqual(puzzle1.puzzleNumber, 1);
    assert.strictEqual(puzzle1.dateKey, '2026-01-01');
    assert.strictEqual(puzzle1.solution, ANSWERS[0]);

    const puzzle2 = getPuzzleByNumber(2);
    assert.strictEqual(puzzle2.puzzleNumber, 2);
    assert.strictEqual(puzzle2.dateKey, '2026-01-02');
    assert.strictEqual(puzzle2.solution, ANSWERS[1]);
  });

  test('gracefully wraps around when day index exceeds answer list length', () => {
    const count = ANSWERS.length;
    const puzzleA = getPuzzleByNumber(1);
    const puzzleWrapped = getPuzzleByNumber(1 + count);

    assert.strictEqual(puzzleWrapped.solution, puzzleA.solution);
    assert.strictEqual(puzzleWrapped.puzzleNumber, 1 + count);
  });

  test('timezone consistency: same instant represented in different timezones evaluates to identical UTC puzzle', () => {
    // 2026-06-15 10:00:00 UTC
    const dateUtc = new Date('2026-06-15T10:00:00.000Z');
    const puzzle = getDailyPuzzle(dateUtc);

    // Any Date instance representing the same UTC epoch ms yields identical puzzle
    const clone = new Date(dateUtc.getTime());
    const puzzleClone = getDailyPuzzle(clone);

    assert.strictEqual(puzzle.puzzleNumber, puzzleClone.puzzleNumber);
    assert.strictEqual(puzzle.dateKey, puzzleClone.dateKey);
    assert.strictEqual(puzzle.solution, puzzleClone.solution);
  });

  test('gracefully handles dates prior to reference epoch with mathematical modulo', () => {
    const priorDate = new Date(REFERENCE_EPOCH_MS - MS_PER_DAY);
    const puzzle = getDailyPuzzle(priorDate);

    assert.strictEqual(puzzle.puzzleNumber, 0);
    assert.strictEqual(puzzle.dateKey, '2025-12-31');
    assert.strictEqual(typeof puzzle.solution, 'string');
    assert.strictEqual(puzzle.solution.length, 5);
  });
});
