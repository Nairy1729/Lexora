import React from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  ScrollView,
} from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { layout } from '../../constants/layout';
import { GameTile } from './GameTile';
import { IconButton } from '../common/IconButton';
import { GlassView } from '../common/GlassView';

export interface HelpModalProps {
  visible: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ visible, onClose }) => {
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
          accessibilityLabel="How to Play guide"
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>HOW TO PLAY</Text>
            <IconButton
              name="close"
              size={18}
              accessibilityLabel="Close help dialog"
              onPress={onClose}
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Rules Overview */}
            <Text style={styles.paragraph}>
              Guess the hidden <Text style={styles.brandAccent}>LEXORA</Text> in 6 attempts.
            </Text>
            <Text style={styles.bullet}>• Each guess must be a valid 5-letter English word.</Text>
            <Text style={styles.bullet}>• The color of the tiles changes after each submission to indicate how close your guess was to the word.</Text>

            <View style={styles.divider} />

            {/* Illustrative Examples */}
            <Text style={styles.exampleHeader}>EXAMPLES</Text>

            {/* Example 1: Green / Correct */}
            <View style={styles.exampleRow}>
              <GameTile letter="F" status="correct" size={38} />
              <GameTile letter="O" status="empty" size={38} />
              <GameTile letter="R" status="empty" size={38} />
              <GameTile letter="G" status="empty" size={38} />
              <GameTile letter="E" status="empty" size={38} />
            </View>
            <Text style={styles.exampleCaption}>
              <Text style={styles.bold}>F</Text> is in the word and in the exact position.
            </Text>

            {/* Example 2: Yellow / Present */}
            <View style={styles.exampleRow}>
              <GameTile letter="B" status="empty" size={38} />
              <GameTile letter="L" status="empty" size={38} />
              <GameTile letter="A" status="present" size={38} />
              <GameTile letter="N" status="empty" size={38} />
              <GameTile letter="D" status="empty" size={38} />
            </View>
            <Text style={styles.exampleCaption}>
              <Text style={styles.bold}>A</Text> is in the word but in a different position.
            </Text>

            {/* Example 3: Gray / Absent */}
            <View style={styles.exampleRow}>
              <GameTile letter="P" status="empty" size={38} />
              <GameTile letter="R" status="empty" size={38} />
              <GameTile letter="I" status="empty" size={38} />
              <GameTile letter="S" status="empty" size={38} />
              <GameTile letter="M" status="absent" size={38} />
            </View>
            <Text style={styles.exampleCaption}>
              <Text style={styles.bold}>M</Text> is not in the word in any position.
            </Text>

            <View style={styles.divider} />

            <View style={styles.scheduleBox}>
              <Text style={styles.scheduleHeader}>DAILY PUZZLE SCHEDULE</Text>
              <Text style={styles.scheduleText}>
                A new deterministic puzzle is published every day at 00:00 UTC. Everyone solves the exact same word worldwide.
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
  paragraph: {
    fontSize: typography.fontSizes.sm,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  brandAccent: {
    fontWeight: typography.fontWeights.black,
    color: colors.primary,
  },
  bullet: {
    fontSize: typography.fontSizes.xs + 1,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  bold: {
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.md,
  },
  exampleHeader: {
    fontSize: typography.fontSizes.xs + 1,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: typography.letterSpacing.wide,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    includeFontPadding: false,
  },
  exampleRow: {
    flexDirection: 'row',
    columnGap: 6,
    marginBottom: 6,
  },
  exampleCaption: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 16,
  },
  scheduleBox: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  scheduleHeader: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: 0.8,
    color: colors.primary,
    marginBottom: 3,
    includeFontPadding: false,
  },
  scheduleText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});
