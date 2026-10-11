import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
} from 'react-native';
import Animated, {
  FadeInUp,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography, controls } from '../../constants/theme';
import { layout } from '../../constants/layout';
import { GlassView } from '../common/GlassView';
import { GameStatus } from '../../types/game';
import { hapticKeyTap } from '../../utils/haptics';

export interface GameOverPanelProps {
  gameStatus: GameStatus;
  guessesCount: number;
  solution: string;
  isPracticeMode?: boolean;
  onShare: () => void;
  onOpenStats: () => void;
  onPractice: () => void;
  onDaily?: () => void;
}

/**
 * Premium glassmorphic Game Over result card.
 * Context-aware for Daily and Practice game modes with standardized design system buttons.
 */
export const GameOverPanel: React.FC<GameOverPanelProps> = ({
  gameStatus,
  guessesCount,
  solution,
  isPracticeMode = false,
  onShare,
  onOpenStats,
  onPractice,
  onDaily,
}) => {
  const isWon = gameStatus === 'won';
  const isHoleInOne = isWon && guessesCount === 1;

  const blurTarget = (e?: unknown) => {
    if (Platform.OS === 'web' && e && typeof e === 'object' && 'target' in e) {
      const target = (e as { target?: { blur?: () => void } }).target;
      target?.blur?.();
    }
  };

  const handleSharePress = (e?: unknown) => {
    blurTarget(e);
    hapticKeyTap();
    onShare();
  };

  const handleStatsPress = (e?: unknown) => {
    blurTarget(e);
    hapticKeyTap();
    onOpenStats();
  };

  const handlePracticePress = (e?: unknown) => {
    blurTarget(e);
    hapticKeyTap();
    onPractice();
  };

  const handleDailyPress = (e?: unknown) => {
    blurTarget(e);
    hapticKeyTap();
    if (onDaily) {
      onDaily();
    }
  };

  return (
    <Animated.View
      entering={FadeInUp.duration(320).springify().damping(18)}
      style={styles.wrapper}
    >
      <GlassView
        variant="elevated"
        intensity={60}
        style={styles.card}
      >
        {/* Status Header */}
        <View style={styles.headerContainer}>
          <View style={styles.badgeRow}>
            <View style={[styles.statusDot, isWon ? styles.statusDotWon : styles.statusDotLost]} />
            <Text style={styles.statusLabel}>
              {isPracticeMode
                ? isWon
                  ? 'PRACTICE SOLVED'
                  : 'PRACTICE OVER'
                : isWon
                  ? 'PUZZLE SOLVED'
                  : 'GAME OVER'}
            </Text>
          </View>

          <Text style={styles.resultHeadline}>
            {isWon
              ? isHoleInOne
                ? 'GENIUS • SOLVED IN 1/6'
                : `Solved in ${guessesCount} of ${layout.maxGuesses} attempts`
              : `The secret word was ${solution}`}
          </Text>
        </View>

        {/* Standardized Action Buttons Row */}
        <View style={styles.actionsRow}>
          {/* Primary Action: Share Result */}
          <Pressable
            onPress={handleSharePress}
            accessibilityRole="button"
            accessibilityLabel={
              isPracticeMode ? 'Share your practice result' : 'Share your puzzle result'
            }
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryButtonText} numberOfLines={1}>SHARE</Text>
          </Pressable>

          {isPracticeMode ? (
            <>
              {/* Practice Mode Action: Play Again */}
              <Pressable
                onPress={handlePracticePress}
                accessibilityRole="button"
                accessibilityLabel="Play another word in Practice Mode"
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.secondaryButtonText} numberOfLines={1}>PLAY AGAIN</Text>
              </Pressable>

              {/* Practice Mode Action: Return to Daily Puzzle */}
              <Pressable
                onPress={handleDailyPress}
                accessibilityRole="button"
                accessibilityLabel="Switch to Daily Puzzle"
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.secondaryButtonText} numberOfLines={1}>DAILY</Text>
              </Pressable>
            </>
          ) : (
            <>
              {/* Daily Mode Action: Career Statistics */}
              <Pressable
                onPress={handleStatsPress}
                accessibilityRole="button"
                accessibilityLabel="View your game statistics"
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.secondaryButtonText} numberOfLines={1}>STATS</Text>
              </Pressable>

              {/* Daily Mode Action: Practice Mode */}
              <Pressable
                onPress={handlePracticePress}
                accessibilityRole="button"
                accessibilityLabel="Play another word in Practice Mode"
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.secondaryButtonText} numberOfLines={1}>PRACTICE</Text>
              </Pressable>
            </>
          )}
        </View>
      </GlassView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    maxWidth: layout.maxContentWidth - 24,
    alignSelf: 'center',
    marginTop: spacing.xs + 2,
    marginBottom: 2,
  },
  card: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.xl,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
    marginBottom: 3,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotWon: {
    backgroundColor: colors.correct,
  },
  statusDotLost: {
    backgroundColor: colors.error,
  },
  statusLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: typography.letterSpacing.expanded,
    color: colors.primary,
    includeFontPadding: false,
  },
  resultHeadline: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semiBold,
    color: colors.textPrimary,
    letterSpacing: 0.2,
    includeFontPadding: false,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    columnGap: spacing.sm,
    justifyContent: 'center',
    width: '100%',
  },
  primaryButton: {
    flex: 1.1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.lg,
    minHeight: controls.buttonHeightMd,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
  },
  primaryButtonText: {
    color: colors.textInverse,
    fontSize: typography.fontSizes.xs + 1,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: typography.letterSpacing.wide,
    includeFontPadding: false,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.lg,
    minHeight: controls.buttonHeightMd,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorderHighlight,
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xs + 1,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: typography.letterSpacing.wide,
    includeFontPadding: false,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
});
