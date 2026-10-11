/**
 * Lexora - Domain Types
 */

/** Letter evaluation feedback */
export type LetterEvaluation = 'correct' | 'present' | 'absent';

/** Status of an individual letter tile on the board */
export type TileStatus = 'empty' | 'tbd' | LetterEvaluation;

/** High-level game progression status */
export type GameStatus = 'playing' | 'won' | 'lost';

/** Evaluation status of an on-screen keyboard key */
export type KeyStatus = 'unused' | LetterEvaluation;

/** An individual letter tile */
export interface LetterTile {
  letter: string;
  status: TileStatus;
}

/** Complete evaluation of a single guess row */
export interface GuessRow {
  letters: LetterTile[];
  submitted: boolean;
}

/** Comprehensive snapshot of the active puzzle state */
export interface GameState {
  solution: string;
  guesses: string[];
  currentGuess: string;
  gameStatus: GameStatus;
  currentRowIndex: number;
  keyboardStatus: Record<string, KeyStatus>;
  dateKey: string; // ISO date format e.g. "2026-10-10"
  hardMode: boolean;
}

/** Player career statistics and win streaks */
export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  winPercentage: number;
  guessDistribution: Record<1 | 2 | 3 | 4 | 5 | 6, number>;
  lastCompletedDate?: string;
}
