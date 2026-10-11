import React from 'react';
import {
  Pressable,
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { colors, borderRadius, typography } from '../../constants/theme';
import { layout } from '../../constants/layout';

export type IconName = 'stats' | 'help' | 'settings' | 'close' | 'backspace';

export interface IconButtonProps {
  onPress: () => void;
  accessibilityLabel: string;
  name?: IconName;
  disabled?: boolean;
  size?: number; // Visual icon box size
  color?: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const IconButton: React.FC<IconButtonProps> = ({
  onPress,
  accessibilityLabel,
  name,
  disabled = false,
  size = 22,
  color = colors.textSecondary,
  children,
  style,
}) => {
  const renderIconContent = () => {
    if (children) {
      return children;
    }

    switch (name) {
      case 'stats':
        // Minimalist 3-bar histogram
        return (
          <View style={[styles.statsContainer, { width: size, height: size }]}>
            <View style={[styles.statsBar, { height: '50%', backgroundColor: color }]} />
            <View style={[styles.statsBar, { height: '100%', backgroundColor: color }]} />
            <View style={[styles.statsBar, { height: '75%', backgroundColor: color }]} />
          </View>
        );

      case 'help':
        // Crisp question glyph in a subtle circular container
        return (
          <View style={[styles.helpContainer, { width: size, height: size, borderColor: color }]}>
            <Text style={[styles.helpText, { color }]}>?</Text>
          </View>
        );

      case 'settings':
        // Clean dual-slider tracks with sliders
        return (
          <View style={[styles.settingsContainer, { width: size, height: size }]}>
            <View style={styles.settingsTrack}>
              <View style={[styles.settingsLine, { backgroundColor: color }]} />
              <View style={[styles.settingsThumb, { left: 4, backgroundColor: color }]} />
            </View>
            <View style={styles.settingsTrack}>
              <View style={[styles.settingsLine, { backgroundColor: color }]} />
              <View style={[styles.settingsThumb, { right: 4, backgroundColor: color }]} />
            </View>
          </View>
        );

      case 'close':
        // Minimal vector cross (✕)
        return (
          <View style={[styles.closeContainer, { width: size, height: size }]}>
            <View style={[styles.closeLine, styles.closeLine1, { backgroundColor: color }]} />
            <View style={[styles.closeLine, styles.closeLine2, { backgroundColor: color }]} />
          </View>
        );

      case 'backspace':
        // Left-facing arrow indicator
        return (
          <View style={[styles.backspaceContainer, { width: size, height: size }]}>
            <Text style={[styles.backspaceText, { color }]}>⌫</Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={({ pressed }) => [
        styles.touchTarget,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {renderIconContent()}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  touchTarget: {
    minWidth: layout.minTouchTarget,
    minHeight: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  pressed: {
    opacity: 0.6,
    backgroundColor: colors.surfaceSubtle,
  },
  disabled: {
    opacity: 0.35,
  },

  // Stats Icon
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  statsBar: {
    width: 3.5,
    borderRadius: borderRadius.xs,
  },

  // Help Icon
  helpContainer: {
    borderRadius: borderRadius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: {
    fontSize: 13,
    fontWeight: typography.fontWeights.bold,
    lineHeight: 15,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // Settings Icon
  settingsContainer: {
    justifyContent: 'space-evenly',
    paddingHorizontal: 1,
  },
  settingsTrack: {
    height: 6,
    justifyContent: 'center',
    position: 'relative',
  },
  settingsLine: {
    height: 1.5,
    width: '100%',
    borderRadius: 1,
  },
  settingsThumb: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },

  // Close Icon
  closeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  closeLine: {
    position: 'absolute',
    width: 16,
    height: 1.5,
    borderRadius: 1,
  },
  closeLine1: {
    transform: [{ rotate: '45deg' }],
  },
  closeLine2: {
    transform: [{ rotate: '-45deg' }],
  },

  // Backspace Icon
  backspaceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backspaceText: {
    fontSize: 16,
    fontWeight: typography.fontWeights.regular,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
