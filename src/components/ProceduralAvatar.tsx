import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Rect, Polygon, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { CharacterProfile } from '../utils/progressionUtils';

interface ProceduralAvatarProps {
  profile: CharacterProfile;
  size?: number;
}

export const ProceduralAvatar: React.FC<ProceduralAvatarProps> = ({ profile, size = 180 }) => {
  const getSeedFromString = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const seed = getSeedFromString((profile.id || '') + (profile.accountCreated || ''));
  const userLevel = Math.floor(profile.xp / 1000) + 1;

  const hasCompletedHabit = profile.stats.consistency > 40 || profile.xp > 500;
  const hasTitleEarned = profile.earnedTitles.length > 4 || profile.title !== 'The Forgotten Wanderer';

  const glowPulseDuration = 2.5 + (seed % 3);
  const accentColor = '#c89e5c'; // gold
  const alertColor = '#dc2626'; // blood red

  // Animations
  const rotateClockwise = useRef(new Animated.Value(0)).current;
  const rotateCounter = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Clockwise Rotation
    const clockwiseLoop = Animated.loop(
      Animated.timing(rotateClockwise, {
        toValue: 1,
        duration: 40000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    clockwiseLoop.start();

    // Counter Clockwise Rotation
    const counterLoop = Animated.loop(
      Animated.timing(rotateCounter, {
        toValue: 1,
        duration: 25000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    counterLoop.start();

    // Pulse
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: glowPulseDuration * 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: glowPulseDuration * 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // Float
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: -1,
          duration: 3500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    floatLoop.start();

    return () => {
      clockwiseLoop.stop();
      counterLoop.stop();
      pulseLoop.stop();
      floatLoop.stop();
    };
  }, [glowPulseDuration]);

  // Interpolations
  const spinClockwise = rotateClockwise.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spinCounter = rotateCounter.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  const spinBeads = rotateClockwise.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'], // orbit loop for beads
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.45],
  });

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.93, 1.07],
  });

  const floatY = floatAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-3, 3],
  });

  const floatYReverse = floatAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [3, -3],
  });

  return (
    <View style={{ width: size, height: size, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
      
      {/* Background radial glow */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: pulseOpacity }]}>
        <Svg viewBox="0 0 120 120" width="100%" height="100%">
          <Circle cx="60" cy="60" r="40" fill={accentColor} />
        </Svg>
      </Animated.View>

      {/* Outer rotating ring (dash array 4 8) */}
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: spinClockwise }] }]}>
        <Svg viewBox="0 0 120 120" width="100%" height="100%">
          <Circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={accentColor}
            strokeWidth="0.5"
            strokeOpacity={0.1}
            strokeDasharray={[4, 8]}
          />
        </Svg>
      </Animated.View>

      {/* Tier 2+ counter-rotating ring (dash array 18 4) */}
      {userLevel >= 15 && (
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: spinCounter }] }]}>
          <Svg viewBox="0 0 120 120" width="100%" height="100%">
            <Circle
              cx="60"
              cy="60"
              r="48"
              fill="none"
              stroke={accentColor}
              strokeWidth="0.75"
              strokeOpacity={0.15}
              strokeDasharray={[18, 4]}
            />
          </Svg>
        </Animated.View>
      )}

      {/* Orbiting Habit Completed Nodes */}
      {hasCompletedHabit && (
        <>
          {/* Static guideline path */}
          <View style={StyleSheet.absoluteFill}>
            <Svg viewBox="0 0 120 120" width="100%" height="100%">
              <Circle
                cx="60"
                cy="60"
                r="44"
                fill="none"
                stroke={accentColor}
                strokeWidth="0.5"
                strokeOpacity={0.25}
                strokeDasharray={[2, 12]}
              />
            </Svg>
          </View>
          {/* Orbiting structure */}
          <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: spinBeads }] }]}>
            <Svg viewBox="0 0 120 120" width="100%" height="100%">
              <Circle cx="60" cy="16" r="2.5" fill="#dc2626" stroke={accentColor} strokeWidth="0.5" />
              <Circle cx="22" cy="82" r="2.5" fill="#dc2626" stroke={accentColor} strokeWidth="0.5" />
              <Circle cx="98" cy="82" r="2.5" fill="#dc2626" stroke={accentColor} strokeWidth="0.5" />
              <Line x1="60" y1="16" x2="22" y2="82" stroke="#dc2626" strokeWidth="0.25" strokeOpacity={0.25} />
              <Line x1="22" y1="82" x2="98" y2="82" stroke="#dc2626" strokeWidth="0.25" strokeOpacity={0.25} />
              <Line x1="98" y1="82" x2="60" y2="16" stroke="#dc2626" strokeWidth="0.25" strokeOpacity={0.25} />
            </Svg>
          </Animated.View>
        </>
      )}

      {/* Floating Shard Runestones */}
      {hasTitleEarned && (
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: spinCounter }] }]}>
          <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: floatY }] }]}>
            <Svg viewBox="0 0 120 120" width="100%" height="100%">
              <Rect x="35" y="32" width="3" height="3" transform="rotate(45 36.5 33.5)" fill={accentColor} opacity={0.6} />
              <Rect x="82" y="85" width="3" height="3" transform="rotate(45 83.5 86.5)" fill={accentColor} opacity={0.6} />
            </Svg>
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: floatYReverse }] }]}>
            <Svg viewBox="0 0 120 120" width="100%" height="100%">
              <Rect x="82" y="32" width="3" height="3" transform="rotate(45 83.5 33.5)" fill={accentColor} opacity={0.6} />
              <Rect x="35" y="85" width="3" height="3" transform="rotate(45 36.5 86.5)" fill={accentColor} opacity={0.6} />
            </Svg>
          </Animated.View>
        </Animated.View>
      )}

      {/* Primary Citadel/Remnant Layers */}
      <View style={StyleSheet.absoluteFill}>
        {userLevel < 15 ? (
          // ================= Tier 1: Small Ruin Fragment (Level < 15) =================
          <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: floatY }] }]}>
            <Svg viewBox="0 0 120 120" width="100%" height="100%">
              {/* Unstable base */}
              <Path d="M35,75 L85,75 L75,82 L45,82 Z" fill="#2e323e" stroke="#42495b" strokeWidth="1" />
              {/* Broken left column */}
              <Rect x="42" y="52" width="8" height="23" fill="#181a20" stroke="#2e323e" strokeWidth="1" />
              <Path d="M40,52 L52,52 L48,49 L44,49 Z" fill="#2e323e" stroke="#42495b" strokeWidth="0.75" />
              {/* Center glowing core stone */}
              <Circle cx="60" cy="62" r="4" fill={accentColor} opacity={0.7} />
            </Svg>
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: floatYReverse }] }]}>
              <Svg viewBox="0 0 120 120" width="100%" height="100%">
                {/* Floating rubble block */}
                <Polygon points="76,46 82,43 79,51 73,49" fill="#2e323e" stroke="#42495b" strokeWidth="0.75" />
              </Svg>
            </Animated.View>
          </Animated.View>
        ) : userLevel < 30 ? (
          // ================= Tier 2: Partial Temple with Arches & Portal (Level 15-29) =================
          <View style={StyleSheet.absoluteFill}>
            <Svg viewBox="0 0 120 120" width="100%" height="100%">
              <Defs>
                <LinearGradient id="portalGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0" stopColor="#c89e5c" stopOpacity="0.8" />
                  <Stop offset="0.5" stopColor="#dc2626" stopOpacity="0.4" />
                  <Stop offset="1" stopColor="#0a0b0d" stopOpacity="0.9" />
                </LinearGradient>
              </Defs>
              {/* Portal Background */}
              <Circle cx="60" cy="53" r="18" fill="url(#portalGlow)" opacity={0.35} />
              {/* Pediment Foundation Base */}
              <Path d="M25,82 L95,82 L90,88 L30,88 Z" fill="#111216" stroke="#2e323e" strokeWidth="1.25" />
              <Path d="M28,78 L92,78 L90,82 L30,82 Z" fill="#181a20" stroke="#42495b" strokeWidth="0.75" />
              {/* Columns */}
              <Rect x="34" y="44" width="6" height="34" fill="#181a20" stroke="#2e323e" strokeWidth="1" />
              <Rect x="80" y="44" width="6" height="34" fill="#181a20" stroke="#2e323e" strokeWidth="1" />
              {/* Capitals */}
              <Rect x="32" y="40" width="10" height="4" fill="#2d313c" stroke="#42495b" strokeWidth="0.75" />
              <Rect x="78" y="40" width="10" height="4" fill="#2d313c" stroke="#42495b" strokeWidth="0.75" />
              {/* Arch Roof */}
              <Path d="M30,40 Q60,18 90,40 L90,36 Q60,14 30,36 Z" fill="#2a2e39" stroke="#c89e5c" strokeWidth="1" />
            </Svg>
            {/* Center Levitating Core */}
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: pulseScale }] }]}>
              <Svg viewBox="0 0 120 120" width="100%" height="100%">
                <Polygon points="60,38 68,53 60,68 52,53" fill="none" stroke={accentColor} strokeWidth="1.5" />
              </Svg>
            </Animated.View>
          </View>
        ) : userLevel < 45 ? (
          // ================= Tier 3: Floating Architecture (Level 30-44) =================
          <View style={StyleSheet.absoluteFill}>
            {/* Rotating grid ring behind */}
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: spinClockwise }] }]}>
              <Svg viewBox="0 0 120 120" width="100%" height="100%">
                <Circle cx="60" cy="60" r="45" fill="none" stroke="#2e323e" strokeWidth="0.75" strokeDasharray={[40, 10, 5, 10]} />
              </Svg>
            </Animated.View>

            {/* Floating blocks */}
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: floatY }] }]}>
              <Svg viewBox="0 0 120 120" width="100%" height="100%">
                {/* Bottom floating tier */}
                <Path d="M32,74 L88,74 L82,80 L38,80 Z" fill="#111216" stroke="#2e323e" strokeWidth="1" />
                {/* Top Monolith */}
                <Polygon points="60,20 74,38 60,46 46,38" fill="#181a20" stroke={accentColor} strokeWidth="1.5" />
              </Svg>
            </Animated.View>

            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: floatYReverse }] }]}>
              <Svg viewBox="0 0 120 120" width="100%" height="100%">
                {/* Mid left */}
                <Polygon points="28,45 42,45 38,62 24,62" fill="#181a20" stroke="#42495b" strokeWidth="1" />
                {/* Mid right */}
                <Polygon points="78,45 92,45 96,62 82,62" fill="#181a20" stroke="#42495b" strokeWidth="1" />
                {/* Pulsing connections */}
                <Circle cx="60" cy="60" r="22" fill="none" stroke={accentColor} strokeWidth="0.5" strokeDasharray={[4, 4]} opacity={0.6} />
              </Svg>
            </Animated.View>

            {/* Radiant laser beam */}
            <View style={StyleSheet.absoluteFill}>
              <Svg viewBox="0 0 120 120" width="100%" height="100%">
                <Line x1="60" y1="32" x2="60" y2="76" stroke={accentColor} strokeWidth="2" strokeDasharray={[6, 2]} opacity={0.75} />
              </Svg>
            </View>
          </View>
        ) : (
          // ================= Tier 4: Massive Citadel Fortress (Level >= 45) =================
          <View style={StyleSheet.absoluteFill}>
            {/* Spinning grids */}
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: spinClockwise }] }]}>
              <Svg viewBox="0 0 120 120" width="100%" height="100%">
                <Circle cx="60" cy="60" r="40" fill="none" stroke={alertColor} strokeWidth="0.5" strokeOpacity={0.25} strokeDasharray={[5, 15, 2, 2]} />
              </Svg>
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: spinCounter }] }]}>
              <Svg viewBox="0 0 120 120" width="100%" height="100%">
                <Polygon points="60,11 102,53 60,95 18,53" fill="none" stroke="#2e323e" strokeWidth="0.5" strokeOpacity={0.5} />
              </Svg>
            </Animated.View>

            {/* Imposing multi-layered fortress base */}
            <Svg viewBox="0 0 120 120" width="100%" height="100%">
              <Path d="M15,85 L105,85 L100,92 L20,92 Z" fill="#0a0b0d" stroke="#2e323e" strokeWidth="1.5" />
              <Path d="M22,78 L98,78 L94,85 L26,85 Z" fill="#111216" stroke="#42495b" strokeWidth="1" />
              {/* Outer towers */}
              <Rect x="25" y="44" width="10" height="34" fill="#181a20" stroke="#2e323e" strokeWidth="1" />
              <Rect x="85" y="44" width="10" height="34" fill="#181a20" stroke="#2e323e" strokeWidth="1" />
              <Path d="M23,40 L37,40 L35,44 L25,44 Z" fill="#2d313c" stroke="#42495b" strokeWidth="1" />
              <Path d="M83,40 L97,40 L95,44 L85,44 Z" fill="#2d313c" stroke="#42495b" strokeWidth="1" />
              {/* Inner primary spire */}
              <Path d="M48,78 L72,78 L68,26 L52,26 Z" fill="#181a20" stroke={accentColor} strokeWidth="1.5" />
              <Path d="M54,58 C54,52 66,52 66,58 L66,78 L54,78 Z" fill="#111216" stroke="#42495b" strokeWidth="1" />
            </Svg>

            {/* Hovering crown pinnacle */}
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: floatY }] }]}>
              <Svg viewBox="0 0 120 120" width="100%" height="100%">
                <Polygon points="60,14 66,22 60,20 54,22" fill={accentColor} stroke={accentColor} strokeWidth="0.5" />
              </Svg>
            </Animated.View>

            {/* Glowing loops */}
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: pulseScale }] }]}>
              <Svg viewBox="0 0 120 120" width="100%" height="100%">
                <Circle cx="60" cy="58" r="14" fill="none" stroke={accentColor} strokeWidth="1.2" strokeOpacity={0.8} />
              </Svg>
            </Animated.View>

            {/* Star sparkles (Pulsing) */}
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: pulseAnim }]}>
              <Svg viewBox="0 0 120 120" width="100%" height="100%">
                <Circle cx="88" cy="28" r="1.5" fill="#fff" />
                <Circle cx="32" cy="72" r="1.5" fill="#fff" />
                <Circle cx="32" cy="28" r="1.5" fill="#fff" />
                <Circle cx="88" cy="72" r="1.5" fill="#fff" />
              </Svg>
            </Animated.View>
          </View>
        )}
      </View>

    </View>
  );
};
export default ProceduralAvatar;
