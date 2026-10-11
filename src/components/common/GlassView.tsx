import {
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
  Platform,
  AccessibilityRole,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, borderRadius, shadows } from '../../constants/theme';

export interface GlassViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: 'dark' | 'light' | 'default';
  variant?: 'card' | 'elevated' | 'pill' | 'subtle';
  showHighlight?: boolean;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  testID?: string;
}

/**
 * Premium dark-glass container for Lexora.
 * Layers genuine background blur (via expo-blur) with deep translucent espresso surfaces,
 * a hairline border, and a subtle specular top highlight.
 * Gracefully falls back to translucent layered surfaces when blur is unsupported.
 */
export const GlassView: React.FC<GlassViewProps> = ({
  children,
  style,
  intensity = 45,
  tint = 'dark',
  variant = 'card',
  showHighlight = true,
  accessibilityRole,
  accessibilityLabel,
  testID,
}) => {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return styles.variantElevated;
      case 'pill':
        return styles.variantPill;
      case 'subtle':
        return styles.variantSubtle;
      case 'card':
      default:
        return styles.variantCard;
    }
  };

  return (
    <View
      style={[
        styles.outerContainer,
        getVariantStyle(),
        showHighlight && styles.topHighlightBorder,
        style,
      ]}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      <BlurView
        intensity={Platform.OS === 'web' ? Math.min(intensity, 30) : intensity}
        tint={tint}
        style={StyleSheet.absoluteFill}
      />
      {/* Subtle translucent tint overlay to ensure high-contrast legibility */}
      <View
        style={[
          StyleSheet.absoluteFill,
          variant === 'elevated' ? styles.overlayElevated : styles.overlayDefault,
        ]}
        pointerEvents="none"
      />
      {/* Specular hairline inner edge */}
      {showHighlight && <View style={styles.specularEdge} pointerEvents="none" />}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    ...shadows.glass,
  },
  variantCard: {
    borderRadius: borderRadius.xl,
    backgroundColor: colors.glassCard,
  },
  variantElevated: {
    borderRadius: borderRadius.xl,
    backgroundColor: colors.glassCardElevated,
    borderColor: colors.glassBorderHighlight,
  },
  variantPill: {
    borderRadius: borderRadius.pill,
    backgroundColor: colors.glassCard,
  },
  variantSubtle: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.glassBorderSubtle,
  },
  topHighlightBorder: {
    borderTopColor: colors.glassBorderHighlight,
  },
  overlayDefault: {
    backgroundColor: 'rgba(26, 16, 10, 0.40)',
  },
  overlayElevated: {
    backgroundColor: 'rgba(38, 28, 20, 0.45)',
  },
  specularEdge: {
    position: 'absolute',
    top: 0,
    left: 8,
    right: 8,
    height: 1,
    backgroundColor: colors.glassHighlight,
    opacity: 0.8,
  },
});
