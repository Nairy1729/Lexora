/**
 * Lexora - Dual Session Engine
 *
 * Implements strict state isolation between Daily Mode and Practice Mode:
 * - Independent game boards, guesses, evaluations, keyboard statuses, and solutions.
 * - Daily game progress and career statistics are protected from practice gameplay.
 * - Switching modes preserves in-progress sessions for seamless resume.
 * - Storage hydration updates daily session without overwriting active practice session.
 */

import { GameEngineState, gameReducer, createInitialGameState } from './gameEngine';
import { DailyPuzzleInfo, getDailyPuzzle, getPuzzleByNumber } from './dailySelector';
import { LetterEvaluation, KeyStatus, GameStatus } from '../types/game';

export type ActiveGameMode = 'daily' | 'practice';

export interface DualSessionState {
  activeMode: ActiveGameMode;
  dailyState: GameEngineState;
  practiceState: GameEngineState | null;
  practiceIndex: number;
}

export type DualSessionAction =
  | { type: 'KEY_PRESS'; key: string }
  | { type: 'CLEAR_MESSAGE' }
  | { type: 'START_PRACTICE_GAME'; puzzleInfo?: DailyPuzzleInfo }
  | { type: 'SWITCH_TO_DAILY' }
  | { type: 'SWITCH_TO_PRACTICE'; puzzleInfo?: DailyPuzzleInfo }
  | {
      type: 'RESTORE_DAILY_GAME';
      puzzleInfo: DailyPuzzleInfo;
      guesses: string[];
      evaluations: LetterEvaluation[][];
      currentGuess: string;
      gameStatus: GameStatus;
      keyboardStatus: Record<string, KeyStatus>;
    }
  | { type: 'RESET_ALL_DATA'; dailyPuzzleInfo: DailyPuzzleInfo };

/**
 * Creates the initial dual-session state.
 */
export function createInitialDualSessionState(
  initialDailyPuzzle: DailyPuzzleInfo = getDailyPuzzle(),
  initialPracticeIndex: number = 100
): DualSessionState {
  return {
    activeMode: 'daily',
    dailyState: createInitialGameState(initialDailyPuzzle, false),
    practiceState: null,
    practiceIndex: initialPracticeIndex,
  };
}

/**
 * Pure reducer that coordinates Daily and Practice game sessions.
 */
export function sessionReducer(
  state: DualSessionState,
  action: DualSessionAction
): DualSessionState {
  switch (action.type) {
    case 'START_PRACTICE_GAME': {
      const nextIndex = state.practiceIndex + 1;
      const nextPuzzle = action.puzzleInfo || getPuzzleByNumber(nextIndex);
      return {
        ...state,
        activeMode: 'practice',
        practiceIndex: nextIndex,
        practiceState: createInitialGameState(nextPuzzle, true),
      };
    }

    case 'SWITCH_TO_DAILY': {
      return {
        ...state,
        activeMode: 'daily',
      };
    }

    case 'SWITCH_TO_PRACTICE': {
      if (state.practiceState) {
        return {
          ...state,
          activeMode: 'practice',
        };
      }
      const nextIndex = state.practiceIndex + 1;
      const nextPuzzle = action.puzzleInfo || getPuzzleByNumber(nextIndex);
      return {
        ...state,
        activeMode: 'practice',
        practiceIndex: nextIndex,
        practiceState: createInitialGameState(nextPuzzle, true),
      };
    }

    case 'RESTORE_DAILY_GAME': {
      const restoredDaily = gameReducer(state.dailyState, {
        type: 'RESTORE_SAVED_GAME',
        puzzleInfo: action.puzzleInfo,
        guesses: action.guesses,
        evaluations: action.evaluations,
        currentGuess: action.currentGuess,
        gameStatus: action.gameStatus,
        keyboardStatus: action.keyboardStatus,
      });

      return {
        ...state,
        dailyState: restoredDaily,
        // Active mode and practice state remain completely untouched
      };
    }

    case 'RESET_ALL_DATA': {
      return {
        activeMode: 'daily',
        dailyState: createInitialGameState(action.dailyPuzzleInfo, false),
        practiceState: null,
        practiceIndex: 100,
      };
    }

    case 'CLEAR_MESSAGE': {
      if (state.activeMode === 'practice') {
        if (!state.practiceState) return state;
        return {
          ...state,
          practiceState: gameReducer(state.practiceState, { type: 'CLEAR_MESSAGE' }),
        };
      } else {
        return {
          ...state,
          dailyState: gameReducer(state.dailyState, { type: 'CLEAR_MESSAGE' }),
        };
      }
    }

    case 'KEY_PRESS': {
      if (state.activeMode === 'practice') {
        let currentPractice = state.practiceState;
        if (!currentPractice) {
          const nextIndex = state.practiceIndex + 1;
          currentPractice = createInitialGameState(getPuzzleByNumber(nextIndex), true);
        }
        const updatedPractice = gameReducer(currentPractice, {
          type: 'KEY_PRESS',
          key: action.key,
        });
        return {
          ...state,
          practiceState: updatedPractice,
          // Daily state is completely untouched
        };
      } else {
        const updatedDaily = gameReducer(state.dailyState, {
          type: 'KEY_PRESS',
          key: action.key,
        });
        return {
          ...state,
          dailyState: updatedDaily,
          // Practice state is completely untouched
        };
      }
    }

    default:
      return state;
  }
}

/**
 * Helper to extract the currently active session state.
 */
export function getActiveSessionState(state: DualSessionState): GameEngineState {
  if (state.activeMode === 'practice' && state.practiceState) {
    return state.practiceState;
  }
  return state.dailyState;
}
