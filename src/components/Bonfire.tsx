import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Rect, Circle, Defs, LinearGradient, Stop, G, Polygon, Line } from 'react-native-svg';
import { soundEngine } from '../utils/audio';
import { COLORS, FONTS, THEME_STYLES } from '../theme';

interface BonfireProps {
  completedCount: number;
  activeCount: number;
  isResting: boolean;
  onRest: () => void;
  igniteTrigger: number;
}

export const Bonfire: React.FC<BonfireProps> = ({ 
  completedCount, 
  activeCount, 
  isResting, 
  onRest, 
  igniteTrigger 
}) => {
  const [hovered, setHovered] = useState(false);

  const total = completedCount + activeCount;
  const completionRatio = total > 0 ? (completedCount / total) : 0.5;
  const fireScaleFactor = isResting ? 1.4 : 0.85 + (completionRatio * 0.45);

  const handleInteract = () => {
    soundEngine.playClick();
    onRest();
  };

  // Animations
  const fireScaleAnim = useRef(new Animated.Value(fireScaleFactor)).current;
  const glowOpacityAnim = useRef(new Animated.Value(0.25)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;

  // Track fire scale changes
  useEffect(() => {
    Animated.timing(fireScaleAnim, {
      toValue: fireScaleFactor,
      duration: 800,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [fireScaleFactor]);

  // Glow pulse animation
  useEffect(() => {
    const pulseGlow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacityAnim, {
          toValue: isResting ? 0.55 : 0.25 * (0.5 + completionRatio * 0.5) + 0.1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacityAnim, {
          toValue: isResting ? 0.35 : 0.15 * (0.5 + completionRatio * 0.5),
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseGlow.start();
    return () => pulseGlow.stop();
  }, [isResting, completionRatio]);

  // Ignite flash trigger
  useEffect(() => {
    if (igniteTrigger > 0) {
      flashAnim.setValue(0);
      Animated.sequence([
        Animated.timing(flashAnim, {
          toValue: 0.4,
          duration: 150,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(flashAnim, {
          toValue: 0,
          duration: 350,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [igniteTrigger]);

  // Render floating ash/ember particles
  const particleCount = isResting ? 20 : 8;
  const particles = Array.from({ length: particleCount });

  // Custom particle component for easy individual animations
  const EmberParticle = ({ index }: { index: number }) => {
    const floatAnim = useRef(new Animated.Value(0)).current;
    const leftOffset = 30 + Math.random() * 40; // centered left percentage
    const size = Math.random() * 4 + 1.5;
    
    useEffect(() => {
      const delay = Math.random() * 3000;
      const duration = 3000 + Math.random() * 4000;
      
      const floatLoop = Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(floatAnim, {
            toValue: 1,
            duration: duration,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          })
        ])
      );
      floatLoop.start();
      return () => floatLoop.stop();
    }, []);

    const opacity = floatAnim.interpolate({
      inputRange: [0, 0.2, 0.8, 1],
      outputRange: [0, 0.8, 0.4, 0],
    });

    const translateY = floatAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [180, -40], // rises up
    });

    const translateX = floatAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 15 + Math.random() * 15, 30], // drifts sideways
    });

    return (
      <Animated.View
        style={[
          styles.ember,
          {
            left: `${leftOffset}%`,
            width: size,
            height: size,
            opacity: opacity,
            transform: [{ translateY }, { translateX }]
          }
        ]}
      />
    );
  };

  return (
    <View style={styles.container}>
      
      {/* Radial ambient glow layer */}
      <Animated.View 
        style={[
          styles.ambientGlow,
          { 
            backgroundColor: isResting ? COLORS.gothicGold : COLORS.gothicCrimson,
            opacity: glowOpacityAnim,
            transform: [{ scale: fireScaleAnim }]
          }
        ]}
      />

      {/* Floating Ash Particles */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {particles.map((_, i) => (
          <EmberParticle key={i} index={i} />
        ))}
      </View>

      {/* Vector Bonfire SVG */}
      <View style={styles.svgContainer}>
        <Svg viewBox="0 0 200 200" width="100%" height={220}>
          
          {/* Ash Mound */}
          <Path 
            d="M 50 170 Q 100 150 150 170 Q 170 175 180 180 Q 20 180 50 170 Z" 
            fill="#181a20" 
            stroke={COLORS.gothicBorder} 
            strokeWidth="2" 
          />
          <Path 
            d="M 65 174 Q 100 162 135 174" 
            fill="none" 
            stroke={COLORS.gothicGold} 
            strokeWidth="1.5" 
            opacity="0.3" 
          />

          {/* Hollow Knight Bench */}
          <G transform="translate(0, 10)">
            <Rect x="55" y="170" width="10" height="15" rx="2" fill="#111216" stroke={COLORS.gothicBorder} strokeWidth="1.5" />
            <Rect x="135" y="170" width="10" height="15" rx="2" fill="#111216" stroke={COLORS.gothicBorder} strokeWidth="1.5" />
            <Rect x="40" y="165" width="120" height="7" rx="2.5" fill="#181a20" stroke={COLORS.gothicBorder} strokeWidth="1.8" />
            <Path d="M 65 165 C 65 155, 75 150, 85 155 C 95 150, 105 150, 115 155 C 125 150, 135 155, 135 165" fill="none" stroke={COLORS.gothicBorder} strokeWidth="1.5" />
          </G>
        </Svg>

        {/* Animated Fire Flames Overlay */}
        <Animated.View style={[styles.flameOverlay, { transform: [{ scale: fireScaleAnim }] }]}>
          <Svg viewBox="0 0 200 200" width="100%" height={220}>
            <Defs>
              <LinearGradient id="fireGrad" x1="0" y1="1" x2="0" y2="0">
                <Stop offset="0" stopColor="#dc2626" stopOpacity="0.9" />
                <Stop offset="0.4" stopColor="#ea580c" stopOpacity="0.8" />
                <Stop offset="0.75" stopColor="#f59e0b" stopOpacity="0.75" />
                <Stop offset="1" stopColor="#fef08a" stopOpacity="0.1" />
              </LinearGradient>
            </Defs>
            
            {/* Outer flame */}
            <Path 
              d="M 100 45 C 120 75, 135 110, 130 160 C 130 160, 100 175, 70 160 C 65 110, 80 75, 100 45 Z" 
              fill="url(#fireGrad)" 
            />
            {/* Inner core flame */}
            <Path 
              d="M 100 70 C 112 90, 120 115, 118 160 C 118 160, 100 170, 82 160 C 80 115, 88 90, 100 70 Z" 
              fill="#fbbf24" 
              opacity="0.8" 
            />
            {/* White hot spirit core */}
            <Path 
              d="M 100 95 C 107 108, 112 125, 110 160 C 110 160, 100 166, 90 160 C 88 125, 93 108, 100 95 Z" 
              fill="#ffffff" 
              opacity="0.9" 
            />
          </Svg>
        </Animated.View>

        {/* Coiled Sword Layer */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg viewBox="0 0 200 200" width="100%" height={220}>
            <Defs>
              <LinearGradient id="swordGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#2e323e" />
                <Stop offset="0.5" stopColor="#c89e5c" />
                <Stop offset="1" stopColor="#dc2626" />
              </LinearGradient>
            </Defs>
            
            <G transform="translate(0, -5)">
              {/* Blade */}
              <Path 
                d="M 97 50 L 103 50 L 102 80 Q 94 95 104 110 T 96 140 L 98 170 L 102 170 L 104 140 Q 106 125 96 110 T 104 80 Z" 
                fill="url(#swordGrad)" 
                stroke="#0a0b0d" 
                strokeWidth="0.8" 
              />

              {/* Thorn crown */}
              <Path 
                d="M 85 92 Q 100 85 115 92 Q 105 100 85 92" 
                fill="none" 
                stroke="#a42c38" 
                strokeWidth="2.5" 
              />
              <Polygon points="90,88 92,83 94,88" fill="#a42c38" />
              <Polygon points="108,86 111,81 112,86" fill="#a42c38" />
              <Polygon points="100,94 99,99 97,94" fill="#a42c38" />

              {/* Sword Guard */}
              <Rect x="80" y="80" width="40" height="3" rx="1.5" fill="#181a20" stroke={COLORS.gothicGold} strokeWidth="1" />
              {/* Skull ornament hilt */}
              <Circle cx="100" cy="74" r="5.5" fill="#181a20" stroke={COLORS.gothicGold} strokeWidth="1.2" />
              <Circle cx="98" cy="74" r="1.2" fill="#000" />
              <Circle cx="102" cy="74" r="1.2" fill="#000" />
              {/* Hilt needle grip */}
              <Line x1="100" y1="68.5" x2="100" y2="52" stroke="#2e323e" strokeWidth="3" />
              <Line x1="100" y1="68" x2="100" y2="52" stroke={COLORS.gothicGold} strokeWidth="1" />
              
              {/* Pommel tip */}
              <Circle cx="100" cy="51" r="2.5" fill={COLORS.gothicGold} />
            </G>

            {/* Resting spiral overlay */}
            {isResting && (
              <Circle cx="100" cy="130" r="30" fill="none" stroke={COLORS.gothicGold} strokeWidth="1.5" strokeDasharray={[3, 3]} />
            )}
          </Svg>
        </View>

        {/* Resting button panel overlay */}
        <View style={styles.actionPanel}>
          <TouchableOpacity
            onPress={handleInteract}
            activeOpacity={0.8}
            style={[
              styles.restBtn,
              {
                borderColor: isResting ? COLORS.gothicGold : COLORS.gothicBorder,
                backgroundColor: isResting ? 'rgba(200, 158, 92, 0.15)' : 'rgba(17, 18, 22, 0.8)'
              }
            ]}
          >
            <Text style={[styles.restBtnText, { color: isResting ? COLORS.gothicGold : COLORS.gray300 }]}>
              {isResting ? '★ RESTING AT BENCH ★' : 'REST AT BONFIRE'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.restSubText}>
            {isResting ? 'Your penances align, soul tranquil' : 'Harken and meditate upon thy deeds'}
          </Text>
        </View>

      </View>

      {/* Screen flash on Ignite */}
      <Animated.View
        style={[
          styles.flashOverlay,
          {
            opacity: flashAnim
          }
        ]}
        pointerEvents="none"
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 280,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 11, 13, 0.4)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(46, 50, 62, 0.2)',
    position: 'relative',
    overflow: 'hidden',
  },
  ambientGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: 30,
    opacity: 0.25,
  },
  ember: {
    position: 'absolute',
    borderRadius: 99,
    backgroundColor: COLORS.gothicGold,
    bottom: 80,
  },
  svgContainer: {
    width: 250,
    height: 220,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flameOverlay: {
    ...StyleSheet.absoluteFillObject,
    transformOrigin: '100px 160px',
  },
  actionPanel: {
    position: 'absolute',
    bottom: -15,
    alignItems: 'center',
    width: '100%',
  },
  restBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  restBtnText: {
    fontFamily: FONTS.cinzel,
    fontWeight: 'bold',
    fontSize: 10,
    letterSpacing: 1,
  },
  restSubText: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gray500,
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.gothicGold,
  }
});
export default Bonfire;
