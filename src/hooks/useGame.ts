import { useReducer, useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { LetterEvaluation, KeyStatus, GameStatus } from '../types/game';
import { DailyPuzzleInfo, getDailyPuzzle } from '../engine/dailySelector';
import {
  sessionReducer,
  createInitialDualSessionState,
  getActiveSessionState,
} from '../engine/sessionEngine';
import { isValidWord } from '../engine/wordList';
import { saveDailyGameState, loadDailyGameState } from '../storage/gameStorage';
import {
  StoredGameStats,
  INITIAL_GAME_STATS,
  loadGameStats,
  saveGameStats,
  recordGameCompletion,
} from '../storage/statsStorage';
import {
  AppSettings,
  DEFAULT_APP_SETTINGS,
  loadAppSettings,
  saveAppSettings,
  clearAllGameData,
} from '../storage/settingsStorage';
import {
  hapticKeyTap,
  hapticGuessSubmit,
  hapticInvalidWord,
  hapticVictory,
  hapticLoss,
  setHapticsEnabled,
} from '../utils/haptics';
import { formatShareText, shareGameResult, copyShareTextToClipboard } from '../utils/share';
import {
  reconcileDailyReminders,
  cancelDailyReminders,
  requestNotificationPermission,
} from '../utils/notifications';

export interface UseGameReturn {
  puzzleInfo: DailyPuzzleInfo;
  guesses: string[];
  evaluations: LetterEvaluation[][];
  currentGuess: string;
  gameStatus: GameStatus;
  keyboardStatus: Record<string, KeyStatus>;
  message: string | null;
  isPracticeMode: boolean;
  stats: StoredGameStats;
  isStatsVisible: boolean;
  currentWinAttempt?: number;
  openStats: () => void;
  closeStats: () => void;
  onKeyPress: (key: string) => void;
  startPracticeGame: () => void;
  switchToDailyMode: () => void;
  switchToPracticeMode: () => void;
  resetDailyGame: () => void;
  isRevealing: boolean;
  revealingRowIndex: number | null;
  winningRowIndex: number | null;
  shakeTrigger: number;
  showVictoryCelebration: boolean;
  dismissVictoryCelebration: () => void;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  resetAllData: () => Promise<void>;
  shareText: string;
  shareGame: () => Promise<boolean>;
  copyShareGrid: () => Promise<boolean>;
  isHydrated: boolean;
}

export function useGame(): UseGameReturn {
  const [session, dispatch] = useReducer(
    sessionReducer,
    undefined,
    () => createInitialDualSessionState(getDailyPuzzle())
  );

  const activeState = getActiveSessionState(session);

  const [stats, setStats] = useState<StoredGameStats>(INITIAL_GAME_STATS);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [isStatsVisible, setIsStatsVisible] = useState<boolean>(false);
  const [currentWinAttempt, setCurrentWinAttempt] = useState<number | undefined>(undefined);

  // Transient animation states (never persisted to storage)
  const [isRevealing, setIsRevealing] = useState<boolean>(false);
  const [revealingRowIndex, setRevealingRowIndex] = useState<number | null>(null);
  const [winningRowIndex, setWinningRowIndex] = useState<number | null>(null);
  const [shakeTrigger, setShakeTrigger] = useState<number>(0);
  const [showVictoryCelebration, setShowVictoryCelebration] = useState<boolean>(false);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tracks whether initial storage restoration has completed
  const isHydratedRef = useRef<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Clean up any pending animation timers on unmount
  useEffect(() => {
    return () => {
      if (revealTimerRef.current) {
        clearTimeout(revealTimerRef.current);
      }
    };
  }, []);

  // Restore daily state, career stats, and settings from storage on mount
  useEffect(() => {
    async function hydrate() {
      try {
        const [loadedStats, loadedSettings, savedDaily] = await Promise.all([
          loadGameStats(),
          loadAppSettings(),
          loadDailyGameState(),
        ]);

        setStats(loadedStats);
        setSettings(loadedSettings);
        setHapticsEnabled(loadedSettings.hapticsEnabled);

        const todayPuzzle = getDailyPuzzle();
        let isDailyDone = false;

        // Restore saved daily game if it matches today's UTC calendar date
        if (savedDaily && savedDaily.dateKey === todayPuzzle.dateKey) {
          dispatch({
            type: 'RESTORE_DAILY_GAME',
            puzzleInfo: {
              puzzleNumber: savedDaily.puzzleNumber,
              dateKey: savedDaily.dateKey,
              solution: savedDaily.solution,
            },
            guesses: savedDaily.guesses,
            evaluations: savedDaily.evaluations,
            currentGuess: savedDaily.currentGuess,
            gameStatus: savedDaily.gameStatus,
            keyboardStatus: savedDaily.keyboardStatus,
          });

          if (savedDaily.gameStatus === 'won') {
            setCurrentWinAttempt(savedDaily.guesses.length);
          }
          if (savedDaily.gameStatus !== 'playing') {
            isDailyDone = true;
          }
        }

        // Reconcile 4-hour daytime reminders on launch
        await reconcileDailyReminders({
          enabled: loadedSettings.dailyRemindersEnabled,
          isDailyCompleted: isDailyDone,
          todayDateKey: todayPuzzle.dateKey,
        });
      } finally {
        isHydratedRef.current = true;
        setIsHydrated(true);
      }
    }

    hydrate();
  }, []);

  // Reconcile reminders when app transitions between foreground and background
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isHydratedRef.current) {
        const todayPuzzle = getDailyPuzzle();
        reconcileDailyReminders({
          enabled: settings.dailyRemindersEnabled,
          isDailyCompleted: session.dailyState.gameStatus !== 'playing',
          todayDateKey: todayPuzzle.dateKey,
        });
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [settings.dailyRemindersEnabled, session.dailyState.gameStatus]);

  // Persist daily game state strictly to storage (never writes practice games)
  useEffect(() => {
    if (!isHydratedRef.current) return;
    saveDailyGameState(session.dailyState);
  }, [session.dailyState]);

  // Auto-dismiss transient notices while playing (e.g. "Not in word list")
  useEffect(() => {
    if (activeState.message && activeState.gameStatus === 'playing') {
      const timer = setTimeout(() => {
        dispatch({ type: 'CLEAR_MESSAGE' });
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [activeState.message, activeState.gameStatus]);

  // Formatted share text for the currently active state (Daily vs Practice)
  const shareText = useMemo(() => {
    return formatShareText({
      puzzleNumber: activeState.puzzleInfo.puzzleNumber,
      isPracticeMode: session.activeMode === 'practice',
      gameStatus: activeState.gameStatus,
      guessesCount: activeState.guesses.length,
      evaluations: activeState.evaluations,
    });
  }, [
    activeState.puzzleInfo.puzzleNumber,
    session.activeMode,
    activeState.gameStatus,
    activeState.guesses.length,
    activeState.evaluations,
  ]);

  const shareGame = useCallback(async () => {
    return await shareGameResult(shareText);
  }, [shareText]);

  const copyShareGrid = useCallback(async () => {
    return await copyShareTextToClipboard(shareText);
  }, [shareText]);

  const clearAnimationState = useCallback(() => {
    if (revealTimerRef.current) {
      clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
    setIsRevealing(false);
    setRevealingRowIndex(null);
    setWinningRowIndex(null);
    setShakeTrigger(0);
    setShowVictoryCelebration(false);
  }, []);

  const dismissVictoryCelebration = useCallback(() => {
    setShowVictoryCelebration(false);
  }, []);

  // Keyboard input handler operating strictly on the active session
  const onKeyPress = useCallback(
    (key: string) => {
      // 1. Lock submissions and typing during active flip reveal
      if (isRevealing) {
        return;
      }

      // 2. Prevent input if active puzzle is already completed
      if (activeState.gameStatus !== 'playing') {
        return;
      }

      const upperKey = key.toUpperCase();

      // 3. Handle Backspace
      if (upperKey === 'BACKSPACE' || upperKey === 'DELETE' || upperKey === '⌫') {
        if (activeState.currentGuess.length > 0) {
          hapticKeyTap();
        }
        dispatch({ type: 'KEY_PRESS', key });
        return;
      }

      // 4. Handle Enter (Submission)
      if (upperKey === 'ENTER') {
        if (activeState.guesses.length >= 6) {
          return;
        }

        // Reject short guess: shake active row and trigger warning haptic
        if (activeState.currentGuess.length < 5) {
          hapticInvalidWord();
          setShakeTrigger((prev) => prev + 1);
          dispatch({ type: 'KEY_PRESS', key });
          return;
        }

        // Reject invalid dictionary word: shake active row and trigger warning haptic
        if (!isValidWord(activeState.currentGuess)) {
          hapticInvalidWord();
          setShakeTrigger((prev) => prev + 1);
          dispatch({ type: 'KEY_PRESS', key });
          return;
        }

        // Valid submission flow:
        const submittingRowIndex = activeState.guesses.length;
        const isWinningGuess = activeState.currentGuess === activeState.puzzleInfo.solution;
        const isLosingGuess = activeState.guesses.length + 1 >= 6;

        // Record career statistics & cancel reminders ONLY for daily games
        if (session.activeMode === 'daily' && (isWinningGuess || isLosingGuess)) {
          // Immediately cancel any remaining 4-hour reminders for today's completed daily game
          cancelDailyReminders();

          if (stats.lastCompletedDateKey !== activeState.puzzleInfo.dateKey) {
            const attempts = submittingRowIndex + 1;
            const updatedStats = recordGameCompletion(
              stats,
              activeState.puzzleInfo.dateKey,
              isWinningGuess,
              attempts
            );
            setStats(updatedStats);
            saveGameStats(updatedStats);
            if (isWinningGuess) {
              setCurrentWinAttempt(attempts);
            }
          }
        }

        // Tactile impact haptic when submission starts
        hapticGuessSubmit();

        // Dispatch valid guess to active session
        dispatch({ type: 'KEY_PRESS', key });

        // Lock input and trigger sequential tile flip reveal
        setIsRevealing(true);
        setRevealingRowIndex(submittingRowIndex);

        if (revealTimerRef.current) {
          clearTimeout(revealTimerRef.current);
        }

        // Staggered flip duration for 5 tiles is ~740ms (4 * 120ms delay + 260ms flip)
        revealTimerRef.current = setTimeout(() => {
          setIsRevealing(false);
          setRevealingRowIndex(null);

          if (isWinningGuess) {
            setWinningRowIndex(submittingRowIndex);
            setShowVictoryCelebration(true);
            hapticVictory();
          } else if (isLosingGuess) {
            hapticLoss();
          }
        }, 780);

        // Open statistics modal automatically ONLY for daily games
        if (session.activeMode === 'daily' && (isWinningGuess || isLosingGuess)) {
          setTimeout(() => {
            setIsStatsVisible(true);
          }, 1600);
        }

        return;
      }

      // 5. Handle letter key A-Z
      if (/^[A-Z]$/.test(upperKey)) {
        if (activeState.currentGuess.length < 5) {
          hapticKeyTap();
        }
        dispatch({ type: 'KEY_PRESS', key });
      }
    },
    [
      isRevealing,
      activeState.gameStatus,
      activeState.currentGuess,
      activeState.guesses.length,
      activeState.puzzleInfo.dateKey,
      activeState.puzzleInfo.solution,
      session.activeMode,
      stats,
    ]
  );

  const updateSettings = useCallback(
    async (newSettings: Partial<AppSettings>) => {
      const merged = { ...settings, ...newSettings };

      // Handle daily reminders toggle and permission checking
      if (typeof newSettings.dailyRemindersEnabled === 'boolean') {
        if (newSettings.dailyRemindersEnabled) {
          const granted = await requestNotificationPermission();
          merged.dailyRemindersEnabled = granted;
          if (granted) {
            await reconcileDailyReminders({
              enabled: true,
              isDailyCompleted: session.dailyState.gameStatus !== 'playing',
              todayDateKey: session.dailyState.puzzleInfo.dateKey,
            });
          }
        } else {
          merged.dailyRemindersEnabled = false;
          await cancelDailyReminders();
        }
      }

      setSettings(merged);
      if (typeof merged.hapticsEnabled === 'boolean') {
        setHapticsEnabled(merged.hapticsEnabled);
      }
      await saveAppSettings(merged);
    },
    [settings, session.dailyState.gameStatus, session.dailyState.puzzleInfo.dateKey]
  );

  const resetAllData = useCallback(async () => {
    await clearAllGameData();
    await cancelDailyReminders();
    setStats(INITIAL_GAME_STATS);
    const dailyPuzzle = getDailyPuzzle();
    dispatch({ type: 'RESET_ALL_DATA', dailyPuzzleInfo: dailyPuzzle });
    setCurrentWinAttempt(undefined);
    clearAnimationState();
    reconcileDailyReminders({
      enabled: settings.dailyRemindersEnabled,
      isDailyCompleted: false,
      todayDateKey: dailyPuzzle.dateKey,
    });
  }, [clearAnimationState, settings.dailyRemindersEnabled]);

  const startPracticeGame = useCallback(() => {
    clearAnimationState();
    dispatch({ type: 'START_PRACTICE_GAME' });
  }, [clearAnimationState]);

  const switchToDailyMode = useCallback(() => {
    clearAnimationState();
    dispatch({ type: 'SWITCH_TO_DAILY' });
  }, [clearAnimationState]);

  const switchToPracticeMode = useCallback(() => {
    clearAnimationState();
    dispatch({ type: 'SWITCH_TO_PRACTICE' });
  }, [clearAnimationState]);

  const openStats = useCallback(() => {
    setIsStatsVisible(true);
  }, []);

  const closeStats = useCallback(() => {
    setIsStatsVisible(false);
  }, []);

  return {
    puzzleInfo: activeState.puzzleInfo,
    guesses: activeState.guesses,
    evaluations: activeState.evaluations,
    currentGuess: activeState.currentGuess,
    gameStatus: activeState.gameStatus,
    keyboardStatus: activeState.keyboardStatus,
    message: activeState.message,
    isPracticeMode: session.activeMode === 'practice',
    stats,
    isStatsVisible,
    currentWinAttempt,
    openStats,
    closeStats,
    onKeyPress,
    startPracticeGame,
    switchToDailyMode,
    switchToPracticeMode,
    resetDailyGame: switchToDailyMode, // Aliased for seamless compatibility
    isRevealing,
    revealingRowIndex,
    winningRowIndex,
    shakeTrigger,
    showVictoryCelebration,
    dismissVictoryCelebration,
    settings,
    updateSettings,
    resetAllData,
    shareText,
    shareGame,
    copyShareGrid,
    isHydrated,
  };
}
