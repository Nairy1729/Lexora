import React from 'react';
import { StyleSheet, View, Text, Pressable, Platform, useWindowDimensions } from 'react-native';
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
  const { width } = useWindowDimensions();
  const isCompact = width < 380;

  const handlePracticeToggle = (e?: unknown) => {
    if (Platform.OS === 'web' && e && typeof e === 'object' && 'target' in e) {
      const target = (e as { target?: { blur?: () => void } }).target;
      target?.blur?.();
    }
    onPracticeToggle();
  };

  const iconSize = isCompact ? 17 : 19;
  const iconButtonStyle = isCompact
    ? { minWidth: 34, minHeight: 34 }
    : undefined;

  return (
    <View style={styles.headerWrapper}>
      <View style={[styles.header, isCompact && styles.headerCompact]}>
        {/* Optically and mathematically centered brand wordmark across entire width */}
        <View style={styles.brandContainer} pointerEvents="none">
          <Text
            style={[
              styles.brandTitle,
              isCompact && styles.brandTitleCompact,
            ]}
            accessibilityRole="header"
          >
            LEX<Text style={styles.brandAccent}>O</Text>RA
          </Text>
        </View>

        {/* Left Action: Practice mode toggle or daily puzzle badge */}
        <View style={[styles.leftContainer, isCompact && styles.leftContainerCompact]}>
          <Pressable
            onPress={handlePracticeToggle}
            accessibilityRole="button"
            accessibilityLabel={isPracticeMode ? 'Switch to Daily Puzzle' : 'Switch to Practice Mode'}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [
              styles.modeButton,
              isPracticeMode && styles.modeButtonPractice,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.modeButtonText, isPracticeMode && styles.modeButtonTextPractice]}>
              {isPracticeMode ? 'PRACTICE' : `#${puzzleNumber}`}
            </Text>
          </Pressable>
        </View>

        {/* Right Actions: Help, Statistics, and Settings */}
        <View style={[styles.rightContainer, isCompact && styles.rightContainerCompact]}>
          <IconButton
            name="help"
            size={iconSize}
            style={iconButtonStyle}
            accessibilityLabel="How to Play"
            onPress={onHelpToggle}
          />
          <IconButton
            name="stats"
            size={iconSize}
            style={iconButtonStyle}
            accessibilityLabel="View Game Statistics"
            onPress={onStatsToggle}
          />
          <IconButton
            name="settings"
            size={iconSize}
            style={iconButtonStyle}
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
    position: 'relative',
  },
  headerCompact: {
    paddingHorizontal: spacing.sm,
  },
  brandContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  brandTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.black,
    letterSpacing: typography.letterSpacing.brand,
    color: colors.textPrimary,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  brandTitleCompact: {
    fontSize: typography.fontSizes.lg + 1,
    letterSpacing: 2.5,
  },
  brandAccent: {
    color: colors.primary,
  },
  leftContainer: {
    minWidth: 76,
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 1,
  },
  leftContainerCompact: {
    minWidth: 56,
  },
  rightContainer: {
    minWidth: 96,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    columnGap: 2,
    zIndex: 1,
  },
  rightContainerCompact: {
    minWidth: 76,
    columnGap: 1,
  },
  divider: {
    height: layout.dividerThickness,
    backgroundColor: colors.borderSubtle,
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
  modeButtonPractice: {
    backgroundColor: colors.primarySubtle,
    borderColor: colors.primaryBorderGlow,
  },
  modeButtonText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
    letterSpacing: 0.8,
    includeFontPadding: false,
  },
  modeButtonTextPractice: {
    color: colors.primary,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }],
  },
});
