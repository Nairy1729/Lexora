/**
 * Lexora Share Utilities
 * Formats shareable emoji grids and coordinates native sharing and clipboard actions.
 * Never leaks the secret word or letters.
 */

import { LetterEvaluation } from '../types/game';

export interface FormatShareOptions {
  puzzleNumber: number;
  isPracticeMode?: boolean;
  gameStatus: 'won' | 'lost' | 'playing';
  guessesCount: number;
  maxGuesses?: number;
  evaluations: LetterEvaluation[][];
}

let nativeShare: any = null;
let nativeClipboard: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const RN = require('react-native');
  nativeShare = RN.Share;
} catch {
  nativeShare = null;
}

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  nativeClipboard = require('expo-clipboard');
} catch {
  nativeClipboard = null;
}

/**
 * Formats a 2D array of evaluations into classic Wordle colored emoji squares.
 * 🟩 = correct
 * 🟨 = present
 * ⬛ = absent
 */
export function formatEvaluationGrid(evaluations: LetterEvaluation[][]): string {
  const squareMap: Record<LetterEvaluation, string> = {
    correct: '🟩',
    present: '🟨',
    absent: '⬛',
  };

  return evaluations
    .map((row) => row.map((letterEval) => squareMap[letterEval] || '⬛').join(''))
    .join('\n');
}

/**
 * Builds the complete, branded share text:
 * E.g.
 * Lexora #283 3/6
 *
 * ⬛🟨⬛⬛🟩
 * 🟨⬛🟩⬛🟩
 * 🟩🟩🟩🟩🟩
 */
export function formatShareText(options: FormatShareOptions): string {
  const {
    puzzleNumber,
    isPracticeMode = false,
    gameStatus,
    guessesCount,
    maxGuesses = 6,
    evaluations,
  } = options;

  const scoreText = gameStatus === 'won' ? `${guessesCount}/${maxGuesses}` : `X/${maxGuesses}`;
  const header = isPracticeMode
    ? `Lexora Practice ${scoreText}`
    : `Lexora #${puzzleNumber} ${scoreText}`;

  const grid = formatEvaluationGrid(evaluations);
  return `${header}\n\n${grid}`;
}

/**
 * Triggers the native platform share dialog.
 */
export async function shareGameResult(text: string): Promise<boolean> {
  if (!nativeShare) {
    return false;
  }

  try {
    const result = await nativeShare.share({
      message: text,
      title: 'Lexora Result',
    });
    // On iOS dismissedAction or sharedAction, on Android action is sharedAction
    return result.action !== nativeShare.dismissedAction;
  } catch {
    return false;
  }
}

/**
 * Copies share text directly to the device clipboard.
 */
export async function copyShareTextToClipboard(text: string): Promise<boolean> {
  if (!nativeClipboard?.setStringAsync) {
    return false;
  }

  try {
    await nativeClipboard.setStringAsync(text);
    return true;
  } catch {
    return false;
  }
}
