import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { BookOpen, Skull, Swords, Flame, Clock } from 'lucide-react-native';
import { Quest } from '../types';
import { ProceduralRuinBanner } from './ProceduralRuinBanner';
import { GothicQuestItem } from './GothicQuestItem';
import { getTodayLocalDateString } from '../utils/dateUtils';
import { DayContext } from '../utils/contextAwareEngine';
import { COLORS, FONTS } from '../theme';

interface JourneyTabProps {
  quests: Quest[];
  onCompleteQuest: (id: string) => void;
  onDeleteQuest: (id: string) => void;
  userLevel: number;
  streak: number;
  randomQuote: { text: string; author: string };
  dayContext: DayContext;
}

export const JourneyTab: React.FC<JourneyTabProps> = ({
  quests,
  onCompleteQuest,
  onDeleteQuest,
  userLevel,
  streak,
  randomQuote,
  dayContext
}) => {
  const todayStr = getTodayLocalDateString();

  const overdueQuests = quests.filter(q => !q.completed && q.dueDate && q.dueDate < todayStr);
  const todayQuests = quests.filter(q => q.dueDate === todayStr);
  const perpetualQuests = quests.filter(q => !q.dueDate && !q.completed);
  const completedTodayQuests = quests.filter(
    q => q.completed && (q.dueDate === todayStr || (!q.dueDate && q.createdAt?.startsWith(todayStr)))
  );

  const activeTodayPool = [...overdueQuests, ...todayQuests, ...perpetualQuests];

  const highPriority = activeTodayPool.filter(q => 
    (q.dueDate && q.dueDate < todayStr) || 
    q.difficulty === 'Mortal Penance'
  );

  const mediumPriority = activeTodayPool.filter(q => 
    q.dueDate === todayStr && 
    q.difficulty === 'Sinuous Vow'
  );

  const optionalPriority = activeTodayPool.filter(q => 
    (q.dueDate === todayStr && q.difficulty === 'Lesser Burden') ||
    (!q.dueDate)
  );

  const completedTodayList = completedTodayQuests;

  return (
    <ScrollView style={styles.viewport} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
      
      {/* 1. Daily Procedural Ancient Ruin Hero Banner */}
      <ProceduralRuinBanner 
        dayContext={dayContext}
        userLevel={userLevel}
        streak={streak}
      />

      {/* 2. Quote of the Hour Card */}
      <View style={styles.quoteCard}>
        <View style={[styles.corner, { top: 0, left: 0, borderTopWidth: 1, borderLeftWidth: 1 }]} />
        <View style={[styles.corner, { bottom: 0, right: 0, borderBottomWidth: 1, borderRightWidth: 1 }]} />
        
        <View style={styles.quoteHeader}>
          <BookOpen size={13} color={COLORS.gothicGold} />
          <Text style={styles.quoteTitle}>Liturgy of Penance</Text>
        </View>
        
        <Text style={styles.quoteText}>"{randomQuote.text}"</Text>
        <Text style={styles.quoteAuthor}>— {randomQuote.author}</Text>
      </View>

      {/* 3. Today's Agenda Panel */}
      <View style={styles.agendaCard}>
        <View style={styles.agendaHeader}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Swords size={13} color={COLORS.gothicGold} />
              <Text style={styles.agendaHeaderTitle}>TODAY'S SACRED AGENDA</Text>
            </View>
            <Text style={styles.agendaHeaderSubtitle}>
              Secure thy daily absolution, Ashen Knight. No future shadows are shown here.
            </Text>
          </View>
          <View style={styles.boundsBadge}>
            <Text style={styles.boundsBadgeText}>{activeTodayPool.length} Active Bounds</Text>
          </View>
        </View>

        <View style={styles.agendaContent}>
          {/* HIGH PRIORITY */}
          {highPriority.length > 0 && (
            <View style={styles.prioritySection}>
              <View style={[styles.priorityHeaderRow, { borderBottomColor: 'rgba(164, 44, 56, 0.15)' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Skull size={11} color={COLORS.gothicCrimson} />
                  <Text style={[styles.priorityTitle, { color: COLORS.gothicCrimson }]}>HIGH PRIORITY BOUNDS</Text>
                </View>
                <Text style={styles.priorityBadgeText}>{highPriority.length} Duty</Text>
              </View>
              <View style={styles.questItemsList}>
                {highPriority.map(q => (
                  <GothicQuestItem 
                    key={q.id}
                    quest={q}
                    onComplete={onCompleteQuest}
                    onDelete={onDeleteQuest}
                  />
                ))}
              </View>
            </View>
          )}

          {/* MEDIUM PRIORITY */}
          {mediumPriority.length > 0 && (
            <View style={styles.prioritySection}>
              <View style={[styles.priorityHeaderRow, { borderBottomColor: 'rgba(200, 158, 92, 0.15)' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Flame size={11} color={COLORS.gothicGold} />
                  <Text style={[styles.priorityTitle, { color: COLORS.gothicGold }]}>MEDIUM PRIORITY COVENANTS</Text>
                </View>
                <Text style={styles.priorityBadgeText}>{mediumPriority.length} Duty</Text>
              </View>
              <View style={styles.questItemsList}>
                {mediumPriority.map(q => (
                  <GothicQuestItem 
                    key={q.id}
                    quest={q}
                    onComplete={onCompleteQuest}
                    onDelete={onDeleteQuest}
                  />
                ))}
              </View>
            </View>
          )}

          {/* OPTIONAL */}
          {optionalPriority.length > 0 && (
            <View style={styles.prioritySection}>
              <View style={[styles.priorityHeaderRow, { borderBottomColor: 'rgba(56, 189, 248, 0.15)' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Clock size={11} color={COLORS.gothicSky} />
                  <Text style={[styles.priorityTitle, { color: COLORS.gothicSky }]}>OPTIONAL &amp; PERPETUAL DEVOTIONS</Text>
                </View>
                <Text style={styles.priorityBadgeText}>{optionalPriority.length} Duty</Text>
              </View>
              <View style={styles.questItemsList}>
                {optionalPriority.map(q => (
                  <GothicQuestItem 
                    key={q.id}
                    quest={q}
                    onComplete={onCompleteQuest}
                    onDelete={onDeleteQuest}
                  />
                ))}
              </View>
            </View>
          )}

          {/* COMPLETED TODAY */}
          {completedTodayList.length > 0 && (
            <View style={[styles.prioritySection, { opacity: 0.6 }]}>
              <View style={[styles.priorityHeaderRow, { borderBottomColor: 'rgba(46, 50, 62, 0.25)' }]}>
                <Text style={styles.completedTitle}>✦ ABSOLVED TODAY</Text>
                <Text style={styles.priorityBadgeText}>{completedTodayList.length} Absolved</Text>
              </View>
              <View style={styles.questItemsList}>
                {completedTodayList.map(q => (
                  <GothicQuestItem 
                    key={q.id}
                    quest={q}
                    onComplete={onCompleteQuest}
                    onDelete={onDeleteQuest}
                  />
                ))}
              </View>
            </View>
          )}

          {/* EMPTY STATE */}
          {activeTodayPool.length === 0 && completedTodayList.length === 0 && (
            <View style={styles.emptyCard}>
              <Skull size={32} color={COLORS.gray600} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>The altar finds absolute rest</Text>
              <Text style={styles.emptyDesc}>
                You have no active covenants, vows or overdue trials allocated for this hour-day of assessment. Return to the Forge to create a new crusade!
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Footer info */}
      <View style={styles.footer}>
        <Text style={styles.footerTitle}>† SORROWFUL BE THE HEART, PENITENT ASHEN KNIGHT †</Text>
        <Text style={styles.footerText}>
          ICARUS • STANDALONE MOBILE PROGRESSION ENGINE
        </Text>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    paddingHorizontal: 0,
  },
  quoteCard: {
    padding: 16,
    backgroundColor: COLORS.gothicCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gothicBorder,
    marginVertical: 12,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderColor: COLORS.gothicGold,
    opacity: 0.35,
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quoteTitle: {
    fontFamily: FONTS.cinzel,
    fontSize: 9.5,
    color: COLORS.gothicGold,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  quoteText: {
    fontFamily: FONTS.cinzel,
    fontSize: 12,
    color: COLORS.gray400,
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: 10,
  },
  quoteAuthor: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: COLORS.gothicGold,
    textAlign: 'right',
    textTransform: 'uppercase',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  agendaCard: {
    backgroundColor: COLORS.gothicCard,
    borderWidth: 1,
    borderColor: COLORS.gothicBorder,
    borderRadius: 16,
    padding: 16,
  },
  agendaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 50, 62, 0.25)',
    paddingBottom: 12,
    marginBottom: 16,
  },
  agendaHeaderTitle: {
    fontFamily: FONTS.cinzel,
    fontSize: 12.5,
    fontWeight: 'bold',
    color: COLORS.gothicGold,
    letterSpacing: 1,
  },
  agendaHeaderSubtitle: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: COLORS.gray500,
    textTransform: 'uppercase',
    marginTop: 4,
    lineHeight: 12,
  },
  boundsBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(46, 50, 62, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  boundsBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gray400,
    textTransform: 'uppercase',
  },
  agendaContent: {
    gap: 20,
  },
  prioritySection: {
    gap: 8,
  },
  priorityHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 4,
  },
  priorityTitle: {
    fontFamily: FONTS.cinzel,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  completedTitle: {
    fontFamily: FONTS.cinzel,
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.gray500,
    letterSpacing: 0.5,
  },
  priorityBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: COLORS.gray500,
    textTransform: 'uppercase',
  },
  questItemsList: {
    gap: 6,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(46, 50, 62, 0.4)',
    borderRadius: 12,
  },
  emptyTitle: {
    fontFamily: FONTS.cinzel,
    fontSize: 11.5,
    fontWeight: 'bold',
    color: COLORS.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyDesc: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gray600,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 260,
    lineHeight: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(46, 50, 62, 0.2)',
    marginTop: 20,
    gap: 4,
  },
  footerTitle: {
    fontFamily: FONTS.cinzel,
    fontSize: 8.5,
    color: '#8b8a85',
    letterSpacing: 0.5,
  },
  footerText: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    color: COLORS.gray600,
    letterSpacing: 1,
  }
});
export default JourneyTab;
