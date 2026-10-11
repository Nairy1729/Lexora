/**
 * Lexora - Web Keyboard Input Utilities
 *
 * Normalizes and processes physical keyboard events on web browsers,
 * ensuring seamless typing with case-insensitivity, modifier key filtering,
 * modal awareness, and input isolation.
 */

/**
 * Normalizes keyboard event key values to Lexora game engine key symbols.
 * Returns 'ENTER', 'BACKSPACE', single uppercase letter 'A'-'Z', or null for unhandled keys.
 */
export function normalizeKeyboardKey(key: string): string | null {
  if (key === 'Enter') {
    return 'ENTER';
  }
  if (key === 'Backspace' || key === 'Delete') {
    return 'BACKSPACE';
  }
  if (/^[a-zA-Z]$/.test(key)) {
    return key.toUpperCase();
  }
  return null;
}

/**
 * Determines whether the event target is an active editable element (e.g. text input),
 * where game keyboard listeners should NOT intercept input.
 */
export function isEditableTarget(target: unknown): boolean {
  if (!target || typeof target !== 'object') {
    return false;
  }
  const el = target as { tagName?: string; isContentEditable?: boolean };
  const tagName = el.tagName?.toUpperCase();
  return tagName === 'INPUT' || tagName === 'TEXTAREA' || !!el.isContentEditable;
}

export interface WebKeyboardEventLike {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  target?: unknown;
  preventDefault?: () => void;
}

export interface ProcessWebKeyboardOptions {
  disabled?: boolean;
}

/**
 * Evaluates and dispatches a web keyboard event to the Lexora key press handler.
 * Returns true if the key was recognized and dispatched, false otherwise.
 */
export function processWebKeyboardEvent(
  event: WebKeyboardEventLike,
  onKeyPress: (key: string) => void,
  options: ProcessWebKeyboardOptions = {}
): boolean {
  if (options.disabled) {
    return false;
  }

  // Do not intercept keystrokes when typing inside text inputs
  if (isEditableTarget(event.target)) {
    return false;
  }

  // Filter out system shortcuts (e.g. Ctrl+R, Cmd+C, Alt+F4)
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return false;
  }

  const normalized = normalizeKeyboardKey(event.key);
  if (!normalized) {
    return false;
  }

  if (typeof event.preventDefault === 'function') {
    event.preventDefault();
  }

  // If activeElement is a button or interactive element, blur it so Enter doesn't trigger secondary click
  if (
    typeof document !== 'undefined' &&
    document.activeElement &&
    typeof (document.activeElement as HTMLElement).blur === 'function' &&
    !isEditableTarget(document.activeElement)
  ) {
    (document.activeElement as HTMLElement).blur();
  }

  onKeyPress(normalized);
  return true;
}
