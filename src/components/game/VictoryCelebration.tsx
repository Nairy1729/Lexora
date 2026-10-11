import React, { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated';
import { usePrefersReducedMotion } from '../../utils/motion';

export interface VictoryCelebrationProps {
  onComplete?: () => void;
}

interface ParticleConfig {
  id: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  size: number;
  color: string;
  rotation: number;
  delay: number;
  isPill: boolean;
}

const PARTICLE_COLORS = [
  '#FF7A00', // Brand Primary Orange
  '#FFB049', // Warm Amber
  '#FFD166', // Soft Gold
  '#FFF8F0', // Cream Accent
  '#538D4E', // Forest Correct Green
  '#FF9130', // Deep Gold
];

/**
 * Single particle animated with native-driven Reanimated shared values.
 */
const ParticleItem: React.FC<{ config: ParticleConfig; progress: SharedValue<number> }> = ({
  config,
  progress,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const p = Math.max(0, Math.min(1, progress.value));
    // Arc trajectory: outward velocity with subtle gravity
    const x = config.startX + (config.targetX - config.startX) * p;
    const y = config.startY + (config.targetY - config.startY) * p + 40 * (p * p);
    const opacity = p < 0.1 ? p * 10 : Math.max(0, 1 - Math.pow(p, 1.4));
    const scale = p < 0.2 ? p * 5 : Math.max(0.2, 1 - (p - 0.2) * 0.7);
    const rotate = `${config.rotation * p}deg`;

    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { scale },
        { rotate },
      ],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: config.size,
          height: config.isPill ? config.size * 1.6 : config.size,
          borderRadius: config.isPill ? config.size / 2 : 2,
          backgroundColor: config.color,
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    />
  );
};

/**
 * Lightweight, high-performance particle burst celebration.
 * Fires a tasteful spray of warm ember and gold particles on puzzle victory.
 * Automatically respects reduced-motion preferences and cleans up after 1.4s.
 */
export const VictoryCelebration: React.FC<VictoryCelebrationProps> = ({ onComplete }) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { width, height } = useWindowDimensions();
  const progress = useSharedValue(0);

  // Generate deterministic array of particles centered around the board
  const particles: ParticleConfig[] = React.useMemo(() => {
    const count = 30;
    const centerX = width / 2;
    const centerY = height * 0.38; // Originates around active row
    const list: ParticleConfig[] = [];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * (i / count)) + ((i % 3) * 0.2);
      // Stagger distance: 60px to 160px burst radius
      const distance = 70 + ((i * 19) % 110);
      const targetX = Math.cos(angle) * distance;
      // Bias upward so particles fountain gently upwards
      const targetY = (Math.sin(angle) * distance * 0.75) - 35;

      list.push({
        id: i,
        startX: centerX,
        startY: centerY,
        targetX: centerX + targetX,
        targetY: centerY + targetY,
        size: 5 + (i % 4),
        color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
        rotation: (i % 2 === 0 ? 1 : -1) * (120 + (i * 20)),
        delay: (i % 5) * 25,
        isPill: i % 3 === 0,
      });
    }

    return list;
  }, [width, height]);

  useEffect(() => {
    if (prefersReducedMotion) {
      if (onComplete) onComplete();
      return;
    }

    progress.value = withTiming(
      1,
      {
        duration: 1350,
        easing: Easing.out(Easing.cubic),
      },
      (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      }
    );
  }, [prefersReducedMotion, onComplete, progress]);

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => (
        <ParticleItem key={p.id} config={p} progress={progress} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
