import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { LetterEvaluation } from '../../types/game';
import { GameRow } from './GameRow';
import { layout } from '../../constants/layout';

export interface GameBoardProps {
  guesses: string[];
  evaluations: LetterEvaluation[][];
  currentGuess: string;
  maxGuesses?: number;
  revealingRowIndex?: number | null;
  winningRowIndex?: number | null;
  shakeTrigger?: number;
  tileSize?: number;
  tileGap?: number;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  guesses,
  evaluations,
  currentGuess,
  maxGuesses = layout.maxGuesses,
  revealingRowIndex = null,
  winningRowIndex = null,
  shakeTrigger = 0,
  tileSize: customTileSize,
  tileGap: customTileGap,
}) => {
  const { width, height } = useWindowDimensions();

  const effectiveTileGap = customTileGap ?? layout.gridGap;

  // Constrain width to mobile bounds for fallback calculation
  const horizontalSpace = Math.min(width - 32, layout.maxContentWidth - 48);
  const totalGaps = (layout.wordLength - 1) * effectiveTileGap;
  const widthBasedSize = Math.floor((horizontalSpace - totalGaps) / layout.wordLength);

  // Vertical constraint fallback
  const availableVerticalHeight = height * 0.44;
  const heightBasedSize = Math.floor((availableVerticalHeight - (maxGuesses * effectiveTileGap)) / maxGuesses);

  // Responsive tile size fallback clamped cleanly between 40px and 58px
  const calculatedTileSize = Math.max(40, Math.min(widthBasedSize, heightBasedSize, 58));

  const effectiveTileSize = customTileSize ?? calculatedTileSize;

  const rows = [];

  for (let rowIndex = 0; rowIndex < maxGuesses; rowIndex++) {
    if (rowIndex < guesses.length) {
      // Past submitted row
      rows.push(
        <GameRow
          key={rowIndex}
          word={guesses[rowIndex]}
          evaluations={evaluations[rowIndex]}
          tileSize={effectiveTileSize}
          tileGap={effectiveTileGap}
          isRevealing={rowIndex === revealingRowIndex}
          isWinningRow={rowIndex === winningRowIndex}
        />
      );
    } else if (rowIndex === guesses.length) {
      // Active current row
      rows.push(
        <GameRow
          key={rowIndex}
          word={currentGuess}
          isCurrent={true}
          tileSize={effectiveTileSize}
          tileGap={effectiveTileGap}
          shakeTrigger={shakeTrigger}
        />
      );
    } else {
      // Future empty row
      rows.push(
        <GameRow
          key={rowIndex}
          tileSize={effectiveTileSize}
          tileGap={effectiveTileGap}
        />
      );
    }
  }

  return <View style={styles.boardContainer}>{rows}</View>;
};

const styles = StyleSheet.create({
  boardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
});
