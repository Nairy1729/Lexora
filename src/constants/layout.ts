/**
 * Lexora - Layout & Geometry Constants
 */

export const layout = {
  // Mobile content boundary
  maxContentWidth: 440,
  headerHeight: 50,
  footerHeight: 44,

  // Puzzle rules
  wordLength: 5,
  maxGuesses: 6,

  // Grid styling
  gridGap: 6,
  tileCornerRadius: 4,

  // Keyboard dimensions & geometry
  keyHeight: 48,
  keyboardRowGap: 6,
  keyboardKeyGap: 4,
  actionKeyFlex: 1.45,
  keyboardBottomBreathingRoom: 24,
  keyboardGridGap: 20,

  // Spacing & dividers
  contentPadding: 16,
  dividerThickness: 1,

  // Accessibility
  minTouchTarget: 44,
} as const;

export type Layout = typeof layout;

export interface GameplayLayoutMetrics {
  tileSize: number;
  tileGap: number;
  boardWidth: number;
  boardHeight: number;
  keyHeight: number;
  keyboardRowGap: number;
  keyboardHeight: number;
  enterButtonHeight: number;
  enterGap: number;
  topGap: number;
  middleGap: number;
  bottomGap: number;
}

function getPlatformOS(): string {
  try {
    // Dynamic import to prevent bundler transform issues in pure Node test environments
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const RN = require('react-native');
    return RN?.Platform?.OS || 'web';
  } catch {
    return 'node';
  }
}

/**
 * Calculates responsive, harmonious gameplay layout metrics for mobile viewports.
 * Rebalances space after placing the separate ENTER button beneath the three keyboard rows.
 */
export function calculateGameplayLayout(
  viewportWidth: number,
  viewportHeight: number,
  isGameOver = false,
  targetPlatform?: string
): GameplayLayoutMetrics {
  const platform = targetPlatform || getPlatformOS();
  const headerHeight = layout.headerHeight;
  const safeTop = platform === 'android' ? 24 : (platform === 'web' ? 0 : 20);
  const safeBottom = platform === 'android' ? 16 : (platform === 'web' ? 8 : 14);
  const availableHeight = Math.max(500, viewportHeight - headerHeight - safeTop - safeBottom);

  // 1. Keyboard sizing (3 letter rows + separate ENTER button below)
  let keyHeight: number;
  let keyboardRowGap: number;
  let enterButtonHeight: number;
  let enterGap: number;

  if (availableHeight < 540) {
    keyHeight = 40;
    keyboardRowGap = 4;
    enterButtonHeight = 36;
    enterGap = 5;
  } else if (availableHeight < 640) {
    keyHeight = 43;
    keyboardRowGap = 4;
    enterButtonHeight = 38;
    enterGap = 6;
  } else if (availableHeight < 760) {
    keyHeight = 46;
    keyboardRowGap = 5;
    enterButtonHeight = 40;
    enterGap = 7;
  } else if (availableHeight < 860) {
    keyHeight = 48;
    keyboardRowGap = 5;
    enterButtonHeight = 42;
    enterGap = 7;
  } else {
    keyHeight = 50;
    keyboardRowGap = 6;
    enterButtonHeight = 44;
    enterGap = 8;
  }

  const keyboardHeight = (keyHeight * 3) + (keyboardRowGap * 2) + enterGap + enterButtonHeight;

  // 2. Tile size
  const boardHorizontalSpace = Math.min(viewportWidth - 32, layout.maxContentWidth - 32);
  const tileGap = availableHeight < 540 ? 4 : (availableHeight < 640 ? 5 : layout.gridGap);
  const widthBasedTile = Math.floor((boardHorizontalSpace - (layout.wordLength - 1) * tileGap) / layout.wordLength);

  const targetRatio = isGameOver ? 0.35 : 0.47;
  const targetBoardHeight = availableHeight * targetRatio;
  const heightBasedTile = Math.floor((targetBoardHeight - (layout.maxGuesses - 1) * tileGap) / layout.maxGuesses);

  const maxTile = viewportWidth < 370 ? 50 : (viewportHeight >= 840 ? 58 : 54);
  const tileSize = Math.max(40, Math.min(widthBasedTile, heightBasedTile, maxTile));
  const boardWidth = (tileSize * layout.wordLength) + (tileGap * (layout.wordLength - 1));
  const boardHeight = (tileSize * layout.maxGuesses) + (tileGap * (layout.maxGuesses - 1));

  // 3. Spacing distribution
  const componentsHeight = boardHeight + keyboardHeight;
  const slack = Math.max(30, availableHeight - componentsHeight);

  let topGap: number;
  let middleGap: number;
  let bottomGap: number;

  if (isGameOver) {
    topGap = Math.max(10, Math.min(Math.round(slack * 0.16), 24));
    middleGap = Math.max(14, Math.min(Math.round(slack * 0.30), 36));
    bottomGap = Math.max(14, slack - topGap - middleGap);
  } else {
    topGap = Math.max(18, Math.min(Math.round(slack * 0.26), 56));
    middleGap = Math.max(26, Math.min(Math.round(slack * 0.42), 84));
    bottomGap = Math.max(20, slack - topGap - middleGap);
  }

  return {
    tileSize,
    tileGap,
    boardWidth,
    boardHeight,
    keyHeight,
    keyboardRowGap,
    keyboardHeight,
    enterButtonHeight,
    enterGap,
    topGap,
    middleGap,
    bottomGap,
  };
}
