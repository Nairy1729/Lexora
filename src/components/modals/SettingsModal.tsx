import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Switch,
} from 'react-native';
import { colors, spacing, borderRadius, typography, shadows, controls } from '../../constants/theme';
import { layout } from '../../constants/layout';
import { IconButton } from '../common/IconButton';
import { GlassView } from '../common/GlassView';

export interface SettingsModalProps {
  visible: boolean;
  hapticsEnabled: boolean;
  dailyRemindersEnabled: boolean;
  onToggleHaptics: (enabled: boolean) => void;
  onToggleReminders: (enabled: boolean) => void;
  onResetData: () => Promise<void>;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  hapticsEnabled,
  dailyRemindersEnabled,
  onToggleHaptics,
  onToggleReminders,
  onResetData,
  onClose,
}) => {
  const [confirmingReset, setConfirmingReset] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      await onResetData();
      setConfirmingReset(false);
      onClose();
    } finally {
      setIsResetting(false);
    }
  };

  const handleClose = () => {
    setConfirmingReset(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <GlassView
          variant="elevated"
          intensity={65}
          style={styles.modalCard}
          accessibilityLabel="Game Settings"
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>SETTINGS</Text>
            <IconButton
              name="close"
              size={18}
              accessibilityLabel="Close settings dialog"
              onPress={handleClose}
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Setting Item: Haptic Feedback */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Haptic Feedback</Text>
                <Text style={styles.settingSubtext}>
                  Tactile vibrations on typing, evaluations, and game events
                </Text>
              </View>
              <Switch
                value={hapticsEnabled}
                onValueChange={onToggleHaptics}
                trackColor={{ false: colors.absent, true: colors.primary }}
                thumbColor={colors.textPrimary}
                accessibilityLabel="Toggle haptic feedback"
              />
            </View>

            <View style={styles.divider} />

            {/* Setting Item: Daily Reminders */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Daily Reminders</Text>
                <Text style={styles.settingSubtext}>
                  Gentle 4-hour daytime alerts (9 AM, 1 PM, 5 PM, 9 PM) while today&#39;s puzzle is unfinished
                </Text>
              </View>
              <Switch
                value={dailyRemindersEnabled}
                onValueChange={onToggleReminders}
                trackColor={{ false: colors.absent, true: colors.primary }}
                thumbColor={colors.textPrimary}
                accessibilityLabel="Toggle daily reminders"
              />
            </View>

            <View style={styles.divider} />

            {/* Daily Schedule Explanation */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>DAILY PUZZLE SCHEDULE</Text>
              <Text style={styles.infoBody}>
                Lexora publishes a new deterministic daily word every day at 00:00 UTC. The puzzle is identical for all players worldwide.
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Reset Data Section */}
            <View style={styles.dangerZone}>
              <Text style={styles.dangerTitle}>RESET DATA</Text>
              <Text style={styles.dangerBody}>
                Permanently clear today&#39;s saved game progress and all career statistics.
              </Text>

              {!confirmingReset ? (
                <Pressable
                  onPress={() => setConfirmingReset(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Reset all game progress and statistics"
                  style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
                >
                  <Text style={styles.resetButtonText}>RESET ALL DATA</Text>
                </Pressable>
              ) : (
                <View style={styles.confirmBox}>
                  <Text style={styles.confirmPrompt}>
                    Are you sure? This action cannot be undone.
                  </Text>
                  <View style={styles.confirmActionsRow}>
                    <Pressable
                      onPress={() => setConfirmingReset(false)}
                      disabled={isResetting}
                      accessibilityRole="button"
                      accessibilityLabel="Cancel data reset"
                      style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
                    >
                      <Text style={styles.cancelButtonText}>CANCEL</Text>
                    </Pressable>
                    <Pressable
                      onPress={handleConfirmReset}
                      disabled={isResetting}
                      accessibilityRole="button"
                      accessibilityLabel="Confirm permanent data reset"
                      style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}
                    >
                      <Text style={styles.confirmButtonText}>
                        {isResetting ? 'RESETTING...' : 'CONFIRM RESET'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            {/* About / Version */}
            <View style={styles.aboutBox}>
              <Text style={styles.aboutBrand}>
                LEX<Text style={styles.brandAccent}>O</Text>RA v1.0.0
              </Text>
              <Text style={styles.aboutSub}>
                A clean, classic five-letter daily word puzzle
              </Text>
              <Text style={styles.aboutBadge}>
                Offline-First • No Accounts • No Ads
              </Text>
            </View>
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
    maxHeight: '88%',
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
    opacity: 0.7,
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  settingInfo: {
    flex: 1,
    paddingRight: spacing.md,
  },
  settingLabel: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 2,
    includeFontPadding: false,
  },
  settingSubtext: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 16,
  },

  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.md,
  },

  infoCard: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  infoTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.8,
    color: colors.primary,
    marginBottom: 4,
    includeFontPadding: false,
  },
  infoBody: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 16,
  },

  dangerZone: {
    marginTop: 2,
  },
  dangerTitle: {
    fontSize: typography.fontSizes.xs + 1,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.8,
    color: colors.error,
    marginBottom: 4,
    includeFontPadding: false,
  },
  dangerBody: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: spacing.sm,
  },
  resetButton: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.xs,
    minHeight: controls.buttonHeightMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    color: colors.error,
    fontSize: typography.fontSizes.xs + 1,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: typography.letterSpacing.wide,
    includeFontPadding: false,
  },

  confirmBox: {
    backgroundColor: colors.errorSubtle,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error,
    padding: spacing.sm + 2,
  },
  confirmPrompt: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semiBold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  confirmActionsRow: {
    flexDirection: 'row',
    columnGap: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.xs,
    minHeight: controls.buttonHeightSm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorderHighlight,
  },
  cancelButtonText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: typography.letterSpacing.wide,
    includeFontPadding: false,
  },
  confirmButton: {
    flex: 1.2,
    backgroundColor: colors.error,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.xs,
    minHeight: controls.buttonHeightSm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: typography.letterSpacing.wide,
    includeFontPadding: false,
  },

  aboutBox: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  aboutBrand: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.black,
    letterSpacing: typography.letterSpacing.brand,
    color: colors.textPrimary,
    marginBottom: 2,
    includeFontPadding: false,
  },
  brandAccent: {
    color: colors.primary,
  },
  aboutSub: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  aboutBadge: {
    fontSize: typography.fontSizes.xs - 1,
    fontWeight: typography.fontWeights.medium,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
});
