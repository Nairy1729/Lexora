import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  hapticKeyTap,
  hapticGuessSubmit,
  hapticInvalidWord,
  hapticVictory,
  hapticLoss,
  setHapticsEnabled,
  isHapticsEnabled,
  setHapticsAdapter,
  resetHapticsAdapter,
  HapticsAdapter,
  HapticStyle,
  HapticNotificationType,
} from '../../utils/haptics';
import { MOTION_TIMINGS } from '../../constants/motion';
import { MemoryStorage } from '../../storage/storageAdapter';
import { saveDailyGameState, loadDailyGameState } from '../../storage/gameStorage';
import { GameEngineState, gameReducer, createInitialGameState } from '../gameEngine';

describe('Haptics Utility & Safety Boundaries', () => {
  let impactCalls: HapticStyle[];
  let notificationCalls: HapticNotificationType[];

  const mockAdapter: HapticsAdapter = {
    async impactAsync(style: HapticStyle): Promise<void> {
      impactCalls.push(style);
    },
    async notificationAsync(type: HapticNotificationType): Promise<void> {
      notificationCalls.push(type);
    },
  };

  beforeEach(() => {
    impactCalls = [];
    notificationCalls = [];
    setHapticsEnabled(true);
    setHapticsAdapter(mockAdapter);
  });

  test('triggers light impact on key tap', async () => {
    await hapticKeyTap();
    assert.strictEqual(impactCalls.length, 1);
    assert.strictEqual(impactCalls[0], 'light');
    assert.strictEqual(notificationCalls.length, 0);
  });

  test('triggers medium impact on valid guess submission', async () => {
    await hapticGuessSubmit();
    assert.strictEqual(impactCalls.length, 1);
    assert.strictEqual(impactCalls[0], 'medium');
  });

  test('triggers warning notification on invalid word or incomplete guess', async () => {
    await hapticInvalidWord();
    assert.strictEqual(notificationCalls.length, 1);
    assert.strictEqual(notificationCalls[0], 'warning');
  });

  test('triggers success notification on victory', async () => {
    await hapticVictory();
    assert.strictEqual(notificationCalls.length, 1);
    assert.strictEqual(notificationCalls[0], 'success');
  });

  test('triggers error notification on loss', async () => {
    await hapticLoss();
    assert.strictEqual(notificationCalls.length, 1);
    assert.strictEqual(notificationCalls[0], 'error');
  });

  test('silently suppresses all haptic triggers when globally disabled', async () => {
    setHapticsEnabled(false);
    assert.strictEqual(isHapticsEnabled(), false);

    await hapticKeyTap();
    await hapticGuessSubmit();
    await hapticInvalidWord();
    await hapticVictory();
    await hapticLoss();

    assert.strictEqual(impactCalls.length, 0);
    assert.strictEqual(notificationCalls.length, 0);
  });

  test('default adapter never throws or rejects in non-native / Node test runner environment', async () => {
    resetHapticsAdapter();

    await assert.doesNotReject(async () => {
      await hapticKeyTap();
      await hapticGuessSubmit();
      await hapticInvalidWord();
      await hapticVictory();
      await hapticLoss();
    });
  });
});

describe('Animation Timings & Constraints', () => {
  test('motion timings adhere to responsive mobile UX boundaries', () => {
    // Tile pop is brief and snappy (80ms - 180ms)
    assert.ok(MOTION_TIMINGS.tilePopDuration >= 80 && MOTION_TIMINGS.tilePopDuration <= 180);
    assert.ok(MOTION_TIMINGS.tilePopScale > 1.0 && MOTION_TIMINGS.tilePopScale <= 1.25);

    // Flip reveal per tile is between 180ms and 350ms total
    const totalTileFlip = MOTION_TIMINGS.tileFlipHalfDuration * 2;
    assert.ok(totalTileFlip >= 180 && totalTileFlip <= 350);

    // Stagger delay produces a readable left-to-right cascade
    assert.ok(MOTION_TIMINGS.tileFlipStaggerDelay >= 80 && MOTION_TIMINGS.tileFlipStaggerDelay <= 200);

    // Full 5-tile reveal completes within 1000ms
    const fullRevealDuration = 4 * MOTION_TIMINGS.tileFlipStaggerDelay + totalTileFlip;
    assert.ok(fullRevealDuration >= 500 && fullRevealDuration <= 1000);

    // Row shake is fast and restrained
    assert.ok(MOTION_TIMINGS.rowShakeDuration >= 200 && MOTION_TIMINGS.rowShakeDuration <= 450);
    assert.ok(MOTION_TIMINGS.rowShakeAmplitude >= 4 && MOTION_TIMINGS.rowShakeAmplitude <= 12);

    // Win bounce is subtle
    assert.ok(MOTION_TIMINGS.winBounceDistance <= -8 && MOTION_TIMINGS.winBounceDistance >= -20);
  });
});

describe('Animation State Isolation & Storage Purity', () => {
  test('persisted game state never contains transient animation properties', async () => {
    const memory = new MemoryStorage();
    const puzzle = { puzzleNumber: 10, dateKey: '2026-10-10', solution: 'SHINE' };
    const engineState = createInitialGameState(puzzle, false);

    // Simulate state with guesses
    const stateWithGuess: GameEngineState = {
      ...engineState,
      guesses: ['PLANT'],
      evaluations: [['absent', 'absent', 'absent', 'correct', 'absent']],
      currentGuess: 'ST',
      gameStatus: 'playing',
      keyboardStatus: { P: 'absent', L: 'absent', A: 'absent', N: 'correct', T: 'absent' },
    };

    await saveDailyGameState(stateWithGuess, memory);
    const restored = await loadDailyGameState(memory);

    assert.notStrictEqual(restored, null);

    // Verify stored structure only contains pure game state
    const rawStored = JSON.parse((await memory.getItem('lexora_daily_state_v1')) || '{}');
    assert.strictEqual(rawStored.isRevealing, undefined);
    assert.strictEqual(rawStored.revealingRowIndex, undefined);
    assert.strictEqual(rawStored.winningRowIndex, undefined);
    assert.strictEqual(rawStored.shakeTrigger, undefined);
    assert.strictEqual(rawStored.showVictoryCelebration, undefined);
  });

  test('restoring an already completed won game never contains or triggers victory celebration', async () => {
    const memory = new MemoryStorage();
    const puzzle = { puzzleNumber: 88, dateKey: '2026-10-10', solution: 'SPARK' };
    const engineState = createInitialGameState(puzzle, false);

    const wonState: GameEngineState = {
      ...engineState,
      guesses: ['CRANE', 'SPARK'],
      evaluations: [
        ['absent', 'present', 'correct', 'absent', 'absent'],
        ['correct', 'correct', 'correct', 'correct', 'correct'],
      ],
      currentGuess: '',
      gameStatus: 'won',
      keyboardStatus: { S: 'correct', P: 'correct', A: 'correct', R: 'correct', K: 'correct' },
    };

    await saveDailyGameState(wonState, memory);
    const restored = await loadDailyGameState(memory);

    assert.notStrictEqual(restored, null);
    assert.strictEqual(restored?.gameStatus, 'won');
    assert.strictEqual(restored?.guesses.length, 2);
    // Transient celebration flags are strictly excluded from restored state
    assert.strictEqual((restored as Record<string, unknown>).showVictoryCelebration, undefined);
  });

  test('loss state produces loss outcome and never triggers victory celebration', () => {
    const puzzle = { puzzleNumber: 99, dateKey: '2026-10-10', solution: 'WOMEN' };
    let state = createInitialGameState(puzzle, false);

    const attempts = ['CRANE', 'GHOST', 'PLANT', 'BRICK', 'SHINE', 'DRAFT'];
    for (const word of attempts) {
      for (const char of word) {
        state = gameReducer(state, { type: 'KEY_PRESS', key: char });
      }
      state = gameReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });
    }

    assert.strictEqual(state.gameStatus, 'lost');
    assert.strictEqual(state.guesses.length, 6);
    assert.notStrictEqual(state.gameStatus, 'won');
  });

  test('pure game reducer functions without relying on animation lifecycle', () => {
    const puzzle = { puzzleNumber: 42, dateKey: '2026-10-10', solution: 'CLOUD' };
    let state = createInitialGameState(puzzle, false);

    state = gameReducer(state, { type: 'KEY_PRESS', key: 'C' });
    state = gameReducer(state, { type: 'KEY_PRESS', key: 'L' });
    state = gameReducer(state, { type: 'KEY_PRESS', key: 'O' });
    state = gameReducer(state, { type: 'KEY_PRESS', key: 'U' });
    state = gameReducer(state, { type: 'KEY_PRESS', key: 'D' });
    state = gameReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });

    assert.strictEqual(state.gameStatus, 'won');
    assert.strictEqual(state.guesses.length, 1);
    assert.strictEqual(state.currentGuess, '');
  });
});
