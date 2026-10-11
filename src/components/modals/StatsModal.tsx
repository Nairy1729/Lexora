import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
} from 'react-native';
import { StoredGameStats } from '../../storage/statsStorage';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { layout } from '../../constants/layout';
import { getMsUntilNextUtcMidnight, formatTimeRemaining } from '../../utils/time';
import { shareGameResult, copyShareTextToClipboard } from '../../utils/share';
import { IconButton } from '../common/IconButton';
import { GlassView } from '../common/GlassView';

export interface StatsModalProps {
  visible: boolean;
  stats: StoredGameStats;
  currentWinAttempt?: number; // 1-6 if player won today's puzzle
  isGameOver?: boolean;
  shareText?: string;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  visible,
  stats,
  currentWinAttempt,
  isGameOver = false,
  shareText,
  onClose,
}) => {
  const [countdown, setCountdown] = useState<string>(() =>
    formatTimeRemaining(getMsUntilNextUtcMidnight())
  );
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);

  // Update UTC midnight countdown every second while modal is visible
  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      setCountdown(formatTimeRemaining(getMsUntilNextUtcMidnight()));
    }, 1000);

    return () => clearInterval(interval);
  }, [visible]);

  // Find highest win count for proportional distribution bar scaling
  const maxDistributionCount = Math.max(
    1,
    ...Object.values(stats.guessDistribution)
  );

  const handleShare = async () => {
    if (!shareText) return;
    await shareGameResult(shareText);
  };

  const handleCopy = async () => {
    if (!shareText) return;
    const copied = await copyShareTextToClipboard(shareText);
    if (copied) {
      setCopyFeedback(true);
      setTimeout(() => {
        setCopyFeedback(false);
      }, 2000);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <GlassView
          variant="elevated"
          intensity={65}
          style={styles.modalCard}
          accessibilityLabel="Career Statistics"
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>STATISTICS</Text>
            <IconButton
              name="close"
              size={18}
              accessibilityLabel="Close statistics dialog"
              onPress={onClose}
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Top 4 Metrics Summary */}
            <View style={styles.metricsContainer}>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{stats.gamesPlayed}</Text>
                <Text style={styles.metricLabel}>Played</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>
                  {stats.gamesPlayed > 0 ? stats.winPercentage : 0}
                </Text>
                <Text style={styles.metricLabel}>Win %</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{stats.currentStreak}</Text>
                <Text style={styles.metricLabel}>Current Streak</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{stats.maxStreak}</Text>
                <Text style={styles.metricLabel}>Max Streak</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Guess Distribution Section */}
            <Text style={styles.sectionHeader}>GUESS DISTRIBUTION</Text>

            <View style={styles.distributionContainer}>
              {([1, 2, 3, 4, 5, 6] as const).map((attemptNumber) => {
                const count = stats.guessDistribution[attemptNumber] || 0;
                const isCurrentWin = currentWinAttempt === attemptNumber;

                // Compute width percentage with min 9% for readable counter text
                const percentage = Math.max(
                  9,
                  Math.round((count / maxDistributionCount) * 100)
                );

                return (
                  <View key={attemptNumber} style={styles.distributionRow}>
                    <Text style={styles.attemptLabel}>{attemptNumber}</Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.distributionBar,
                          { width: `${percentage}%` },
                          isCurrentWin ? styles.barHighlight : styles.barNormal,
                        ]}
                      >
                        <Text
                          style={[
                            styles.barCountText,
                            isCurrentWin && styles.barCountTextHighlight,
                          ]}
                        >
                          {count}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Empty state hint */}
            {stats.gamesPlayed === 0 && (
              <Text style={styles.emptyHintText}>
                Complete daily puzzles to record your career statistics.
              </Text>
            )}

            {/* End of game footer: Countdown & Native Sharing */}
            {isGameOver && shareText && (
              <>
                <View style={styles.divider} />
                <View style={styles.footerRow}>
                  {/* Next Puzzle Countdown */}
                  <View style={styles.countdownBox}>
                    <Text style={styles.countdownTitle}>NEXT LEXORA</Text>
                    <Text style={styles.countdownTime}>{countdown}</Text>
                  </View>

                  {/* Actions Column */}
                  <View style={styles.shareActionColumn}>
                    <Pressable
                      onPress={handleShare}
                      accessibilityRole="button"
                      accessibilityLabel="Share your game result"
                      style={({ pressed }) => [styles.shareButton, pressed && styles.pressed]}
                    >
                      <Text style={styles.shareButtonText}>SHARE</Text>
                    </Pressable>

                    <Pressable
                      onPress={handleCopy}
                      accessibilityRole="button"
                      accessibilityLabel="Copy result grid to clipboard"
                      style={({ pressed }) => [styles.copyButton, pressed && styles.pressed]}
                    >
                      <Text style={styles.copyButtonText}>
                        {copyFeedback ? 'COPIED!' : 'COPY'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </GlassView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.modalBackdrop,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: layout.maxContentWidth - 24,
    maxHeight: '90%',
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    ...shadows.modal,
  },
  scrollContent: {
    paddingBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.black,
    letterSpacing: typography.letterSpacing.expanded,
    color: colors.textPrimary,
    includeFontPadding: false,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },

  // Metrics
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    columnGap: 6,
    marginBottom: spacing.sm,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    paddingVertical: spacing.sm - 2,
  },
  metricValue: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.black,
    color: colors.textPrimary,
    lineHeight: 32,
    includeFontPadding: false,
  },
  metricLabel: {
    fontSize: typography.fontSizes.xs - 0.5,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 14,
  },

  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.md,
  },

  // Distribution
  sectionHeader: {
    fontSize: typography.fontSizes.xs + 1,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: typography.letterSpacing.wide,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    includeFontPadding: false,
  },
  distributionContainer: {
    width: '100%',
    rowGap: 5,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attemptLabel: {
    width: 14,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textSecondary,
    textAlign: 'center',
    marginRight: 6,
    includeFontPadding: false,
  },
  barTrack: {
    flex: 1,
    height: 22,
    backgroundColor: 'transparent',
    justifyContent: 'center',
  },
  distributionBar: {
    height: 20,
    borderRadius: borderRadius.xs,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 6,
  },
  barNormal: {
    backgroundColor: colors.absent,
  },
  barHighlight: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  barCountText: {
    fontSize: 11,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    includeFontPadding: false,
  },
  barCountTextHighlight: {
    color: colors.textInverse,
  },

  emptyHintText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },

  // Footer
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  countdownBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.borderSubtle,
    paddingRight: spacing.md,
  },
  countdownTitle: {
    fontSize: typography.fontSizes.xs - 1,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: typography.letterSpacing.wide,
    color: colors.textSecondary,
    marginBottom: 4,
    includeFontPadding: false,
  },
  countdownTime: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.black,
    letterSpacing: 1,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
  shareActionColumn: {
    flex: 1.1,
    paddingLeft: spacing.md,
    rowGap: 8,
  },
  shareButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm + 1,
    paddingVertical: spacing.xs + 2,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
  },
  shareButtonText: {
    color: colors.textInverse,
    fontSize: typography.fontSizes.xs + 1,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 1,
    includeFontPadding: false,
  },
  copyButton: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.glassBorderHighlight,
    borderWidth: 1,
    borderRadius: borderRadius.sm + 1,
    paddingVertical: spacing.xs + 2,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyButtonText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 1,
    includeFontPadding: false,
  },
});
