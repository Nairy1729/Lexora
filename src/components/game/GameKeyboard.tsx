import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { KeyStatus } from '../../types/game';
import { KeyboardKey } from './KeyboardKey';
import { layout } from '../../constants/layout';

export interface GameKeyboardProps {
  onKeyPress: (key: string) => void;
  keyboardStatus: Record<string, KeyStatus>;
}

const ROW_1 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
const ROW_2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
const ROW_3 = ['Z', 'X', 'C', 'V', 'B', 'N', 'M'];

export const GameKeyboard: React.FC<GameKeyboardProps> = ({
  onKeyPress,
  keyboardStatus,
}) => {
  const { height } = useWindowDimensions();

  // Responsive key height calibrated to viewport height (~44-52px)
  const keyHeight = Math.max(44, Math.min(Math.round(height * 0.058), 52));

  return (
    <View style={styles.keyboardContainer}>
      {/* Row 1 (10 keys, flex 1 each = 10 total) */}
      <View style={styles.row}>
        {ROW_1.map((letter) => (
          <KeyboardKey
            key={letter}
            keyLabel={letter}
            status={keyboardStatus[letter]}
            height={keyHeight}
            onPress={onKeyPress}
          />
        ))}
      </View>

      {/* Row 2 (0.5 spacer + 9 keys + 0.5 spacer = 10 total) */}
      <View style={styles.row}>
        <View style={styles.spacerHalf} />
        {ROW_2.map((letter) => (
          <KeyboardKey
            key={letter}
            keyLabel={letter}
            status={keyboardStatus[letter]}
            height={keyHeight}
            onPress={onKeyPress}
          />
        ))}
        <View style={styles.spacerHalf} />
      </View>

      {/* Row 3 (1.45 Enter + 7 keys + 1.45 Backspace = 9.9 total) */}
      <View style={[styles.row, styles.rowLast]}>
        <KeyboardKey
          keyLabel="ENTER"
          displayLabel="ENTER"
          actionKey={true}
          height={keyHeight}
          onPress={onKeyPress}
        />
        {ROW_3.map((letter) => (
          <KeyboardKey
            key={letter}
            keyLabel={letter}
            status={keyboardStatus[letter]}
            height={keyHeight}
            onPress={onKeyPress}
          />
        ))}
        <KeyboardKey
          keyLabel="BACKSPACE"
          displayLabel="⌫"
          actionKey={true}
          height={keyHeight}
          onPress={onKeyPress}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: layout.keyboardRowGap, // 6px gap between rows
    width: '100%',
  },
  rowLast: {
    marginBottom: 0,
  },
  spacerHalf: {
    flex: 0.5,
  },
});
