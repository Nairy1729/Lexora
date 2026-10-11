import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { TileStatus } from '../../types/game';
import { colors, borderRadius, typography } from '../../constants/theme';
import { MOTION_TIMINGS, usePrefersReducedMotion } from '../../utils/motion';

export interface GameTileProps {
  letter?: string;
  status: TileStatus;
  size: number;
  columnIndex?: number;
  isRevealing?: boolean;
  isWinningTile?: boolean;
}

export const GameTile: React.FC<GameTileProps> = ({
  letter = '',
  status,
  size,
  columnIndex = 0,
  isRevealing = false,
  isWinningTile = false,
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [revealedStatus, setRevealedStatus] = useState<TileStatus | null>(null);
  const prevLetterRef = useRef<string>(letter);

  // Derive displayed status: during active reveal show 'tbd' until midpoint timer fires
  const displayedStatus: TileStatus = isRevealing
    ? (revealedStatus ?? 'tbd')
    : status;

  // Reanimated shared values
  const popScale = useSharedValue<number>(1);
  const flipScaleY = useSharedValue<number>(1);
  const bounceTranslateY = useSharedValue<number>(0);

  // Letter Pop: Triggered when a new letter is typed into an empty or TBD tile
  useEffect(() => {
    const prevLetter = prevLetterRef.current;
    prevLetterRef.current = letter;

    if (isRevealing || isWinningTile) return;

    if (letter && (!prevLetter || prevLetter !== letter) && (status === 'tbd' || status === 'empty')) {
      if (!prefersReducedMotion) {
        popScale.value = withSequence(
          withTiming(MOTION_TIMINGS.tilePopScale, {
            duration: MOTION_TIMINGS.tilePopDuration / 2,
            easing: Easing.out(Easing.ease),
          }),
          withTiming(1, {
            duration: MOTION_TIMINGS.tilePopDuration / 2,
            easing: Easing.in(Easing.ease),
          })
        );
      }
    } else if (!letter) {
      popScale.value = 1;
    }
  }, [letter, status, isRevealing, isWinningTile, prefersReducedMotion, popScale]);

  // Flip Reveal: Sequential vertical scale down, color swap at midpoint, scale back up
  useEffect(() => {
    if (!isRevealing || prefersReducedMotion) {
      flipScaleY.value = 1;
      return;
    }

    const staggerDelay = columnIndex * MOTION_TIMINGS.tileFlipStaggerDelay;

    flipScaleY.value = withDelay(
      staggerDelay,
      withSequence(
        withTiming(0, {
          duration: MOTION_TIMINGS.tileFlipHalfDuration,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1, {
          duration: MOTION_TIMINGS.tileFlipHalfDuration,
          easing: Easing.inOut(Easing.ease),
        })
      )
    );

    // Swap color and border precisely when scale reaches 0 (the midpoint)
    const swapTimer = setTimeout(() => {
      setRevealedStatus(status);
    }, staggerDelay + MOTION_TIMINGS.tileFlipHalfDuration);

    return () => clearTimeout(swapTimer);
  }, [isRevealing, status, columnIndex, prefersReducedMotion, flipScaleY]);

  // Win Celebration Bounce: Staggered bounce along the winning row
  useEffect(() => {
    if (isWinningTile && !prefersReducedMotion) {
      const staggerDelay = columnIndex * MOTION_TIMINGS.winBounceStaggerDelay;
      bounceTranslateY.value = withDelay(
        staggerDelay,
        withSequence(
          withTiming(MOTION_TIMINGS.winBounceDistance, {
            duration: MOTION_TIMINGS.winBounceDuration / 2,
            easing: Easing.out(Easing.quad),
          }),
          withTiming(0, {
            duration: MOTION_TIMINGS.winBounceDuration / 2,
            easing: Easing.in(Easing.quad),
          })
        )
      );
    } else {
      bounceTranslateY.value = 0;
    }
  }, [isWinningTile, columnIndex, prefersReducedMotion, bounceTranslateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: popScale.value },
        { scaleY: flipScaleY.value },
        { translateY: bounceTranslateY.value },
      ],
    };
  });

  const getTileStyle = () => {
    switch (displayedStatus) {
      case 'correct':
        return styles.tileCorrect;
      case 'present':
        return styles.tilePresent;
      case 'absent':
        return styles.tileAbsent;
      case 'tbd':
        return styles.tileTbd;
      case 'empty':
      default:
        return styles.tileEmpty;
    }
  };

  return (
    <Animated.View
      style={[
        styles.tileBase,
        { width: size, height: size },
        getTileStyle(),
        isWinningTile && styles.tileWinningGlow,
        animatedStyle,
      ]}
      accessibilityRole="text"
      accessibilityLabel={letter ? `${letter}, ${displayedStatus}` : 'Empty tile'}
    >
      <Text
        style={[
          styles.letterText,
          { fontSize: Math.round(size * 0.52) },
        ]}
      >
        {letter}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  tileBase: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
  },
  letterText: {
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  tileEmpty: {
    backgroundColor: colors.empty,
    borderColor: colors.border,
  },
  tileTbd: {
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
  },
  tileCorrect: {
    backgroundColor: colors.correct,
    borderColor: colors.correctBorder,
  },
  tilePresent: {
    backgroundColor: colors.present,
    borderColor: colors.presentBorder,
  },
  tileAbsent: {
    backgroundColor: colors.absent,
    borderColor: colors.absentBorder,
  },
  tileWinningGlow: {
    borderColor: colors.winningGlowBorder,
    shadowColor: colors.correct,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 8,
    elevation: 6,
  },
});
