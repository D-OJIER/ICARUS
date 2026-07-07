import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import Svg, { G, Line, Path, Rect, Circle, Polygon, Ellipse } from 'react-native-svg';
import { Calendar as CalendarIcon, Award } from 'lucide-react-native';
import { DayContext } from '../utils/contextAwareEngine';
import { COLORS, FONTS, THEME_STYLES } from '../theme';

interface ProceduralRuinBannerProps {
  dayContext: DayContext;
  userLevel: number;
  streak: number;
}

export const ProceduralRuinBanner: React.FC<ProceduralRuinBannerProps> = ({
  dayContext,
  userLevel,
  streak,
}) => {
  const { season, specialOccasion, historicalSignificance, campaignProgress } = dayContext;

  const hashString = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const seed = hashString(dayContext.dateStr + userLevel + streak);
  const ruinTypeIndex = seed % 6;

  let activeColor = COLORS.gothicGold;

  if (season === 'Winter') activeColor = '#60a5fa';
  else if (season === 'Spring') activeColor = '#34d399';
  else if (season === 'Summer') activeColor = '#fb923c';
  else if (season === 'Autumn') activeColor = '#fb7185';

  if (specialOccasion === "The Day of Inception") activeColor = '#ecc94b';
  else if (specialOccasion === "The Midwinter Sanctuary") activeColor = '#f97316';
  else if (specialOccasion === "The Festival of Lantern Embers") activeColor = '#fbbf24';
  else if (specialOccasion === "New Year's Ascension") activeColor = '#f472b6';

  const baseRuins = [
    { title: 'The Spires of Cinder', lore: 'An ancient obsidian tower stands tall against the ashen heavens, its peak permanently burning with the remnants of ancient vows.' },
    { title: 'The Forgotten Tree-Shrine', lore: 'Eldritch roots twine around a pristine white marble altar, where lost spirits once whispered penances to the quiet sky.' },
    { title: 'The Sunk Monolithic Temple', lore: 'A collapsed temple half-devoured by living earth. Cracked steps lead down into glowing crystal veins.' },
    { title: 'The Astral Keyhole Gate', lore: 'A colossal keyhole arch levitates silently over an abyss. Rotating runic rings revolve dynamically around its path.' },
    { title: 'The Shattered Monolith', lore: 'A colossal stone obelisk split symmetrically in two, bound together solely by anti-gravity forces and Ley-lines.' },
    { title: 'The Defunct Observatory', lore: 'Giant concentric metal armillary arrays rest atop stone pillars, echoing the ancient mechanical paths of dead satellites.' }
  ];

  const targetRuin = baseRuins[ruinTypeIndex];

  let contextLoreNote = targetRuin.lore;
  if (specialOccasion) {
    contextLoreNote = `[${specialOccasion.toUpperCase()}] • ${historicalSignificance || ''} The physical laws of the ruins bend to reflect the day's alignment.`;
  } else {
    if (season === 'Winter') contextLoreNote += ` A heavy freeze grips the courtyard, challenging thine endurance.`;
    else if (season === 'Spring') contextLoreNote += ` Geometric green-life begins to sprout between the cracked basalt joints.`;
    else if (season === 'Summer') contextLoreNote += ` Radiational wave patterns hum from deep within, urging fast momentum.`;
    else if (season === 'Autumn') contextLoreNote += ` Leaves of pure carbon float silently from the canopy, demonstrating absolute balance.`;
  }

  // Animation drivers
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Spin animation
    const spin = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spin.start();

    // Floating animation
    const float = Animated.loop(
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
    float.start();

    // Pulsing animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => {
      spin.stop();
      float.stop();
      pulse.stop();
    };
  }, []);

  // Interpolations
  const rotateClockwise = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const rotateCounterClockwise = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  const translateY = floatAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-3, 3],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.9],
  });

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.15],
  });

  return (
    <View style={styles.bannerContainer}>
      
      {/* Ornate corner line accents */}
      <View style={[styles.cornerLine, { top: 0, left: 0, borderTopWidth: 1, borderLeftWidth: 1, borderColor: `${activeColor}80` }]} />
      <View style={[styles.cornerLine, { bottom: 0, right: 0, borderBottomWidth: 1, borderRightWidth: 1, borderColor: `${activeColor}80` }]} />

      {/* Info Section */}
      <View style={styles.infoSection}>
        <View style={styles.seasonRow}>
          <CalendarIcon size={12} color={activeColor} />
          <Text style={[styles.seasonText, { color: activeColor }]}>
            Horizon {season.toUpperCase()} • {dayContext.dateStr}
          </Text>
        </View>

        <Text style={[styles.ruinTitle, { color: activeColor }]}>{targetRuin.title}</Text>
        <Text style={styles.ruinLore}>{contextLoreNote}</Text>

        {/* Milestone HUD */}
        <View style={styles.hudRow}>
          <View style={styles.hudItem}>
            <Award size={12} color={COLORS.gothicSky} />
            <Text style={styles.hudText}>LEVEL <Text style={{ color: '#fff', fontWeight: 'bold' }}>{userLevel}</Text></Text>
          </View>
          <View style={styles.dot} />
          <View style={styles.hudItem}>
            <Text style={{ fontSize: 10 }}>🔥</Text>
            <Text style={styles.hudText}>STREAK <Text style={{ color: activeColor, fontWeight: 'bold' }}>{streak} DAYS</Text></Text>
          </View>
          {campaignProgress !== 'None' && (
            <>
              <View style={styles.dot} />
              <Text style={styles.hudText}>CRUSADE <Text style={{ color: COLORS.gothicSky, fontWeight: 'bold' }}>{campaignProgress}</Text></Text>
            </>
          )}
        </View>
      </View>

      {/* SVG Image Rendering */}
      <View style={[styles.svgSection, { borderColor: `${activeColor}40` }]}>
        <View style={styles.gridBg} />
        
        {/* Core dynamic ambient backlight */}
        <View style={[styles.backlight, { backgroundColor: activeColor }]} />

        {/* Dynamic layered SVG renders based on index */}
        <View style={StyleSheet.absoluteFill}>
          {ruinTypeIndex === 0 && (
            <Svg viewBox="0 0 200 150" width="100%" height="100%">
              <Line x1="20" y1="125" x2="180" y2="125" stroke={activeColor} strokeWidth="1" strokeOpacity={0.4} />
              <Path d="M40,125 L160,125 L150,130 L50,130 Z" fill={COLORS.gothicDark} stroke={activeColor} strokeWidth="0.75" />
              <Path d="M75,125 L85,45 L115,45 L125,125 Z" fill={COLORS.gothicCard} stroke={activeColor} strokeWidth="1.5" />
              <Line x1="83" y1="65" x2="117" y2="65" stroke={activeColor} strokeWidth="0.75" strokeOpacity={0.5} />
              <Line x1="80" y1="92" x2="120" y2="92" stroke={activeColor} strokeWidth="0.75" strokeOpacity={0.5} />
              <Line x1="77" y1="110" x2="123" y2="110" stroke={activeColor} strokeWidth="0.75" strokeOpacity={0.5} />
              <Path d="M85,50 C100,60 120,45 115,70 C100,80 80,73 83,100 C110,110 125,95 120,125" fill="none" stroke={activeColor} strokeWidth="0.75" strokeDasharray={[3, 3]} />
              <Rect x="96" y="72" width="8" height="12" rx="4" fill="#0c0d10" stroke={activeColor} strokeWidth="0.75" />
              {/* Spinning / Pulsing Core ember */}
              <Circle cx="100" cy="78" r="2.5" fill={activeColor} opacity={0.8} />
            </Svg>
          )}

          {ruinTypeIndex === 1 && (
            <Svg viewBox="0 0 200 150" width="100%" height="100%">
              <Line x1="20" y1="125" x2="180" y2="125" stroke={activeColor} strokeWidth="1" strokeOpacity={0.4} />
              <Path d="M40,125 Q65,105 70,80 Q75,95 85,125" fill="none" stroke={activeColor} strokeWidth="1.5" />
              <Path d="M60,125 Q100,95 130,125" fill="none" stroke={activeColor} strokeWidth="1" />
              <Rect x="80" y="80" width="40" height="25" fill={COLORS.gothicCard} stroke={activeColor} strokeWidth="1.25" />
              <Rect x="76" y="75" width="48" height="6" fill={COLORS.gothicDark} stroke={activeColor} strokeWidth="0.75" />
            </Svg>
          )}

          {ruinTypeIndex === 2 && (
            <View style={StyleSheet.absoluteFill}>
              <Svg viewBox="0 0 200 150" width="100%" height="100%">
                <Path d="M20,105 Q100,117 180,105 L180,135 L20,135 Z" fill={COLORS.gothicVoid} stroke={activeColor} strokeWidth="1.25" />
                <Path d="M62,105 A38,38 0 0,1 138,105" fill="none" stroke={activeColor} strokeWidth="1.75" strokeDasharray={[15, 3]} />
              </Svg>
              <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: pulseScale }], opacity: pulseOpacity }]}>
                <Svg viewBox="0 0 200 150" width="100%" height="100%">
                  <Circle cx="100" cy="105" r="10" fill="none" stroke={activeColor} strokeWidth="1" />
                </Svg>
              </Animated.View>
            </View>
          )}

          {ruinTypeIndex === 3 && (
            <View style={StyleSheet.absoluteFill}>
              <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: rotateClockwise }] }]}>
                <Svg viewBox="0 0 200 150" width="100%" height="100%">
                  <Circle cx="100" cy="75" r="28" fill="none" stroke={activeColor} strokeWidth="2" strokeDasharray={[30, 5, 10, 5]} />
                </Svg>
              </Animated.View>
              <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: rotateCounterClockwise }] }]}>
                <Svg viewBox="0 0 200 150" width="100%" height="100%">
                  <Circle cx="100" cy="75" r="20" fill="none" stroke={activeColor} strokeWidth="0.75" strokeDasharray={[4, 4]} />
                </Svg>
              </Animated.View>
              <Svg viewBox="0 0 200 150" width="100%" height="100%">
                <Line x1="50" y1="125" x2="50" y2="65" stroke={activeColor} strokeWidth="1" strokeOpacity={0.25} />
                <Line x1="150" y1="125" x2="150" y2="65" stroke={activeColor} strokeWidth="1" strokeOpacity="0.25" />
                <Path d="M96,75 L104,75 L106,92 L94,92 Z" fill={COLORS.gothicVoid} stroke={activeColor} strokeWidth="1" />
                <Circle cx="100" cy="71" r="5" fill={COLORS.gothicVoid} stroke={activeColor} strokeWidth="1" />
              </Svg>
            </View>
          )}

          {ruinTypeIndex === 4 && (
            <View style={StyleSheet.absoluteFill}>
              <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY }] }]}>
                <Svg viewBox="0 0 200 150" width="100%" height="100%">
                  <Polygon points="100,20 114,58 100,65 86,58" fill={COLORS.gothicCard} stroke={activeColor} strokeWidth="1.5" />
                </Svg>
              </Animated.View>
              <Svg viewBox="0 0 200 150" width="100%" height="100%">
                <Line x1="25" y1="125" x2="175" y2="125" stroke={activeColor} strokeWidth="1" strokeOpacity="0.4" />
                <Polygon points="100,125 112,100 100,95 88,100" fill={COLORS.gothicDark} stroke={activeColor} strokeWidth="1" />
                <Line x1="100" y1="68" x2="100" y2="95" stroke={activeColor} strokeWidth="1.5" strokeDasharray={[4, 2]} />
              </Svg>
            </View>
          )}

          {ruinTypeIndex === 5 && (
            <View style={StyleSheet.absoluteFill}>
              <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: rotateClockwise }] }]}>
                <Svg viewBox="0 0 200 150" width="100%" height="100%">
                  <Circle cx="100" cy="70" r="22" fill="none" stroke={activeColor} strokeWidth="0.75" strokeDasharray={[15, 3, 3, 3]} />
                </Svg>
              </Animated.View>
              <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: rotateCounterClockwise }] }]}>
                <Svg viewBox="0 0 200 150" width="100%" height="100%">
                  <Ellipse cx="100" cy="70" rx="22" ry="8" fill="none" stroke={activeColor} strokeWidth="1.5" />
                </Svg>
              </Animated.View>
              <Svg viewBox="0 0 200 150" width="100%" height="100%">
                <Line x1="20" y1="125" x2="180" y2="125" stroke={activeColor} strokeWidth="1" strokeOpacity="0.4" />
                <Path d="M42,125 C42,85 68,75 72,125" fill="none" stroke={activeColor} strokeWidth="1.25" strokeOpacity="0.5" />
                <Path d="M128,125 C132,75 158,85 158,125" fill="none" stroke={activeColor} strokeWidth="1.25" strokeOpacity="0.5" />
                <Line x1="78" y1="88" x2="122" y2="52" stroke={activeColor} strokeWidth="2" strokeOpacity="0.85" />
              </Svg>
            </View>
          )}
        </View>

        {/* 2. Seasonal Overlays */}
        <View style={StyleSheet.absoluteFill}>
          {season === 'Spring' && (
            <Svg viewBox="0 0 200 150" width="100%" height="100%">
              <Path d="M30,125 C30,90 45,70 70,60" fill="none" stroke={activeColor} strokeWidth="0.75" strokeDasharray={[3, 3]} />
              <Path d="M170,125 C170,90 155,70 130,60" fill="none" stroke={activeColor} strokeWidth="0.75" strokeDasharray={[3, 3]} />
              <Circle cx="70" cy="60" r="2" fill={activeColor} />
              <Circle cx="130" cy="60" r="2" fill={activeColor} />
            </Svg>
          )}

          {season === 'Summer' && (
            <View style={StyleSheet.absoluteFill}>
              <Svg viewBox="0 0 200 150" width="100%" height="100%">
                <Polygon points="12,125 15,40 18,125" fill={COLORS.gothicCard} stroke={activeColor} strokeWidth="0.75" />
                <Polygon points="188,125 185,40 182,125" fill={COLORS.gothicCard} stroke={activeColor} strokeWidth="0.75" />
              </Svg>
              <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: pulseScale }] }]}>
                <Svg viewBox="0 0 200 150" width="100%" height="100%">
                  <Circle cx="15" cy="40" r="1.5" fill={activeColor} />
                  <Circle cx="185" cy="40" r="1.5" fill={activeColor} />
                </Svg>
              </Animated.View>
            </View>
          )}

          {season === 'Autumn' && (
            <Svg viewBox="0 0 200 150" width="100%" height="100%">
              <Rect x="28" y="60" width="6" height="65" fill={COLORS.gothicDark} stroke={activeColor} strokeWidth="0.75" />
              <Rect x="166" y="60" width="6" height="65" fill={COLORS.gothicDark} stroke={activeColor} strokeWidth="0.75" />
              <Rect x="26" y="56" width="10" height="4" fill={COLORS.gothicCard} stroke={activeColor} strokeWidth="0.75" />
              <Rect x="164" y="56" width="10" height="4" fill={COLORS.gothicCard} stroke={activeColor} strokeWidth="0.75" />
            </Svg>
          )}

          {season === 'Winter' && (
            <Svg viewBox="0 0 200 150" width="100%" height="100%">
              <Rect x="15" y="121" width="170" height="4" fill="#1c1e24" stroke={activeColor} strokeWidth="1" />
              <Line x1="30" y1="123" x2="170" y2="123" stroke={activeColor} strokeWidth="0.5" strokeDasharray={[2, 4]} />
            </Svg>
          )}
        </View>

        {/* 3. Occasion overlays */}
        <View style={StyleSheet.absoluteFill}>
          {specialOccasion === "The Day of Inception" && (
            <View style={StyleSheet.absoluteFill}>
              <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: rotateClockwise }] }]}>
                <Svg viewBox="0 0 200 150" width="100%" height="100%">
                  <Circle cx="100" cy="20" r="3" fill="#fff" stroke={activeColor} strokeWidth="0.75" />
                  <Line x1="100" y1="75" x2="100" y2="20" stroke={activeColor} strokeWidth="0.5" strokeOpacity={0.2} />
                </Svg>
              </Animated.View>
              <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY }] }]}>
                <Svg viewBox="0 0 200 150" width="100%" height="100%">
                  <Polygon points="35,40 40,32 45,40 40,48" fill="none" stroke={activeColor} strokeWidth="0.75" />
                  <Polygon points="165,40 170,32 175,40 170,48" fill="none" stroke={activeColor} strokeWidth="0.75" />
                </Svg>
              </Animated.View>
            </View>
          )}

          {specialOccasion === "New Year's Ascension" && (
            <View style={StyleSheet.absoluteFill}>
              <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: rotateClockwise }] }]}>
                <Svg viewBox="0 0 200 150" width="100%" height="100%">
                  <Ellipse cx="100" cy="75" rx="55" ry="55" fill="none" stroke={activeColor} strokeWidth="0.5" strokeDasharray={[12, 18]} />
                </Svg>
              </Animated.View>
              <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: rotateCounterClockwise }] }]}>
                <Svg viewBox="0 0 200 150" width="100%" height="100%">
                  <Ellipse cx="100" cy="75" rx="51" ry="51" fill="none" stroke={activeColor} strokeWidth="0.5" strokeDasharray={[6, 30]} />
                </Svg>
              </Animated.View>
            </View>
          )}

          {specialOccasion === "The Midwinter Sanctuary" && (
            <Svg viewBox="0 0 200 150" width="100%" height="100%">
              <Path d="M45,125 A55,55 0 0,1 155,125" fill="none" stroke={activeColor} strokeWidth="0.75" strokeOpacity="0.5" strokeDasharray={[8, 8]} />
              <Polygon points="48,122 51,114 54,122" fill={activeColor} />
              <Polygon points="152,122 155,114 158,122" fill={activeColor} />
            </Svg>
          )}

          {specialOccasion === "The Festival of Lantern Embers" && (
            <Svg viewBox="0 0 200 150" width="100%" height="100%">
              <Line x1="100" y1="75" x2="30" y2="40" stroke={activeColor} strokeWidth="0.5" strokeOpacity={0.2} />
              <Line x1="100" y1="75" x2="170" y2="40" stroke={activeColor} strokeWidth="0.5" strokeOpacity="0.2" />
              <Line x1="100" y1="75" x2="50" y2="110" stroke={activeColor} strokeWidth="0.5" strokeOpacity="0.2" />
              <Line x1="100" y1="75" x2="150" y2="110" stroke={activeColor} strokeWidth="0.5" strokeOpacity="0.2" />
              <Line x1="100" y1="75" x2="100" y2="10" stroke={activeColor} strokeWidth="0.75" strokeOpacity="0.3" strokeDasharray={[4, 2]} />
            </Svg>
          )}
        </View>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    padding: 16,
    backgroundColor: COLORS.gothicCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gothicBorder,
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },
  cornerLine: {
    width: 16,
    height: 16,
    position: 'absolute',
  },
  infoSection: {
    flex: 1,
    width: '100%',
  },
  seasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  seasonText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: 'bold',
  },
  ruinTitle: {
    fontFamily: FONTS.cinzel,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  ruinLore: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.gray400,
    lineHeight: 14,
    textTransform: 'uppercase',
  },
  hudRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(46, 50, 62, 0.3)',
  },
  hudItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hudText: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gray500,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.gothicBorder,
  },
  svgSection: {
    width: 160,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  gridBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.15,
    borderWidth: 1,
    borderColor: '#2e323e',
  },
  backlight: {
    width: 96,
    height: 96,
    borderRadius: 48,
    opacity: 0.2,
    position: 'absolute',
  }
});
