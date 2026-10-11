import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, Pressable, Platform, useWindowDimensions } from 'react-native';
import { KeyStatus } from '../../types/game';
import { KeyboardKey } from './KeyboardKey';
import { layout } from '../../constants/layout';
import { colors, borderRadius, typography } from '../../constants/theme';
import { hapticKeyTap } from '../../utils/haptics';

export interface GameKeyboardProps {
  onKeyPress: (key: string) => void;
  keyboardStatus: Record<string, KeyStatus>;
  keyHeight?: number;
  rowGap?: number;
  enterHeight?: number;
  enterGap?: number;
}

const ROW_1 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
const ROW_2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
const ROW_3 = ['Z', 'X', 'C', 'V', 'B', 'N', 'M'];

export const GameKeyboard: React.FC<GameKeyboardProps> = ({
  onKeyPress,
  keyboardStatus,
  keyHeight: customKeyHeight,
  rowGap: customRowGap,
  enterHeight: customEnterHeight,
  enterGap: customEnterGap,
}) => {
  const { height } = useWindowDimensions();
  const [isEnterHovered, setIsEnterHovered] = useState(false);
  const lastPressTimeRef = useRef<number>(0);
  const isWeb = Platform.OS === 'web';

  // Responsive geometry fallbacks
  const calculatedKeyHeight = Math.max(42, Math.min(Math.round(height * 0.056), 50));
  const effectiveKeyHeight = customKeyHeight ?? calculatedKeyHeight;
  const effectiveRowGap = customRowGap ?? layout.keyboardRowGap;
  const effectiveEnterHeight = customEnterHeight ?? Math.max(38, effectiveKeyHeight - 4);
  const effectiveEnterGap = customEnterGap ?? (effectiveRowGap + 2);

  const handleEnterPress = (e?: unknown) => {
    const now = Date.now();
    if (now - lastPressTimeRef.current < 60) {
      return;
    }
    lastPressTimeRef.current = now;

    if (isWeb && e && typeof e === 'object' && 'target' in e) {
      const target = (e as { target?: { blur?: () => void } }).target;
      target?.blur?.();
    }
    hapticKeyTap();
    onKeyPress('ENTER');
  };

  return (
    <View style={styles.keyboardContainer}>
      {/* Row 1 (10 keys, flex 1 each = 10 total) */}
      <View style={[styles.row, { marginBottom: effectiveRowGap }]}>
        {ROW_1.map((letter) => (
          <KeyboardKey
            key={letter}
            keyLabel={letter}
            status={keyboardStatus[letter]}
            height={effectiveKeyHeight}
            onPress={onKeyPress}
          />
        ))}
      </View>

      {/* Row 2 (0.5 spacer + 9 keys + 0.5 spacer = 10 total) */}
      <View style={[styles.row, { marginBottom: effectiveRowGap }]}>
        <View style={styles.spacerHalf} />
        {ROW_2.map((letter) => (
          <KeyboardKey
            key={letter}
            keyLabel={letter}
            status={keyboardStatus[letter]}
            height={effectiveKeyHeight}
            onPress={onKeyPress}
          />
        ))}
        <View style={styles.spacerHalf} />
      </View>

      {/* Row 3 (1.45 spacer + 7 keys + 1.45 Backspace = 9.9 total, NO ENTER in Row 3) */}
      <View style={[styles.row, styles.rowLast]}>
        <View style={styles.spacerAction} />
        {ROW_3.map((letter) => (
          <KeyboardKey
            key={letter}
            keyLabel={letter}
            status={keyboardStatus[letter]}
            height={effectiveKeyHeight}
            onPress={onKeyPress}
          />
        ))}
        <KeyboardKey
          keyLabel="BACKSPACE"
          displayLabel="⌫"
          actionKey={true}
          height={effectiveKeyHeight}
          onPress={onKeyPress}
        />
      </View>

      {/* Standalone wide, centered ENTER button beneath all three rows */}
      <View style={[styles.enterContainer, { marginTop: effectiveEnterGap }]}>
        <Pressable
          onPress={handleEnterPress}
          accessibilityRole="button"
          accessibilityLabel="Submit guess"
          hitSlop={isWeb ? undefined : { top: 6, bottom: 6, left: 10, right: 10 }}
          onHoverIn={isWeb ? () => setIsEnterHovered(true) : undefined}
          onHoverOut={isWeb ? () => setIsEnterHovered(false) : undefined}
          style={({ pressed }) => [
            styles.enterButton,
            isWeb && styles.webEnterBase,
            { height: effectiveEnterHeight },
            isWeb && isEnterHovered && styles.enterButtonHovered,
            pressed && (isWeb ? styles.enterButtonPressedWeb : styles.enterButtonPressedNative),
          ]}
        >
          <View style={styles.enterContentRow}>
            <View style={styles.enterAccentPip} />
            <Text style={styles.enterButtonText}>ENTER</Text>
          </View>
        </Pressable>
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
    width: '100%',
  },
  rowLast: {
    marginBottom: 0,
  },
  spacerHalf: {
    flex: 0.5,
  },
  spacerAction: {
    flex: layout.actionKeyFlex,
  },
  enterContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  enterButton: {
    width: '74%',
    maxWidth: 300,
    minWidth: 180,
    backgroundColor: '#261D17', // Warm dark espresso matching Lexora palette
    borderRadius: borderRadius.md + 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 122, 0, 0.40)', // Subtle, elegant orange accent border
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  webEnterBase: {
    cursor: 'pointer',
    userSelect: 'none',
  },
  enterButtonHovered: {
    backgroundColor: '#30241C',
    borderColor: 'rgba(255, 122, 0, 0.65)',
  },
  enterButtonPressedNative: {
    backgroundColor: colors.keyBackgroundPressed,
    borderColor: colors.primary,
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  enterButtonPressedWeb: {
    backgroundColor: colors.keyBackgroundPressed,
    borderColor: colors.primary,
    opacity: 0.90,
  },
  enterContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 8,
  },
  enterAccentPip: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary,
    opacity: 0.90,
  },
  enterButtonText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xs + 1,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 2.5,
    includeFontPadding: false,
  },
});
