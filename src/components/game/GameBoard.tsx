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
}

export const GameBoard: React.FC<GameBoardProps> = ({
  guesses,
  evaluations,
  currentGuess,
  maxGuesses = layout.maxGuesses,
  revealingRowIndex = null,
  winningRowIndex = null,
  shakeTrigger = 0,
}) => {
  const { width, height } = useWindowDimensions();

  // Constrain width to mobile bounds
  const horizontalSpace = Math.min(width - 32, layout.maxContentWidth - 48);
  const totalGaps = (layout.wordLength - 1) * layout.gridGap; // 4 * 6 = 24px
  const widthBasedSize = Math.floor((horizontalSpace - totalGaps) / layout.wordLength);

  // Vertical constraint: calibrated to viewport height (~44%)
  const availableVerticalHeight = height * 0.44;
  const heightBasedSize = Math.floor((availableVerticalHeight - (maxGuesses * layout.gridGap)) / maxGuesses);

  // Responsive tile size clamped cleanly between 40px and 58px
  const tileSize = Math.max(40, Math.min(widthBasedSize, heightBasedSize, 58));

  const rows = [];

  for (let rowIndex = 0; rowIndex < maxGuesses; rowIndex++) {
    if (rowIndex < guesses.length) {
      // Past submitted row
      rows.push(
        <GameRow
          key={rowIndex}
          word={guesses[rowIndex]}
          evaluations={evaluations[rowIndex]}
          tileSize={tileSize}
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
          tileSize={tileSize}
          shakeTrigger={shakeTrigger}
        />
      );
    } else {
      // Future empty row
      rows.push(
        <GameRow
          key={rowIndex}
          tileSize={tileSize}
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
    paddingVertical: 4,
  },
});
