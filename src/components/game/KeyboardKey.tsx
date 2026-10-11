import React, { useState, useRef } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { KeyStatus } from '../../types/game';
import { colors, borderRadius, typography } from '../../constants/theme';
import { layout } from '../../constants/layout';

export interface KeyboardKeyProps {
  keyLabel: string;
  displayLabel?: string;
  actionKey?: boolean;
  status?: KeyStatus;
  height?: number;
  onPress: (key: string) => void;
  style?: StyleProp<ViewStyle>;
}

export const KeyboardKey: React.FC<KeyboardKeyProps> = ({
  keyLabel,
  displayLabel,
  actionKey = false,
  status = 'unused',
  height = layout.keyHeight,
  onPress,
  style,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const isWeb = Platform.OS === 'web';

  const isBackspace = keyLabel === 'BACKSPACE' || keyLabel === '⌫';

  const getStatusStyle = () => {
    switch (status) {
      case 'correct':
        return styles.keyCorrect;
      case 'present':
        return styles.keyPresent;
      case 'absent':
        return styles.keyAbsent;
      case 'unused':
      default:
        return actionKey ? styles.actionKeyUnused : styles.keyUnused;
    }
  };

  const getAccessibilityLabel = () => {
    if (keyLabel === 'ENTER') return 'Submit guess';
    if (isBackspace) return 'Delete letter';
    return `Letter ${keyLabel}${status !== 'unused' ? `, ${status}` : ''}`;
  };

  const lastPressTimeRef = useRef<number>(0);

  const handlePress = (e?: unknown) => {
    const now = Date.now();
    if (now - lastPressTimeRef.current < 60) {
      return;
    }
    lastPressTimeRef.current = now;

    if (isWeb && e && typeof e === 'object' && 'target' in e) {
      const target = (e as { target?: { blur?: () => void } }).target;
      target?.blur?.();
    }
    onPress(keyLabel);
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={getAccessibilityLabel()}
      // Only attach hitSlop on native mobile touchscreens.
      // On web desktop, hitSlop creates overlapping pseudo-elements that interfere with adjacent click targets.
      hitSlop={isWeb ? undefined : { top: 4, bottom: 4, left: 1, right: 1 }}
      onHoverIn={isWeb ? () => setIsHovered(true) : undefined}
      onHoverOut={isWeb ? () => setIsHovered(false) : undefined}
      style={({ pressed }) => [
        styles.keyBase,
        isWeb && styles.webKeyBase,
        { height },
        actionKey ? styles.actionKey : styles.letterKey,
        getStatusStyle(),
        isWeb && isHovered && status === 'unused' && (actionKey ? styles.actionKeyHovered : styles.keyHovered),
        pressed && (isWeb ? styles.pressedWeb : styles.pressedNative),
        style,
      ]}
    >
      <Text
        style={[
          styles.keyText,
          actionKey && styles.actionKeyText,
          isBackspace && styles.backspaceIconText,
          status === 'absent' && styles.absentText,
          (status === 'correct' || status === 'present') && styles.evaluatedText,
        ]}
        numberOfLines={1}
      >
        {displayLabel || keyLabel}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  keyBase: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md, // 6px smooth rounded keycaps
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: colors.keyBorder, // #45372E
    overflow: 'hidden',
  },
  webKeyBase: {
    // Web cursor and selection properties
    cursor: 'pointer',
    userSelect: 'none',
  },
  letterKey: {
    flex: 1,
  },
  actionKey: {
    flex: layout.actionKeyFlex, // 1.45
  },

  // Press states:
  // On mobile native: subtle tactile depression with controlled warm border glow.
  pressedNative: {
    opacity: 0.84,
    transform: [{ scale: 0.96 }],
    backgroundColor: colors.keyBackgroundPressed,
    borderColor: 'rgba(255, 122, 0, 0.40)',
  },
  // On web: avoid scaling down, which shrinks element out from under mouse cursor.
  pressedWeb: {
    opacity: 0.86,
    backgroundColor: colors.keyBackgroundPressed,
    borderColor: 'rgba(255, 122, 0, 0.40)',
  },

  // Hover states on web:
  keyHovered: {
    backgroundColor: colors.keyBackgroundHovered, // #31271F
    borderColor: 'rgba(255, 248, 240, 0.20)',
  },
  actionKeyHovered: {
    backgroundColor: '#3A2E24',
    borderColor: 'rgba(255, 122, 0, 0.35)',
  },

  // Key typography: clear, medium-weight uppercase letters with excellent readability
  keyText: {
    fontSize: typography.fontSizes.sm + 1, // ~14px
    fontWeight: typography.fontWeights.semiBold, // '600'
    color: colors.keyText, // #FFF8F0
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    userSelect: 'none',
  },
  actionKeyText: {
    fontSize: typography.fontSizes.xs + 0.5, // 11.5px
    fontWeight: typography.fontWeights.semiBold, // '600'
    letterSpacing: 0.6,
    color: colors.keyText,
    includeFontPadding: false,
    textAlignVertical: 'center',
    userSelect: 'none',
  },
  backspaceIconText: {
    fontSize: 17,
    fontWeight: typography.fontWeights.regular,
    color: colors.keyText,
    includeFontPadding: false,
    textAlignVertical: 'center',
    userSelect: 'none',
  },
  absentText: {
    color: colors.keyTextSecondary, // #B8AAA0
  },
  evaluatedText: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.semiBold,
  },

  // State colors: warm dark surfaces, restrained depth, zero harsh neon
  keyUnused: {
    backgroundColor: colors.keyBackground, // #292019
    borderColor: colors.keyBorder, // #45372E
  },
  actionKeyUnused: {
    backgroundColor: colors.keyBackgroundElevated, // #332820
    borderColor: colors.keyBorderElevated, // #4D3E33
  },
  keyCorrect: {
    backgroundColor: colors.correct, // #538D4E
    borderColor: '#5B9A56',
  },
  keyPresent: {
    backgroundColor: colors.present, // #B59F3B
    borderColor: '#C0AA3F',
  },
  keyAbsent: {
    backgroundColor: colors.absent, // #49413B
    borderColor: '#3D3631',
    opacity: 0.70,
  },
});
