import { LetterEvaluation, KeyStatus, GameStatus } from '../types/game';
import { evaluateGuess, updateKeyboardStatus } from './evaluator';
import { isValidWord } from './wordList';
import { DailyPuzzleInfo } from './dailySelector';

export interface GameEngineState {
  puzzleInfo: DailyPuzzleInfo;
  guesses: string[];
  evaluations: LetterEvaluation[][];
  currentGuess: string;
  gameStatus: GameStatus;
  keyboardStatus: Record<string, KeyStatus>;
  message: string | null;
  isPracticeMode: boolean;
}

export const WIN_MESSAGES = [
  'Genius!',
  'Magnificent!',
  'Impressive!',
  'Splendid!',
  'Great!',
  'Phew!',
];

/**
 * Creates a clean, initial game state for a given puzzle.
 */
export function createInitialGameState(
  puzzleInfo: DailyPuzzleInfo,
  isPracticeMode: boolean = false
): GameEngineState {
  return {
    puzzleInfo,
    guesses: [],
    evaluations: [],
    currentGuess: '',
    gameStatus: 'playing',
    keyboardStatus: {},
    message: null,
    isPracticeMode,
  };
}

export type GameAction =
  | { type: 'KEY_PRESS'; key: string }
  | { type: 'CLEAR_MESSAGE' }
  | { type: 'RESET_GAME'; puzzleInfo: DailyPuzzleInfo; isPracticeMode: boolean }
  | {
      type: 'RESTORE_SAVED_GAME';
      puzzleInfo: DailyPuzzleInfo;
      guesses: string[];
      evaluations: LetterEvaluation[][];
      currentGuess: string;
      gameStatus: GameStatus;
      keyboardStatus: Record<string, KeyStatus>;
    };

/**
 * Pure state reducer implementing the complete Lexora game rules.
 * Handles key input, backspace, validation, evaluation, row advancement, and win/loss transitions.
 */
export function gameReducer(state: GameEngineState, action: GameAction): GameEngineState {
  switch (action.type) {
    case 'CLEAR_MESSAGE': {
      if (!state.message) return state;
      return { ...state, message: null };
    }

    case 'RESET_GAME': {
      return createInitialGameState(action.puzzleInfo, action.isPracticeMode);
    }

    case 'RESTORE_SAVED_GAME': {
      let finalMessage = null;
      if (action.gameStatus === 'won') {
        finalMessage = WIN_MESSAGES[action.guesses.length - 1] || 'Splendid!';
      } else if (action.gameStatus === 'lost') {
        finalMessage = `The word was ${action.puzzleInfo.solution}`;
      }
      return {
        puzzleInfo: action.puzzleInfo,
        guesses: action.guesses,
        evaluations: action.evaluations,
        currentGuess: action.currentGuess,
        gameStatus: action.gameStatus,
        keyboardStatus: action.keyboardStatus,
        message: finalMessage,
        isPracticeMode: false,
      };
    }

    case 'KEY_PRESS': {
      const { key } = action;

      // Prevent any inputs if game is already won or lost
      if (state.gameStatus !== 'playing') {
        return state;
      }

      const upperKey = key.toUpperCase();

      // Handle Backspace
      if (upperKey === 'BACKSPACE' || upperKey === 'DELETE' || upperKey === '⌫') {
        if (state.currentGuess.length === 0) {
          return state;
        }
        return {
          ...state,
          currentGuess: state.currentGuess.slice(0, -1),
          message: null,
        };
      }

      // Handle Enter (Submission)
      if (upperKey === 'ENTER') {
        // Enforce 6-attempt maximum
        if (state.guesses.length >= 6) {
          return state;
        }

        // Validate length
        if (state.currentGuess.length < 5) {
          return {
            ...state,
            message: 'Not enough letters',
          };
        }

        // Validate dictionary membership
        if (!isValidWord(state.currentGuess)) {
          return {
            ...state,
            message: 'Not in word list',
          };
        }

        // Evaluate guess against daily solution
        const newEval = evaluateGuess(state.currentGuess, state.puzzleInfo.solution);
        const nextGuesses = [...state.guesses, state.currentGuess];
        const nextEvals = [...state.evaluations, newEval];
        const nextKeyboard = updateKeyboardStatus(state.keyboardStatus, state.currentGuess, newEval);

        // Check victory
        if (state.currentGuess === state.puzzleInfo.solution) {
          const winMsg = WIN_MESSAGES[nextGuesses.length - 1] || 'Splendid!';
          return {
            ...state,
            guesses: nextGuesses,
            evaluations: nextEvals,
            keyboardStatus: nextKeyboard,
            currentGuess: '',
            gameStatus: 'won',
            message: winMsg,
          };
        }

        // Check loss (exhausted 6 attempts)
        if (nextGuesses.length >= 6) {
          return {
            ...state,
            guesses: nextGuesses,
            evaluations: nextEvals,
            keyboardStatus: nextKeyboard,
            currentGuess: '',
            gameStatus: 'lost',
            message: `The word was ${state.puzzleInfo.solution}`,
          };
        }

        // Advance to next row
        return {
          ...state,
          guesses: nextGuesses,
          evaluations: nextEvals,
          keyboardStatus: nextKeyboard,
          currentGuess: '',
          message: null,
        };
      }

      // Handle standard letter key A-Z
      if (/^[A-Z]$/.test(upperKey)) {
        if (state.currentGuess.length >= 5) {
          return state; // Already full 5 letters
        }
        return {
          ...state,
          currentGuess: state.currentGuess + upperKey,
          message: null,
        };
      }

      return state;
    }

    default:
      return state;
  }
}
