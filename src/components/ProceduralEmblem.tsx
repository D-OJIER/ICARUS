import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Circle, Polygon } from 'react-native-svg';

interface ProceduralEmblemProps {
  name: string;
  id: string;
  createdAt: string;
  difficulty: string;
  size?: number;
  pulseEnabled?: boolean;
}

export const ProceduralEmblem: React.FC<ProceduralEmblemProps> = ({
  name,
  id,
  createdAt,
  difficulty,
  size = 64,
  pulseEnabled = true,
}) => {
  const getStringSeed = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const seed = getStringSeed(name + id + createdAt + difficulty);

  // Derive parameters from seed
  const sides = (seed % 6) + 3; // 3 (triangle) to 8 (octagon)
  const rotationDirection = seed % 2 === 0 ? 1 : -1;
  const rotationSpeed = (seed % 15) + 12; // 12s to 27s complete cycle
  const innerSides = ((seed >> 2) % 4) + 3; // Inner shape sides
  const orbitsCount = (seed % 5) + 2; // 2 to 6 orbiting nodes
  const outerSpikesCount = ((seed >> 4) % 8) + 6; // 6 to 13 external spikes
  const innerRingType = seed % 3; // 0: plain, 1: dashed, 2: double

  let primaryColor = '#c89e5c'; // Gothic gold
  if (difficulty === 'Mortal Penance') {
    primaryColor = '#dc2626'; // Gothic blood red
  } else if (difficulty === 'Sinuous Vow') {
    primaryColor = '#6e8fa8'; // Gothic sky blue
  }

  // Draw regular polygon coordinates
  const getPolygonPoints = (numSides: number, radius: number): string => {
    const points: string[] = [];
    for (let i = 0; i < numSides; i++) {
      const angle = (i * 2 * Math.PI) / numSides - Math.PI / 2;
      const x = 50 + radius * Math.cos(angle);
      const y = 50 + radius * Math.sin(angle);
      points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    }
    return points.join(' ');
  };

  // Outer gears/spikes paths
  const getOuterSpikes = (count: number, innerR: number, outerR: number): string => {
    const points: string[] = [];
    for (let i = 0; i < count * 2; i++) {
      const isOuter = i % 2 === 0;
      const r = isOuter ? outerR : innerR;
      const angle = (i * Math.PI) / count - Math.PI / 2;
      const x = 50 + r * Math.cos(angle);
      const y = 50 + r * Math.sin(angle);
      points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    }
    return points.join(' ') + ' z';
  };

  // Animation values
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Rotation Loop
    const rotationDuration = rotationSpeed * 1000;
    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: rotationDuration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    rotateLoop.start();

    // Pulse Loop
    let pulseLoop: Animated.CompositeAnimation | null = null;
    if (pulseEnabled) {
      pulseAnim.setValue(1);
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
    }

    return () => {
      rotateLoop.stop();
      if (pulseLoop) pulseLoop.stop();
    };
  }, [rotationSpeed, pulseEnabled]);

  // Interpolations
  const rotateClockwise = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const rotateCounterClockwise = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  const rotationOuter = rotationDirection === 1 ? rotateClockwise : rotateCounterClockwise;
  const rotationInner = rotationDirection === 1 ? rotateCounterClockwise : rotateClockwise;

  const pointsOuterSpikes = getOuterSpikes(outerSpikesCount, 40, 45);
  const pointsMainPoly = getPolygonPoints(sides, 35);
  const pointsInnerPoly = getPolygonPoints(innerSides, 21);

  return (
    <View style={{ width: size, height: size, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
      
      {/* 1. Outer gear (Rotating Outer) */}
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: rotationOuter }] }]}>
        <Svg viewBox="0 0 100 100" width="100%" height="100%">
          <Polygon
            points={pointsOuterSpikes}
            fill="none"
            stroke={primaryColor}
            strokeWidth="0.75"
            strokeOpacity={0.3}
          />
        </Svg>
      </Animated.View>

      {/* 2. Main Polygon (Rotating Inner) */}
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: rotationInner }] }]}>
        <Svg viewBox="0 0 100 100" width="100%" height="100%">
          <Polygon
            points={pointsMainPoly}
            fill="none"
            stroke={primaryColor}
            strokeWidth="1.5"
            strokeOpacity={0.85}
          />
        </Svg>
      </Animated.View>

      {/* 3. Static Rings and Boundaries */}
      <View style={StyleSheet.absoluteFill}>
        <Svg viewBox="0 0 100 100" width="100%" height="100%">
          {/* Outermost border */}
          <Circle
            cx="50"
            cy="50"
            r="48"
            fill="none"
            stroke={primaryColor}
            strokeWidth="0.5"
            strokeOpacity={0.15}
          />
          {/* Middle Ring */}
          <Circle
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke={primaryColor}
            strokeWidth="0.75"
            strokeOpacity={0.5}
            strokeDasharray={innerRingType === 1 ? [3, 3] : innerRingType === 2 ? [12, 3, 3, 3] : undefined}
          />
        </Svg>
      </View>

      {/* 4. Internal Polygon (Rotating Outer) */}
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: rotationOuter }] }]}>
        <Svg viewBox="0 0 100 100" width="100%" height="100%">
          <Polygon
            points={pointsInnerPoly}
            fill="none"
            stroke={primaryColor}
            strokeWidth="1"
            strokeOpacity={0.7}
          />
        </Svg>
      </Animated.View>

      {/* 5. Orbital Beads (Rotating Outer) */}
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: rotationOuter }] }]}>
        <Svg viewBox="0 0 100 100" width="100%" height="100%">
          {Array.from({ length: orbitsCount }).map((_, index) => {
            const orbitAngleOffset = (index * 2 * Math.PI) / orbitsCount;
            const cx = (50 + 40 * Math.cos(orbitAngleOffset)).toFixed(2);
            const cy = (50 + 40 * Math.sin(orbitAngleOffset)).toFixed(2);
            return (
              <Circle
                key={index}
                cx={cx}
                cy={cy}
                r="3"
                fill={primaryColor}
                opacity={0.9}
              />
            );
          })}
        </Svg>
      </Animated.View>

      {/* 6. Core Circle (Pulsing) */}
      <Animated.View style={{ width: size * 0.2, height: size * 0.2, transform: [{ scale: pulseAnim }] }}>
        <Svg viewBox="0 0 20 20" width="100%" height="100%">
          <Circle
            cx="10"
            cy="10"
            r="8"
            fill={`${primaryColor}15`}
            stroke={primaryColor}
            strokeWidth="1.5"
          />
        </Svg>
      </Animated.View>

    </View>
  );
};
export default ProceduralEmblem;
