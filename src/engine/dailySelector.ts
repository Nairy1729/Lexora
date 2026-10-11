import { ANSWERS } from './wordList';

export interface DailyPuzzleInfo {
  puzzleNumber: number;
  dateKey: string; // ISO date format "YYYY-MM-DD"
  solution: string;
}

/**
 * Fixed reference epoch date for Lexora (2026-01-01T00:00:00.000Z).
 * Puzzle #1 corresponds to this exact UTC date.
 */
export const REFERENCE_EPOCH_MS = Date.UTC(2026, 0, 1, 0, 0, 0, 0);
export const MS_PER_DAY = 86_400_000;

/**
 * Returns the deterministic day index relative to the reference epoch in UTC.
 * Respects strict UTC midnight boundaries.
 */
export function getUtcDayIndex(date: Date): number {
  const utcTimestamp = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );
  return Math.floor((utcTimestamp - REFERENCE_EPOCH_MS) / MS_PER_DAY);
}

/**
 * Formats a Date object into a UTC ISO date key ("YYYY-MM-DD").
 */
export function getUtcDateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Retrieves the deterministic daily puzzle for a given date (defaults to current date).
 * Guaranteed to produce identical results for all players worldwide on the same UTC calendar day.
 */
export function getDailyPuzzle(date: Date = new Date()): DailyPuzzleInfo {
  const dayIndex = getUtcDayIndex(date);
  const totalAnswers = ANSWERS.length;

  // Handle positive or negative day offsets smoothly
  const normalizedIndex = ((dayIndex % totalAnswers) + totalAnswers) % totalAnswers;
  const puzzleNumber = dayIndex + 1;
  const dateKey = getUtcDateKey(date);
  const solution = ANSWERS[normalizedIndex];

  return {
    puzzleNumber,
    dateKey,
    solution,
  };
}

/**
 * Retrieves a puzzle by explicit puzzle index (useful for practice/dev modes).
 */
export function getPuzzleByNumber(puzzleNumber: number): DailyPuzzleInfo {
  const totalAnswers = ANSWERS.length;
  const dayIndex = puzzleNumber - 1;
  const normalizedIndex = ((dayIndex % totalAnswers) + totalAnswers) % totalAnswers;

  // Compute corresponding date
  const dateMs = REFERENCE_EPOCH_MS + dayIndex * MS_PER_DAY;
  const date = new Date(dateMs);

  return {
    puzzleNumber,
    dateKey: getUtcDateKey(date),
    solution: ANSWERS[normalizedIndex],
  };
}
