import React, { useEffect, useMemo, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Circle, Rect, Polygon, Line, Path, G, Text as SvgText } from 'react-native-svg';
import { COLORS, FONTS } from '../theme';

interface DailyMonumentProps {
  date: Date;
  activeCampaignsCou: number;
  completedCampaignsCou: number;
  skillsCount: number;
  titlesCount: number;
  level: number;
  streak: number;
  season: 'Spring' | 'Summer' | 'Autumn' | 'Winter';
  specialOccasion: string | null;
  hasFailedCampaign: boolean;
  activeViewTab: string;
  activeViewLabel: string;
}

export const DailyMonument: React.FC<DailyMonumentProps> = ({
  date,
  activeCampaignsCou,
  completedCampaignsCou,
  skillsCount,
  titlesCount,
  level,
  streak,
  season,
  specialOccasion,
  hasFailedCampaign,
  activeViewTab,
  activeViewLabel,
}) => {
  const seedVal = useMemo(() => {
    const dateStr = date.toDateString();
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash + level * 10 + streak + skillsCount);
  }, [date, level, streak, skillsCount]);

  const tier = useMemo(() => {
    if (level < 3) return 'new';
    if (level < 6) return 'experienced';
    return 'high';
  }, [level]);

  const colors = useMemo(() => {
    let primary = '#e5c185';
    let glowColor = 'rgba(229, 193, 133, 0.6)';
    let secondary = '#38bdf8';
    
    if (specialOccasion) {
      if (specialOccasion.includes('Inception')) {
        primary = '#facc15';
        glowColor = 'rgba(250, 204, 21, 0.7)';
      } else if (specialOccasion.includes('Midwinter')) {
        primary = '#fb923c';
        glowColor = 'rgba(251, 146, 60, 0.7)';
        secondary = '#38bdf8';
      } else if (specialOccasion.includes('Lantern')) {
        primary = '#fde047';
        glowColor = 'rgba(253, 224, 71, 0.7)';
      } else if (specialOccasion.includes('New Year')) {
        primary = '#f472b6';
        glowColor = 'rgba(244, 114, 182, 0.7)';
      }
    } else {
      switch (season) {
        case 'Spring':
          primary = '#4ade80';
          glowColor = 'rgba(74, 222, 128, 0.6)';
          break;
        case 'Summer':
          primary = '#f97316';
          glowColor = 'rgba(249, 115, 22, 0.6)';
          secondary = '#fb7185';
          break;
        case 'Autumn':
          primary = '#f43f5e';
          glowColor = 'rgba(244, 63, 94, 0.6)';
          break;
        case 'Winter':
          primary = '#38bdf8';
          glowColor = 'rgba(56, 189, 248, 0.6)';
          secondary = '#c084fc';
          break;
      }
    }
    return { primary, glowColor, secondary };
  }, [season, specialOccasion]);

  const angleOffset = (seedVal % 180) - 90;
  const cx = 675;
  const cy = 90;

  // Animation values
  const rotateClockwise = useRef(new Animated.Value(0)).current;
  const rotateCounter = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Rotation Clockwise
    const spinCw = Animated.loop(
      Animated.timing(rotateClockwise, {
        toValue: 1,
        duration: 25000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spinCw.start();

    // Rotation Counter Clockwise
    const spinCcw = Animated.loop(
      Animated.timing(rotateCounter, {
        toValue: 1,
        duration: 35000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spinCcw.start();

    // Glow pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    // Levitating translation
    const levitate = Animated.loop(
      Animated.sequence([
        Animated.timing(translateAnim, {
          toValue: 2,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(translateAnim, {
          toValue: -2,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    levitate.start();

    // Core pulse scale
    const corePulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.15,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    corePulse.start();

    return () => {
      spinCw.stop();
      spinCcw.stop();
      pulse.stop();
      levitate.stop();
      corePulse.stop();
    };
  }, []);

  const spinCwDeg = rotateClockwise.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spinCcwDeg = rotateCounter.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  const floatY = translateAnim;

  // Render nodes based on skill count
  const renderSkillNodes = () => {
    const nodes = [];
    const count = Math.min(skillsCount, 12);
    for (let i = 0; i < count; i++) {
      const angle = (360 / Math.max(count, 1)) * i + angleOffset;
      const radius = 36 + (i * 2.5);
      const x = cx + radius * Math.cos((angle * Math.PI) / 180);
      const y = cy + radius * Math.sin((angle * Math.PI) / 180);

      nodes.push(
        <Circle
          key={`skill-node-${i}`}
          cx={x}
          cy={y}
          r="3.5"
          fill={colors.primary}
          stroke={colors.secondary}
          strokeWidth="1.2"
        />
      );
    }
    return nodes;
  };

  const formattedDateStr = useMemo(() => {
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [date]);

  return (
    <View style={styles.container}>
      
      {/* Corner indicators */}
      <View style={[styles.cornerIndicator, { top: 0, left: 0, borderTopWidth: 1, borderLeftWidth: 1, borderColor: `${colors.primary}40` }]} />
      <View style={[styles.cornerIndicator, { bottom: 0, right: 0, borderBottomWidth: 1, borderRightWidth: 1, borderColor: `${colors.primary}40` }]} />

      {/* Embedded Ambient Radial Halo glow backplate */}
      <Animated.View 
        style={[
          styles.glowBackplate, 
          { 
            backgroundColor: colors.primary,
            opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.25] })
          }
        ]} 
      />

      <View style={styles.svgWrapper}>
        <Svg viewBox="0 0 800 180" width="100%" height={120}>
          
          {/* ================= BACKGROUND SYSTEM GRID ================= */}
          <G stroke={colors.primary} strokeOpacity={0.25} strokeWidth="0.75">
            <Line x1="30" y1="25" x2="770" y2="25" />
            <Line x1="30" y1="60" x2="770" y2="60" />
            <Line x1="30" y1="120" x2="770" y2="120" />
            <Line x1="30" y1="155" x2="770" y2="155" />

            <Line x1="30" y1="25" x2="30" y2="155" />
            <Line x1="180" y1="25" x2="180" y2="155" />
            <Line x1="380" y1="25" x2="380" y2="155" />
            <Line x1="560" y1="25" x2="560" y2="155" />
            <Line x1="770" y1="25" x2="770" y2="155" />
          </G>

          {/* ================= GEOMETRICAL CONNECTIVE PATHWAYS ================= */}
          <G>
            <Line x1="30" y1="155" x2="560" y2="155" stroke={colors.primary} strokeWidth="1.5" strokeOpacity={0.75} />
            <Line x1="560" y1="155" x2="620" y2="115" stroke={colors.primary} strokeWidth="1.5" strokeOpacity={0.75} />

            <Line x1="30" y1="25" x2="560" y2="25" stroke={colors.primary} strokeWidth="1.5" strokeOpacity={0.75} />
            <Line x1="560" y1="25" x2="620" y2="65" stroke={colors.primary} strokeWidth="1.5" strokeOpacity={0.75} />

            <Line x1="180" y1="150" x2="180" y2="160" stroke={colors.primary} strokeWidth="1.5" />
            <Line x1="380" y1="150" x2="380" y2="160" stroke={colors.primary} strokeWidth="1.5" />
            <Line x1="560" y1="150" x2="560" y2="160" stroke={colors.primary} strokeWidth="1.5" />

            <SvgText x="35" y="19" fill="#ffffff" fillOpacity={0.95} fontWeight="bold" fontFamily={FONTS.mono} fontSize="10.5" letterSpacing={1}>
              [ COORDINATE.SYS_ACTIVE ]
            </SvgText>
            <SvgText x="185" y="19" fill="#ffffff" fillOpacity={0.95} fontWeight="bold" fontFamily={FONTS.mono} fontSize="10.5" letterSpacing={1}>
              [ ELEV_LVL {level} ]
            </SvgText>
            <SvgText x="385" y="19" fill="#ffffff" fillOpacity={0.95} fontWeight="bold" fontFamily={FONTS.mono} fontSize="10.5" letterSpacing={1}>
              [ LINKED_SKILLS {skillsCount} ]
            </SvgText>
          </G>

          {/* ================= EMBEDDED TEXT LABELS ================= */}
          <G>
            <SvgText 
              x="40" 
              y="52" 
              fill={colors.primary} 
              fontFamily={FONTS.mono}
              fontWeight="900"
              fontSize="14" 
              letterSpacing={2}
            >
              {specialOccasion 
                ? `★ CELESTIAL ALIGNMENT • ${specialOccasion.toUpperCase()}`
                : `⎔ ${season.toUpperCase()} HORIZON • ${formattedDateStr.toUpperCase()}`
              }
            </SvgText>

            <SvgText 
              x="40" 
              y="108" 
              fill="#ffffff" 
              fontFamily={FONTS.cinzel}
              fontWeight="bold"
              fontSize="42" 
              letterSpacing={3}
            >
              {activeViewTab}
            </SvgText>

            {/* Bounding brackets around title */}
            <Path d="M 35 34 L 35 125" fill="none" stroke={colors.primary} strokeWidth="2" />
            <Path d="M 35 34 L 48 34" fill="none" stroke={colors.primary} strokeWidth="2" />
            <Path d="M 35 125 L 48 125" fill="none" stroke={colors.primary} strokeWidth="2" />

            <SvgText 
              x="40" 
              y="144" 
              fill="#ffffff" 
              fontFamily={FONTS.mono}
              fontWeight="900"
              fontSize="13" 
              letterSpacing={1}
            >
              {activeViewLabel.toUpperCase()}
            </SvgText>
          </G>

          {/* ================= THE GEOMETRIC DAILY MONUMENT PORTAL ================= */}
          {/* Static Backdrop circles inside Svg */}
          <G>
            <Circle cx={cx} cy={cy} r="78" fill="#0b0d12" fillOpacity="0.9" stroke={colors.primary} strokeWidth="1" strokeOpacity="0.55" />
            <Circle cx={cx} cy={cy} r="3.5" fill="#ffffff" stroke={colors.primary} strokeWidth="1" />
            
            {/* Level rings */}
            <Circle 
              cx={cx}
              cy={cy}
              r={54 + Math.min(level, 10) * 1.5}
              fill="none"
              stroke={colors.primary}
              strokeWidth="0.75"
              strokeOpacity={0.35}
            />
          </G>
        </Svg>

        {/* Orbiting skill nodes Layer */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg viewBox="0 0 800 180" width="100%" height={120}>
            {renderSkillNodes()}
          </Svg>
        </View>

        {/* Animated campaign rings */}
        {completedCampaignsCou > 0 && (
          <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: spinCwDeg }] }]} pointerEvents="none">
            <Svg viewBox="0 0 800 180" width="100%" height={120}>
              {Array.from({ length: Math.min(completedCampaignsCou, 4) }).map((_, i) => (
                <Circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={46 + i * 8.5}
                  fill="none"
                  stroke={colors.primary}
                  strokeWidth="1"
                  strokeOpacity={0.6}
                  strokeDasharray={[3, 6]}
                />
              ))}
            </Svg>
          </Animated.View>
        )}

        {/* Dynamic Tier structures */}
        {tier === 'new' && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Svg viewBox="0 0 800 180" width="100%" height={120}>
              <Line x1={cx} y1={cy + 30} x2={cx} y2={cy - 30} stroke={colors.primary} strokeWidth="2.5" />
              <Polygon points={`${cx},${cy - 40} ${cx + 6},${cy - 26} ${cx},${cy - 22} ${cx - 6},${cy - 26}`} fill="#181a20" stroke={colors.primary} strokeWidth="1" />
              <Rect x={cx - 15} y={cy + 30} width="30" height="5" fill="#111216" stroke={colors.primary} strokeWidth="1" />
              <Circle cx={cx} cy={cy} r="10" fill="none" stroke={colors.primary} strokeWidth="0.75" strokeDasharray={[2, 2]} />
            </Svg>
          </View>
        )}

        {tier === 'experienced' && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: spinCcwDeg }] }]}>
              <Svg viewBox="0 0 800 180" width="100%" height={120}>
                <Polygon
                  points={`${cx},${cy - 54} ${cx + 47},${cy - 26} ${cx + 47},${cy + 26} ${cx},${cy + 54} ${cx - 47},${cy + 26} ${cx - 47},${cy - 26}`}
                  fill="none"
                  stroke={colors.primary}
                  strokeWidth="1.25"
                  strokeDasharray={[8, 3]}
                />
              </Svg>
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: floatY }] }]}>
              <Svg viewBox="0 0 800 180" width="100%" height={120}>
                <Polygon points={`${cx},${cy - 22} ${cx + 17},${cy} ${cx},${cy + 22} ${cx - 17},${cy}`} fill="#181a20" stroke={colors.primary} strokeWidth="1.5" />
              </Svg>
            </Animated.View>
            <Svg viewBox="0 0 800 180" width="100%" height={120}>
              <Line x1={cx - 25} y1={cy + 36} x2={cx + 25} y2={cy + 36} stroke={colors.primary} strokeWidth="1" strokeOpacity={0.6} />
              <Line x1={cx} y1={cy - 30} x2={cx} y2={cy + 30} stroke={colors.primary} strokeWidth="0.75" strokeOpacity={0.45} />
              <Line x1={cx - 30} y1={cy} x2={cx + 30} y2={cy} stroke={colors.primary} strokeWidth="0.75" strokeOpacity={0.45} />
            </Svg>
          </View>
        )}

        {tier === 'high' && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: spinCwDeg }] }]}>
              <Svg viewBox="0 0 800 180" width="100%" height={120}>
                <Polygon points={`${cx},${cy - 52} ${cx + 26},${cy - 26} ${cx + 52},${cy} ${cx + 26},${cy + 26} ${cx},${cy + 52} ${cx - 26},${cy + 26} ${cx - 52},${cy} ${cx - 26},${cy - 26}`} fill="none" stroke={colors.primary} strokeWidth="1" strokeOpacity={0.6} />
              </Svg>
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: spinCcwDeg }] }]}>
              <Svg viewBox="0 0 800 180" width="100%" height={120}>
                <Polygon points={`${cx},${cy - 36} ${cx + 18},${cy - 18} ${cx + 36},${cy} ${cx + 18},${cy + 18} ${cx},${cy + 36} ${cx - 18},${cy + 18} ${cx - 36},${cy} ${cx - 18},${cy - 18}`} fill="none" stroke={colors.primary} strokeWidth="0.75" strokeOpacity={0.55} />
                <Circle cx={cx} cy={cy} r="34" fill="none" stroke={colors.primary} strokeWidth="0.75" strokeOpacity={0.45} strokeDasharray={[2, 3, 4, 3]} />
              </Svg>
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: pulseScale }] }]}>
              <Svg viewBox="0 0 800 180" width="100%" height={120}>
                <Polygon points={`${cx},${cy - 34} ${cx + 15},${cy} ${cx},${cy + 34} ${cx - 15},${cy}`} fill="#111216" stroke={colors.primary} strokeWidth="1.75" />
                <Circle cx={cx} cy={cy} r="6.5" fill={colors.secondary} />
              </Svg>
            </Animated.View>
            <Svg viewBox="0 0 800 180" width="100%" height={120}>
              <Line x1={cx - 42} y1={cy + 42} x2={cx + 42} y2={cy + 42} stroke={colors.primary} strokeWidth="1.5" />
              <Line x1={cx - 30} y1={cy + 47} x2={cx + 30} y2={cy + 47} stroke={colors.primary} strokeWidth="1" />
            </Svg>
          </View>
        )}

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: COLORS.gothicCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gothicBorder,
    overflow: 'hidden',
    position: 'relative',
    padding: 2,
    marginVertical: 10,
  },
  cornerIndicator: {
    width: 12,
    height: 12,
    position: 'absolute',
  },
  glowBackplate: {
    width: 180,
    height: 180,
    borderRadius: 90,
    position: 'absolute',
    right: 50,
    top: -10,
  },
  svgWrapper: {
    width: '100%',
    position: 'relative',
  }
});
export default DailyMonument;
