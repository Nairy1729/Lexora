import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { colors, borderRadius, typography } from '../../constants/theme';
import { usePrefersReducedMotion } from '../../utils/motion';

export interface AppLaunchScreenProps {
  /** True when app state (storage hydration and daily puzzle) is ready */
  isReady: boolean;
  /** Invoked when entrance sequence and exit fade out have completed */
  onAnimationComplete: () => void;
}

/**
 * Lexora Cinematic Animated Launch Experience
 *
 * Choreographs a restrained, editorial entrance matching Lexora's dark-glass identity:
 * - Phase A: Background fade-in with soft concentric amber glow.
 * - Phase B: Wordmark entrance with gentle upward glide and orange 'O' pulse.
 * - Phase C: Staggered sequential reveal of 5 minimalist word puzzle tiles.
 * - Phase D: Smooth dissolution into the hydrated gameplay stage without visual jump.
 */
export const AppLaunchScreen: React.FC<AppLaunchScreenProps> = ({
  isReady,
  onAnimationComplete,
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [sequenceFinished, setSequenceFinished] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const hasTriggeredExitRef = useRef(false);

  // Background & Ambient Glow
  const backgroundOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(prefersReducedMotion ? 1 : 0.92);

  // Wordmark & Subtitle
  const wordmarkOpacity = useSharedValue(0);
  const wordmarkTranslateY = useSharedValue(prefersReducedMotion ? 0 : 14);
  const wordmarkScale = useSharedValue(prefersReducedMotion ? 1 : 0.96);
  const accentOPulse = useSharedValue(1);

  // 5 Minimalist Game Tiles
  const tile0Opacity = useSharedValue(0);
  const tile0Scale = useSharedValue(prefersReducedMotion ? 1 : 0.86);
  const tile1Opacity = useSharedValue(0);
  const tile1Scale = useSharedValue(prefersReducedMotion ? 1 : 0.86);
  const tile2Opacity = useSharedValue(0);
  const tile2Scale = useSharedValue(prefersReducedMotion ? 1 : 0.86);
  const tile3Opacity = useSharedValue(0);
  const tile3Scale = useSharedValue(prefersReducedMotion ? 1 : 0.86);
  const tile4Opacity = useSharedValue(0);
  const tile4Scale = useSharedValue(prefersReducedMotion ? 1 : 0.86);

  // Exit Dissolve Transition
  const containerOpacity = useSharedValue(1);
  const containerScale = useSharedValue(1);

  // Phase A, B, C: Choreographed Entrance Sequence
  useEffect(() => {
    if (prefersReducedMotion) {
      // Fast accessibility transition for reduced motion
      backgroundOpacity.value = withTiming(1, { duration: 150 });
      glowOpacity.value = withTiming(1, { duration: 200 });
      wordmarkOpacity.value = withTiming(1, { duration: 200 });

      tile0Opacity.value = withDelay(80, withTiming(1, { duration: 100 }));
      tile1Opacity.value = withDelay(120, withTiming(1, { duration: 100 }));
      tile2Opacity.value = withDelay(160, withTiming(1, { duration: 100 }));
      tile3Opacity.value = withDelay(200, withTiming(1, { duration: 100 }));
      tile4Opacity.value = withDelay(240, withTiming(1, { duration: 100 }));

      const timer = setTimeout(() => {
        setSequenceFinished(true);
      }, 350);
      return () => clearTimeout(timer);
    }

    // Standard Cinematic Entrance Sequence:
    // 0ms: Background & Ambient Glow
    backgroundOpacity.value = withTiming(1, { duration: 280 });
    glowOpacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
    glowScale.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });

    // 200ms: Wordmark & Brand Typography
    wordmarkOpacity.value = withDelay(
      180,
      withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) })
    );
    wordmarkTranslateY.value = withDelay(
      180,
      withTiming(0, {
        duration: 520,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );
    wordmarkScale.value = withDelay(
      180,
      withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) })
    );

    // 600ms: Subtle Luminescence Pulse on the 'O'
    accentOPulse.value = withDelay(
      600,
      withSequence(
        withTiming(1.14, { duration: 180, easing: Easing.out(Easing.quad) }),
        withTiming(1.0, { duration: 220, easing: Easing.inOut(Easing.quad) })
      )
    );

    // 450ms - 850ms: Sequential Tile Reveals (100ms stagger)
    const tileEase = Easing.bezier(0.2, 0.8, 0.3, 1);
    const tileDuration = 280;

    tile0Opacity.value = withDelay(420, withTiming(1, { duration: tileDuration }));
    tile0Scale.value = withDelay(
      420,
      withTiming(1, { duration: tileDuration, easing: tileEase })
    );

    tile1Opacity.value = withDelay(520, withTiming(1, { duration: tileDuration }));
    tile1Scale.value = withDelay(
      520,
      withTiming(1, { duration: tileDuration, easing: tileEase })
    );

    tile2Opacity.value = withDelay(620, withTiming(1, { duration: tileDuration }));
    tile2Scale.value = withDelay(
      620,
      withTiming(1, { duration: tileDuration, easing: tileEase })
    );

    tile3Opacity.value = withDelay(720, withTiming(1, { duration: tileDuration }));
    tile3Scale.value = withDelay(
      720,
      withTiming(1, { duration: tileDuration, easing: tileEase })
    );

    tile4Opacity.value = withDelay(820, withTiming(1, { duration: tileDuration }));
    tile4Scale.value = withDelay(
      820,
      withTiming(1, { duration: tileDuration, easing: tileEase })
    );

    // Sequence settles gracefully at ~1300ms
    const timer = setTimeout(() => {
      setSequenceFinished(true);
    }, 1300);

    return () => clearTimeout(timer);
  }, [
    prefersReducedMotion,
    backgroundOpacity,
    glowOpacity,
    glowScale,
    wordmarkOpacity,
    wordmarkTranslateY,
    wordmarkScale,
    accentOPulse,
    tile0Opacity,
    tile0Scale,
    tile1Opacity,
    tile1Scale,
    tile2Opacity,
    tile2Scale,
    tile3Opacity,
    tile3Scale,
    tile4Opacity,
    tile4Scale,
  ]);

  // Phase D: Exit Transition when both sequence and app hydration are ready
  useEffect(() => {
    if (sequenceFinished && isReady && !hasTriggeredExitRef.current) {
      hasTriggeredExitRef.current = true;
      setIsExiting(true);

      const exitDuration = prefersReducedMotion ? 180 : 360;
      containerScale.value = withTiming(1.025, {
        duration: exitDuration,
        easing: Easing.out(Easing.cubic),
      });

      containerOpacity.value = withTiming(
        0,
        {
          duration: exitDuration,
          easing: Easing.inOut(Easing.cubic),
        },
        (finished) => {
          if (finished) {
            runOnJS(onAnimationComplete)();
          }
        }
      );
    }
  }, [
    sequenceFinished,
    isReady,
    prefersReducedMotion,
    containerOpacity,
    containerScale,
    onAnimationComplete,
  ]);

  // Safety Failsafe: Ensures launch screen never traps user under any circumstance
  useEffect(() => {
    const failsafe = setTimeout(() => {
      if (!hasTriggeredExitRef.current) {
        hasTriggeredExitRef.current = true;
        onAnimationComplete();
      }
    }, 2500);

    return () => clearTimeout(failsafe);
  }, [onAnimationComplete]);

  // Animated Styles
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: containerScale.value }],
  }));

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const wordmarkAnimatedStyle = useAnimatedStyle(() => ({
    opacity: wordmarkOpacity.value,
    transform: [
      { translateY: wordmarkTranslateY.value },
      { scale: wordmarkScale.value },
    ],
  }));

  const accentOAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: accentOPulse.value }],
  }));

  const tile0Style = useAnimatedStyle(() => ({
    opacity: tile0Opacity.value,
    transform: [{ scale: tile0Scale.value }],
  }));

  const tile1Style = useAnimatedStyle(() => ({
    opacity: tile1Opacity.value,
    transform: [{ scale: tile1Scale.value }],
  }));

  const tile2Style = useAnimatedStyle(() => ({
    opacity: tile2Opacity.value,
    transform: [{ scale: tile2Scale.value }],
  }));

  const tile3Style = useAnimatedStyle(() => ({
    opacity: tile3Opacity.value,
    transform: [{ scale: tile3Scale.value }],
  }));

  const tile4Style = useAnimatedStyle(() => ({
    opacity: tile4Opacity.value,
    transform: [{ scale: tile4Scale.value }],
  }));

  return (
    <Animated.View
      style={[styles.container, containerAnimatedStyle]}
      pointerEvents={isExiting ? 'none' : 'auto'}
      accessibilityLabel="Lexora Launching"
    >
      {/* Dark Espresso Base Background */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.backgroundFill, backgroundAnimatedStyle]} />

      {/* Subtle Concentric Amber Warm Glow (Lightweight native rendering) */}
      <Animated.View style={[styles.glowWrapper, glowAnimatedStyle]} pointerEvents="none">
        <View style={styles.glowOuter} />
        <View style={styles.glowInner} />
      </Animated.View>

      {/* Central Hero Block */}
      <View style={styles.content}>
        {/* Brand Wordmark & Tagline */}
        <Animated.View style={[styles.wordmarkBlock, wordmarkAnimatedStyle]}>
          <View style={styles.wordmarkRow}>
            <Text style={styles.wordmarkText}>LEX</Text>
            <Animated.View style={[styles.accentOWrapper, accentOAnimatedStyle]}>
              <Text style={styles.accentOText}>O</Text>
            </Animated.View>
            <Text style={styles.wordmarkText}>RA</Text>
          </View>
          <Text style={styles.taglineText}>DAILY WORD PUZZLE</Text>
        </Animated.View>

        {/* 5 Minimalist Game Tiles */}
        <View style={styles.tilesRow}>
          <Animated.View style={[styles.tile, tile0Style]} />
          <Animated.View style={[styles.tile, tile1Style]} />
          {/* Middle tile aligned with the orange 'O' */}
          <Animated.View style={[styles.tile, styles.tileAccent, tile2Style]}>
            <View style={styles.tileAccentPip} />
          </Animated.View>
          <Animated.View style={[styles.tile, tile3Style]} />
          <Animated.View style={[styles.tile, tile4Style]} />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  backgroundFill: {
    backgroundColor: colors.background,
  },
  glowWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOuter: {
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.primaryGlowSubtle,
  },
  glowInner: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: colors.ambientGlow,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmarkBlock: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmarkText: {
    fontSize: typography.fontSizes.hero,
    fontWeight: typography.fontWeights.black,
    letterSpacing: Platform.OS === 'web' ? typography.letterSpacing.brandHero + 1 : typography.letterSpacing.brandHero,
    color: colors.textPrimary,
    includeFontPadding: false,
  },
  accentOWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentOText: {
    fontSize: typography.fontSizes.hero,
    fontWeight: typography.fontWeights.black,
    letterSpacing: Platform.OS === 'web' ? typography.letterSpacing.brandHero + 1 : typography.letterSpacing.brandHero,
    color: colors.primary,
    includeFontPadding: false,
  },
  taglineText: {
    marginTop: 8,
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semiBold,
    letterSpacing: 3.5,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  tilesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 8,
    marginTop: 34,
  },
  tile: {
    width: 46,
    height: 46,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileAccent: {
    borderColor: colors.primaryBorderGlow,
  },
  tileAccentPip: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    opacity: 0.85,
  },
});
