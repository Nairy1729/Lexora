import React from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';
import { layout } from '../../constants/layout';
import { IconButton } from '../common/IconButton';

export interface GameHeaderProps {
  puzzleNumber: number;
  isPracticeMode: boolean;
  onPracticeToggle: () => void;
  onStatsToggle: () => void;
  onHelpToggle: () => void;
  onSettingsToggle: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  puzzleNumber,
  isPracticeMode,
  onPracticeToggle,
  onStatsToggle,
  onHelpToggle,
  onSettingsToggle,
}) => {
  const handlePracticeToggle = (e?: unknown) => {
    if (Platform.OS === 'web' && e && typeof e === 'object' && 'target' in e) {
      const target = (e as { target?: { blur?: () => void } }).target;
      target?.blur?.();
    }
    onPracticeToggle();
  };

  return (
    <View style={styles.headerWrapper}>
      <View style={styles.header}>
        {/* Left Action: Practice mode toggle or reset */}
        <View style={styles.leftContainer}>
          <Pressable
            onPress={handlePracticeToggle}
            accessibilityRole="button"
            accessibilityLabel={isPracticeMode ? 'Switch to Daily Puzzle' : 'Switch to Practice Mode'}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [styles.modeButton, pressed && styles.pressed]}
          >
            <Text style={styles.modeButtonText}>
              {isPracticeMode ? 'PRACTICE' : `#${puzzleNumber}`}
            </Text>
          </Pressable>
        </View>

        {/* Brand Wordmark */}
        <View style={styles.brandContainer}>
          <Text style={styles.brandTitle}>
            LEX<Text style={styles.brandAccent}>O</Text>RA
          </Text>
        </View>

        {/* Right Actions: Help, Statistics, and Settings */}
        <View style={styles.rightContainer}>
          <IconButton
            name="help"
            size={20}
            accessibilityLabel="How to Play"
            onPress={onHelpToggle}
          />
          <IconButton
            name="stats"
            size={20}
            accessibilityLabel="View Game Statistics"
            onPress={onStatsToggle}
          />
          <IconButton
            name="settings"
            size={20}
            accessibilityLabel="Game Settings"
            onPress={onSettingsToggle}
          />
        </View>
      </View>

      <View style={styles.divider} />
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    width: '100%',
    backgroundColor: colors.background,
  },
  header: {
    height: layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  leftContainer: {
    minWidth: 80,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  rightContainer: {
    minWidth: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    columnGap: 2,
  },
  brandContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.black,
    letterSpacing: typography.letterSpacing.brand,
    color: colors.textPrimary,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  brandAccent: {
    color: colors.primary,
  },
  divider: {
    height: layout.dividerThickness,
    backgroundColor: colors.glassBorderSubtle,
    width: '100%',
  },
  modeButton: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.glassCard,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
    letterSpacing: 0.8,
    includeFontPadding: false,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
});
