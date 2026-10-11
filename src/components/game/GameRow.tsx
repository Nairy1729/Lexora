import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LetterEvaluation, TileStatus } from '../../types/game';
import { GameTile } from './GameTile';
import { spacing } from '../../constants/theme';
import { usePrefersReducedMotion } from '../../utils/motion';

export interface GameRowProps {
  word?: string;
  evaluations?: LetterEvaluation[];
  isCurrent?: boolean;
  tileSize: number;
  isRevealing?: boolean;
  isWinningRow?: boolean;
  shakeTrigger?: number;
}

export const GameRow: React.FC<GameRowProps> = ({
  word = '',
  evaluations,
  isCurrent = false,
  tileSize,
  isRevealing = false,
  isWinningRow = false,
  shakeTrigger = 0,
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const shakeTranslateX = useSharedValue<number>(0);

  // Row Shake: Horizontal oscillation on invalid guess submission
  useEffect(() => {
    if (shakeTrigger > 0 && isCurrent && !prefersReducedMotion) {
      shakeTranslateX.value = withSequence(
        withTiming(-8, { duration: 40 }),
        withTiming(8, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(-3, { duration: 50 }),
        withTiming(3, { duration: 50 }),
        withTiming(0, { duration: 40 })
      );
    }
  }, [shakeTrigger, isCurrent, prefersReducedMotion, shakeTranslateX]);

  const animatedRowStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shakeTranslateX.value }],
    };
  });

  const tiles = [];

  for (let i = 0; i < 5; i++) {
    const letter = word[i] || '';
    let status: TileStatus = 'empty';

    if (evaluations && evaluations[i]) {
      status = evaluations[i];
    } else if (isCurrent && letter) {
      status = 'tbd';
    }

    tiles.push(
      <GameTile
        key={i}
        columnIndex={i}
        letter={letter}
        status={status}
        size={tileSize}
        isRevealing={isRevealing}
        isWinningTile={isWinningRow}
      />
    );
  }

  return (
    <Animated.View style={[styles.rowContainer, animatedRowStyle]}>
      {tiles}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    columnGap: spacing.xs + 2, // 6px gap
    marginVertical: 3,
  },
});
