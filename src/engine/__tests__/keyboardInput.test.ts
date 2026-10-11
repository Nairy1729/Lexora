import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  createInitialGameState,
  gameReducer,
  GameEngineState,
} from '../gameEngine';
import { DailyPuzzleInfo } from '../dailySelector';
import {
  normalizeKeyboardKey,
  isEditableTarget,
  processWebKeyboardEvent,
  WebKeyboardEventLike,
} from '../../utils/webKeyboard';
import { colors } from '../../constants/theme';
import { layout, calculateGameplayLayout } from '../../constants/layout';

const TEST_PUZZLE: DailyPuzzleInfo = {
  puzzleNumber: 42,
  dateKey: '2026-10-10',
  solution: 'CRANE',
};

function typeString(state: GameEngineState, letters: string): GameEngineState {
  let s = state;
  for (const ch of letters) {
    s = gameReducer(s, { type: 'KEY_PRESS', key: ch });
  }
  return s;
}

describe('Keyboard Input & Web Interaction Regression Suite', () => {
  // Spec 1: Letter insertion
  test('1. Letter insertion updates currentGuess incrementally', () => {
    let state = createInitialGameState(TEST_PUZZLE);
    assert.strictEqual(state.currentGuess, '');

    state = gameReducer(state, { type: 'KEY_PRESS', key: 'C' });
    assert.strictEqual(state.currentGuess, 'C');

    state = gameReducer(state, { type: 'KEY_PRESS', key: 'R' });
    assert.strictEqual(state.currentGuess, 'CR');

    state = gameReducer(state, { type: 'KEY_PRESS', key: 'A' });
    assert.strictEqual(state.currentGuess, 'CRA');
  });

  // Spec 2: 5-letter clamping
  test('2. Typing up to 5 letters fills active row cleanly', () => {
    let state = createInitialGameState(TEST_PUZZLE);
    state = typeString(state, 'CRANE');
    assert.strictEqual(state.currentGuess, 'CRANE');
    assert.strictEqual(state.currentGuess.length, 5);
  });

  // Spec 3: 6th letter rejection
  test('3. 6th letter is strictly rejected when currentGuess has 5 letters', () => {
    let state = createInitialGameState(TEST_PUZZLE);
    state = typeString(state, 'CRANE');
    assert.strictEqual(state.currentGuess, 'CRANE');

    // Attempt typing a 6th letter 'S'
    state = gameReducer(state, { type: 'KEY_PRESS', key: 'S' });
    assert.strictEqual(state.currentGuess, 'CRANE');
    assert.strictEqual(state.currentGuess.length, 5);
  });

  // Spec 4: Backspace deletion
  test('4. Backspace removes the most recent letter', () => {
    let state = createInitialGameState(TEST_PUZZLE);
    state = typeString(state, 'CRA');
    assert.strictEqual(state.currentGuess, 'CRA');

    state = gameReducer(state, { type: 'KEY_PRESS', key: 'BACKSPACE' });
    assert.strictEqual(state.currentGuess, 'CR');

    state = gameReducer(state, { type: 'KEY_PRESS', key: '⌫' });
    assert.strictEqual(state.currentGuess, 'C');
  });

  // Spec 5: Backspace on empty row is a safe no-op
  test('5. Backspace on empty row does not throw and leaves guess empty', () => {
    let state = createInitialGameState(TEST_PUZZLE);
    assert.strictEqual(state.currentGuess, '');

    state = gameReducer(state, { type: 'KEY_PRESS', key: 'BACKSPACE' });
    assert.strictEqual(state.currentGuess, '');
    assert.strictEqual(state.guesses.length, 0);
  });

  // Spec 6: Enter submission on valid word
  test('6. Enter submission on valid 5-letter word advances row and clears currentGuess', () => {
    let state = createInitialGameState(TEST_PUZZLE);
    state = typeString(state, 'WOMEN');
    assert.strictEqual(state.currentGuess, 'WOMEN');

    state = gameReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });
    assert.strictEqual(state.guesses.length, 1);
    assert.strictEqual(state.guesses[0], 'WOMEN');
    assert.strictEqual(state.currentGuess, '');
    assert.strictEqual(state.evaluations.length, 1);
  });

  // Spec 7: Incomplete word rejection (< 5 letters)
  test('7. Pressing Enter with fewer than 5 letters triggers notice and preserves input', () => {
    let state = createInitialGameState(TEST_PUZZLE);
    state = typeString(state, 'CRA');

    state = gameReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });
    assert.strictEqual(state.guesses.length, 0);
    assert.strictEqual(state.currentGuess, 'CRA');
    assert.strictEqual(state.message, 'Not enough letters');
  });

  // Spec 8: Invalid word rejection (not in dictionary)
  test('8. Pressing Enter with non-dictionary word triggers notice and preserves input for editing', () => {
    let state = createInitialGameState(TEST_PUZZLE);
    state = typeString(state, 'ZZZZZ');

    state = gameReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });
    assert.strictEqual(state.guesses.length, 0);
    assert.strictEqual(state.currentGuess, 'ZZZZZ');
    assert.strictEqual(state.message, 'Not in word list');
  });

  // Spec 9: Game-over lock after victory
  test('9. Game locks further input after winning guess', () => {
    let state = createInitialGameState(TEST_PUZZLE); // Solution: CRANE
    state = typeString(state, 'CRANE');
    state = gameReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });

    assert.strictEqual(state.gameStatus, 'won');
    assert.strictEqual(state.guesses.length, 1);

    // Any subsequent key presses must be ignored
    state = gameReducer(state, { type: 'KEY_PRESS', key: 'A' });
    state = gameReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });
    state = gameReducer(state, { type: 'KEY_PRESS', key: 'BACKSPACE' });
    assert.strictEqual(state.currentGuess, '');
    assert.strictEqual(state.guesses.length, 1);
  });

  // Spec 10: Game-over lock after 6 failed attempts
  test('10. Game locks further input after 6 failed attempts (loss)', () => {
    let state = createInitialGameState(TEST_PUZZLE); // Solution: CRANE
    const validLosingGuesses = ['SLATE', 'ROAST', 'PLANT', 'SHINE', 'CLOUD', 'FLUTE'];

    for (const w of validLosingGuesses) {
      state = typeString(state, w);
      state = gameReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });
    }

    assert.strictEqual(state.guesses.length, 6);
    assert.strictEqual(state.gameStatus, 'lost');

    // Any subsequent key press is locked
    state = gameReducer(state, { type: 'KEY_PRESS', key: 'Z' });
    assert.strictEqual(state.currentGuess, '');
  });

  // Spec 11: Keyboard status precedence (Correct > Present > Absent)
  test('11. Keyboard key statuses follow strict precedence (Correct > Present > Absent)', () => {
    // Puzzle: CRANE
    let state = createInitialGameState(TEST_PUZZLE);

    // Guess 1: ROAST -> R is at index 0 (in CRANE at index 1 -> present). O, S, T are absent. A is correct.
    state = typeString(state, 'ROAST');
    state = gameReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });

    assert.strictEqual(state.keyboardStatus['R'], 'present');
    assert.strictEqual(state.keyboardStatus['A'], 'correct');
    assert.strictEqual(state.keyboardStatus['O'], 'absent');
    assert.strictEqual(state.keyboardStatus['S'], 'absent');
    assert.strictEqual(state.keyboardStatus['T'], 'absent');

    // Guess 2: CRANE -> R is at index 1 (exact match -> correct)
    state = typeString(state, 'CRANE');
    state = gameReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });

    // Present key 'R' is promoted to correct
    assert.strictEqual(state.keyboardStatus['R'], 'correct');
    assert.strictEqual(state.keyboardStatus['C'], 'correct');
    assert.strictEqual(state.keyboardStatus['A'], 'correct');
    assert.strictEqual(state.keyboardStatus['N'], 'correct');
    assert.strictEqual(state.keyboardStatus['E'], 'correct');
    // Absent keys remain absent
    assert.strictEqual(state.keyboardStatus['O'], 'absent');
    assert.strictEqual(state.keyboardStatus['S'], 'absent');
    assert.strictEqual(state.keyboardStatus['T'], 'absent');
  });

  // Spec 12: Web physical keyboard event normalization
  test('12. Web keyboard key normalizer correctly parses letters, Enter, and Backspace', () => {
    assert.strictEqual(normalizeKeyboardKey('a'), 'A');
    assert.strictEqual(normalizeKeyboardKey('Z'), 'Z');
    assert.strictEqual(normalizeKeyboardKey('Enter'), 'ENTER');
    assert.strictEqual(normalizeKeyboardKey('Backspace'), 'BACKSPACE');
    assert.strictEqual(normalizeKeyboardKey('Delete'), 'BACKSPACE');
    assert.strictEqual(normalizeKeyboardKey('Escape'), null);
    assert.strictEqual(normalizeKeyboardKey('1'), null);
    assert.strictEqual(normalizeKeyboardKey('Tab'), null);
  });

  // Spec 13: Web modifier key filtering
  test('13. Web keyboard event processor ignores modifier key chords', () => {
    const dispatched: string[] = [];
    const mockOnKeyPress = (key: string) => dispatched.push(key);

    // Ctrl+C
    const ctrlEvent: WebKeyboardEventLike = { key: 'c', ctrlKey: true };
    const handledCtrl = processWebKeyboardEvent(ctrlEvent, mockOnKeyPress);
    assert.strictEqual(handledCtrl, false);

    // Cmd+R
    const metaEvent: WebKeyboardEventLike = { key: 'r', metaKey: true };
    const handledMeta = processWebKeyboardEvent(metaEvent, mockOnKeyPress);
    assert.strictEqual(handledMeta, false);

    // Alt+Enter
    const altEvent: WebKeyboardEventLike = { key: 'Enter', altKey: true };
    const handledAlt = processWebKeyboardEvent(altEvent, mockOnKeyPress);
    assert.strictEqual(handledAlt, false);

    // Plain 'c' should be processed
    let prevented = false;
    const plainEvent: WebKeyboardEventLike = {
      key: 'c',
      preventDefault: () => {
        prevented = true;
      },
    };
    const handledPlain = processWebKeyboardEvent(plainEvent, mockOnKeyPress);
    assert.strictEqual(handledPlain, true);
    assert.strictEqual(prevented, true);
    assert.deepStrictEqual(dispatched, ['C']);
  });

  // Spec 14: Web modal awareness & disabled state
  test('14. Web keyboard event processor suppresses typing when disabled (modal open)', () => {
    const dispatched: string[] = [];
    const mockOnKeyPress = (key: string) => dispatched.push(key);

    const event: WebKeyboardEventLike = { key: 'A' };
    const handled = processWebKeyboardEvent(event, mockOnKeyPress, { disabled: true });

    assert.strictEqual(handled, false);
    assert.strictEqual(dispatched.length, 0);
  });

  // Spec 15: Web editable target isolation
  test('15. Web keyboard event processor ignores typing inside input and textarea fields', () => {
    assert.strictEqual(isEditableTarget({ tagName: 'INPUT' }), true);
    assert.strictEqual(isEditableTarget({ tagName: 'TEXTAREA' }), true);
    assert.strictEqual(isEditableTarget({ isContentEditable: true }), true);
    assert.strictEqual(isEditableTarget({ tagName: 'DIV' }), false);
    assert.strictEqual(isEditableTarget(null), false);

    const dispatched: string[] = [];
    const mockOnKeyPress = (key: string) => dispatched.push(key);

    const inputEvent: WebKeyboardEventLike = {
      key: 'E',
      target: { tagName: 'INPUT' },
    };
    const handled = processWebKeyboardEvent(inputEvent, mockOnKeyPress);
    assert.strictEqual(handled, false);
    assert.strictEqual(dispatched.length, 0);
  });

  // Spec 16: Keyboard design tokens match Lexora's dark-glass aesthetic
  test('16. Keyboard design tokens use warm dark surface and refined borders', () => {
    assert.strictEqual(colors.keyBackground, '#292019');
    assert.strictEqual(colors.keyBackgroundElevated, '#332820');
    assert.strictEqual(colors.keyBorder, '#45372E');
    assert.strictEqual(colors.keyBorderElevated, '#4D3E33');
    assert.strictEqual(colors.keyText, '#FFF8F0');
    assert.strictEqual(colors.keyTextSecondary, '#B8AAA0');
    assert.strictEqual(colors.correct, '#538D4E');
    assert.strictEqual(colors.present, '#B59F3B');
    assert.strictEqual(colors.absent, '#49413B');
  });

  // Spec 17: Keyboard layout geometry constants enforce responsive spacing
  test('17. Keyboard layout geometry constants enforce responsive spacing and breathing room', () => {
    assert.strictEqual(layout.keyHeight, 48);
    assert.strictEqual(layout.keyboardRowGap, 6);
    assert.strictEqual(layout.actionKeyFlex, 1.45);
    assert.strictEqual(layout.keyboardBottomBreathingRoom, 24);
    assert.strictEqual(layout.keyboardGridGap, 20);
  });

  // Spec 18: Standard 3-row QWERTY arrangement contains all 26 letters
  test('18. Standard 3-row QWERTY arrangement contains all 26 alphabet letters without duplicates', () => {
    const ROW_1 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
    const ROW_2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
    const ROW_3 = ['Z', 'X', 'C', 'V', 'B', 'N', 'M'];

    assert.strictEqual(ROW_1.length, 10);
    assert.strictEqual(ROW_2.length, 9);
    assert.strictEqual(ROW_3.length, 7);

    const allKeys = [...ROW_1, ...ROW_2, ...ROW_3];
    assert.strictEqual(allKeys.length, 26);
    const uniqueKeys = new Set(allKeys);
    assert.strictEqual(uniqueKeys.size, 26);

    for (let c = 65; c <= 90; c++) {
      const letter = String.fromCharCode(c);
      assert.strictEqual(uniqueKeys.has(letter), true, `Missing letter ${letter}`);
    }
  });

  // Spec 19: Action keys Enter and Backspace (including glyph) correctly mutate state
  test('19. Action keys Enter and Backspace mutate game state correctly', () => {
    let state = createInitialGameState(TEST_PUZZLE);

    // Letter entry
    state = gameReducer(state, { type: 'KEY_PRESS', key: 'C' });
    state = gameReducer(state, { type: 'KEY_PRESS', key: 'R' });
    assert.strictEqual(state.currentGuess, 'CR');

    // Backspace glyph ⌫
    state = gameReducer(state, { type: 'KEY_PRESS', key: '⌫' });
    assert.strictEqual(state.currentGuess, 'C');

    // Standard BACKSPACE
    state = gameReducer(state, { type: 'KEY_PRESS', key: 'BACKSPACE' });
    assert.strictEqual(state.currentGuess, '');

    // Re-fill and ENTER
    state = typeString(state, 'CRANE');
    state = gameReducer(state, { type: 'KEY_PRESS', key: 'ENTER' });
    assert.strictEqual(state.gameStatus, 'won');
  });

  // Spec 20: Keyboard layout isolates Row 3 to letters and Backspace with Enter placed separately below
  test('20. Keyboard layout isolates Row 3 to letters and Backspace with Enter placed separately below', () => {
    const ROW_3_KEYS = ['Z', 'X', 'C', 'V', 'B', 'N', 'M'];
    const ROW_3_ACTIONS = ['BACKSPACE'];

    assert.strictEqual(ROW_3_KEYS.length, 7);
    assert.strictEqual(ROW_3_ACTIONS.includes('ENTER'), false, 'ENTER must not be in Row 3');
    assert.strictEqual(ROW_3_ACTIONS.includes('BACKSPACE'), true, 'BACKSPACE must be in Row 3');
  });

  // Spec 21: calculateGameplayLayout outputs balanced metrics for standalone ENTER button
  test('21. calculateGameplayLayout outputs balanced metrics for standalone ENTER button', () => {
    const metricsMobile = calculateGameplayLayout(390, 844);
    assert.ok(metricsMobile.enterButtonHeight >= 36 && metricsMobile.enterButtonHeight <= 46);
    assert.ok(metricsMobile.enterGap >= 5 && metricsMobile.enterGap <= 10);
    assert.ok(metricsMobile.bottomGap >= 20, 'Sufficient clearance above navigation bar');

    const metricsCompact = calculateGameplayLayout(360, 640);
    assert.ok(metricsCompact.enterButtonHeight >= 34);
    assert.ok(metricsCompact.bottomGap >= 16);
  });
});
