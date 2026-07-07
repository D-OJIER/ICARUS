import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Animated, 
  Easing, 
  StyleSheet, 
  LayoutAnimation, 
  Platform, 
  UIManager 
} from 'react-native';
import { ShieldAlert, Trash2, CheckCircle2, Circle, ChevronDown } from 'lucide-react-native';
import { Quest } from '../types';
import { soundEngine } from '../utils/audio';
import { COLORS, FONTS } from '../theme';

// Enable layout animation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface GothicQuestItemProps {
  quest: Quest;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

interface FloatingTextProps {
  text: string;
  onAnimComplete: () => void;
}

const FloatingText: React.FC<FloatingTextProps> = ({ text, onAnimComplete }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      onAnimComplete();
    });
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -45],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [1, 1, 0],
  });

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.25],
  });

  return (
    <Animated.Text
      style={[
        styles.floatingText,
        {
          transform: [{ translateY }, { scale }],
          opacity,
        }
      ]}
    >
      {text}
    </Animated.Text>
  );
};

// Shimmer Slash Helper
const SlashOverlay = () => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 400,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, []);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-250, 250],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View 
        style={[
          styles.shimmerSlash, 
          { 
            transform: [{ translateX }, { rotate: '-45deg' }] 
          }
        ]} 
      />
    </View>
  );
};

export const GothicQuestItem: React.FC<GothicQuestItemProps> = ({ 
  quest, 
  onComplete, 
  onDelete
}) => {
  const [slashing, setSlashing] = useState(false);
  const [floaters, setFloaters] = useState<{ id: number; text: string }[]>([]);
  const [floaterId, setFloaterId] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleComplete = () => {
    if (quest.completed || slashing) return;
    
    soundEngine.playSlash();
    setSlashing(true);

    const nextId = floaterId + 1;
    setFloaterId(nextId);
    
    let floatText = 'Absolved';
    if (quest.difficulty === 'Mortal Penance') floatText = 'Vow Fulfilled';
    if (quest.difficulty === 'Sinuous Vow') floatText = 'Trial Conquered';
    
    setFloaters(prev => [...prev, { id: nextId, text: floatText }]);

    setTimeout(() => {
      soundEngine.playSoulsClaimed();
      onComplete(quest.id);
      setSlashing(false);
    }, 450);
  };

  const handleDelete = () => {
    soundEngine.playClick();
    onDelete(quest.id);
  };

  const toggleExpand = () => {
    soundEngine.playClick();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const getDifficultyStyles = (diff: string) => {
    switch (diff) {
      case 'Mortal Penance':
        return { color: COLORS.gothicCrimson, borderColor: 'rgba(164, 44, 56, 0.4)', backgroundColor: 'rgba(164, 44, 56, 0.1)' };
      case 'Sinuous Vow':
        return { color: COLORS.gothicGold, borderColor: 'rgba(200, 158, 92, 0.4)', backgroundColor: 'rgba(200, 158, 92, 0.1)' };
      case 'Lesser Burden':
      default:
        return { color: COLORS.gothicSky, borderColor: 'rgba(56, 189, 248, 0.4)', backgroundColor: 'rgba(56, 189, 248, 0.1)' };
    }
  };

  const getCategorySymbol = (cat: string) => {
    switch (cat) {
      case 'Vow': return '⛧ Daily Vow';
      case 'Trial': return '⚔ Weekly Trial';
      case 'Crusade': return '♃ Epic Crusade';
      default: return '🕈 Duty';
    }
  };

  const isOverdue = quest.dueDate && new Date(quest.dueDate) < new Date() && !quest.completed;
  const daysLeft = quest.dueDate 
    ? Math.max(0, Math.ceil((new Date(quest.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  const diffStyle = getDifficultyStyles(quest.difficulty);

  return (
    <View 
      style={[
        styles.card,
        quest.completed 
          ? styles.cardCompleted 
          : isOverdue 
          ? styles.cardOverdue 
          : styles.cardActive
      ]}
    >
      
      {/* Slash Shimmer Effect overlay */}
      {slashing && <SlashOverlay />}

      {/* Floating text labels layer */}
      <View style={styles.floatersLayer} pointerEvents="none">
        {floaters.map(f => (
          <FloatingText 
            key={f.id} 
            text={f.text} 
            onAnimComplete={() => {
              setFloaters(prev => prev.filter(p => p.id !== f.id));
            }}
          />
        ))}
      </View>

      <View style={styles.row}>
        
        {/* Thorn Checkbox */}
        <TouchableOpacity
          onPress={handleComplete}
          disabled={quest.completed}
          style={styles.checkboxTouch}
        >
          {quest.completed ? (
            <View style={styles.completedCheckbox}>
              <CheckCircle2 size={18} color={COLORS.gothicGold} />
              <View style={styles.checkboxDot} />
            </View>
          ) : (
            <View style={styles.emptyCheckbox}>
              <Circle size={18} color={COLORS.gray500} />
              <Text style={styles.crossSymbol}>†</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Quest Info Section */}
        <TouchableOpacity 
          style={styles.infoTouch} 
          onPress={toggleExpand}
          activeOpacity={0.8}
        >
          <View style={styles.badgeRow}>
            <Text style={styles.categoryText}>{getCategorySymbol(quest.category)}</Text>
            
            <View style={[styles.diffBadge, { borderColor: diffStyle.borderColor, backgroundColor: diffStyle.backgroundColor }]}>
              <Text style={[styles.diffText, { color: diffStyle.color }]}>{quest.difficulty.toUpperCase()}</Text>
            </View>

            {isOverdue && (
              <View style={styles.overdueBadge}>
                <ShieldAlert size={10} color={COLORS.gothicCrimson} />
                <Text style={styles.overdueText}>DREAD OVERDUE</Text>
              </View>
            )}

            {daysLeft !== null && daysLeft <= 2 && !quest.completed && (
              <View style={styles.fadesBadge}>
                <Text style={styles.fadesText}>⏳ {daysLeft === 0 ? 'FADES TONIGHT' : `${daysLeft} days left`}</Text>
              </View>
            )}
          </View>

          <View style={styles.titleRow}>
            <Text 
              style={[
                styles.questTitle,
                quest.completed ? styles.titleCompleted : styles.titleActive
              ]}
              numberOfLines={2}
            >
              {quest.title}
            </Text>
            
            {(quest.description || quest.dueDate) ? (
              <ChevronDown 
                size={14} 
                color={isExpanded ? COLORS.gothicGold : COLORS.gray500} 
                style={isExpanded ? { transform: [{ rotate: '180deg' }] } : undefined}
              />
            ) : null}
          </View>

          {/* Expanded Block */}
          {isExpanded && (quest.description || quest.dueDate) && (
            <View style={styles.expandedContent}>
              {quest.description ? (
                <Text style={[styles.description, quest.completed ? { color: COLORS.gray700 } : { color: COLORS.gray400 }]}>
                  {quest.description}
                </Text>
              ) : null}

              {quest.dueDate && !quest.completed ? (
                <View style={styles.dueDateRow}>
                  <Text style={styles.dueDateHeader}>📅 JUDGMENT DUE:</Text>
                  <Text style={styles.dueDateText}>
                    {new Date(quest.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>
              ) : null}
            </View>
          )}

        </TouchableOpacity>

        {/* Obliterate/Purge button */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Trash2 size={14} color={COLORS.gray600} />
        </TouchableOpacity>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 4,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  cardActive: {
    backgroundColor: COLORS.gothicCard,
    borderColor: COLORS.gothicBorder,
  },
  cardCompleted: {
    backgroundColor: 'rgba(10, 11, 13, 0.4)',
    borderColor: 'rgba(46, 50, 62, 0.25)',
  },
  cardOverdue: {
    backgroundColor: 'rgba(164, 44, 56, 0.05)',
    borderColor: 'rgba(164, 44, 56, 0.3)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkboxTouch: {
    paddingRight: 8,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  completedCheckbox: {
    position: 'relative',
  },
  checkboxDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.gothicGold,
  },
  emptyCheckbox: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  crossSymbol: {
    position: 'absolute',
    fontSize: 8,
    color: COLORS.gray600,
    top: 5,
  },
  infoTouch: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  categoryText: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gray500,
    textTransform: 'uppercase',
  },
  diffBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  diffText: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(164, 44, 56, 0.2)',
    borderColor: 'rgba(164, 44, 56, 0.3)',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  overdueText: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    fontWeight: 'bold',
    color: COLORS.gothicCrimson,
  },
  fadesBadge: {
    backgroundColor: 'rgba(200, 158, 92, 0.1)',
    borderColor: 'rgba(200, 158, 92, 0.2)',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  fadesText: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    color: COLORS.gothicGold,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  questTitle: {
    fontFamily: FONTS.cinzel,
    fontSize: 13,
    letterSpacing: 0.5,
    flex: 1,
  },
  titleActive: {
    color: COLORS.gray300,
  },
  titleCompleted: {
    color: COLORS.gray600,
    textDecorationLine: 'line-through',
    fontStyle: 'italic',
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(46, 50, 62, 0.15)',
    marginTop: 6,
    paddingTop: 6,
  },
  description: {
    fontFamily: FONTS.sans,
    fontSize: 11.5,
    lineHeight: 16,
  },
  dueDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(46, 50, 62, 0.15)',
    marginTop: 8,
  },
  dueDateHeader: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: COLORS.gray400,
  },
  dueDateText: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gothicGold,
    fontWeight: 'bold',
  },
  deleteBtn: {
    padding: 6,
    marginLeft: 8,
    borderRadius: 8,
  },
  shimmerSlash: {
    position: 'absolute',
    width: 40,
    height: 300,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    top: -100,
  },
  floatersLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
  floatingText: {
    fontFamily: FONTS.cinzel,
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.gothicGold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  }
});
export default GothicQuestItem;
