import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { colors, borderRadius, typography, spacing, shadows } from '../../constants/theme';
import { GlassView } from '../common/GlassView';

export interface GameMessageProps {
  message: string | null;
}

export const GameMessage: React.FC<GameMessageProps> = ({ message }) => {
  if (!message) {
    return null;
  }

  return (
    <View style={styles.messageOverlay} pointerEvents="none">
      <GlassView
        variant="elevated"
        intensity={60}
        style={styles.messageBubble}
        accessibilityRole="alert"
      >
        <Text style={styles.messageText}>{message}</Text>
      </GlassView>
    </View>
  );
};

const styles = StyleSheet.create({
  messageOverlay: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  messageBubble: {
    borderRadius: borderRadius.pill,
    paddingVertical: spacing.xs + 3,
    paddingHorizontal: spacing.lg,
    borderColor: colors.glassBorderHighlight,
    borderWidth: 1,
    ...shadows.glass,
  },
  messageText: {
    color: colors.textPrimary,
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: typography.letterSpacing.wide,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
