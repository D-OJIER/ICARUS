import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  StyleSheet, 
  Dimensions, 
  Platform 
} from 'react-native';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Moon, 
  ShieldAlert, 
  BookOpen, 
  Trash2,
  CheckCircle2,
  HelpCircle,
  Eye,
  Award,
  Sparkles,
  CalendarDays
} from 'lucide-react-native';
import { Quest } from '../types';
import { soundEngine } from '../utils/audio';
import { getLocalDateString } from '../utils/dateUtils';
import { COLORS, FONTS } from '../theme';

type CalendarView = 'Month' | 'Week' | 'Day';

interface GothicCalendarProps {
  quests: Quest[];
  onToggleQuest: (id: string) => void;
  onDeleteQuest: (id: string) => void;
  onSelectDate: (dateString: string) => void;
  onUpdateQuest?: (updatedQuest: Quest) => void;
  onNavigateToTab?: (tabName: 'The Path' | 'The Ascent' | 'The Chronicle' | 'The Codex' | 'The Wanderer') => void;
}

export const GothicCalendar: React.FC<GothicCalendarProps> = ({
  quests,
  onToggleQuest,
  onDeleteQuest,
  onSelectDate,
  onUpdateQuest,
  onNavigateToTab
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [view, setView] = useState<CalendarView>('Month');
  const [activeModalDate, setActiveModalDate] = useState<Date | null>(null);
  
  // Inspect Quest details state
  const [activeInspectedQuestId, setActiveInspectedQuestId] = useState<string | null>(null);
  const [editNotesText, setEditNotesText] = useState<string>('');
  const [editScheduleDate, setEditScheduleDate] = useState<string>('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January Moon', 'February Moon', 'March Moon', 'April Moon', 
    'May Moon', 'June Moon', 'July Moon', 'August Moon', 
    'September Moon', 'October Moon', 'November Moon', 'December Moon'
  ];

  const getQuestsForDate = (date: Date): Quest[] => {
    const targetStr = getLocalDateString(date);
    return quests.filter(q => q.dueDate === targetStr);
  };

  const handleNext = () => {
    soundEngine.playClick();
    if (view === 'Month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (view === 'Week') {
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(currentDate.getDate() + 7);
      setCurrentDate(nextWeek);
    } else {
      const nextDay = new Date(currentDate);
      nextDay.setDate(currentDate.getDate() + 1);
      setCurrentDate(nextDay);
    }
  };

  const handlePrev = () => {
    soundEngine.playClick();
    if (view === 'Month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (view === 'Week') {
      const prevWeek = new Date(currentDate);
      prevWeek.setDate(currentDate.getDate() - 7);
      setCurrentDate(prevWeek);
    } else {
      const prevDay = new Date(currentDate);
      prevDay.setDate(currentDate.getDate() - 1);
      setCurrentDate(prevDay);
    }
  };

  const handleToday = () => {
    soundEngine.playClick();
    setCurrentDate(new Date());
  };

  const getDaysInMonth = () => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Prev month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    // Next month padding
    const remainingGrids = 42 - days.length;
    for (let i = 1; i <= remainingGrids; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return days;
  };

  const monthDays = getDaysInMonth();

  const getDaysInWeek = (): Date[] => {
    const dayOfWeek = currentDate.getDay();
    const tempDate = new Date(currentDate);
    tempDate.setDate(currentDate.getDate() - dayOfWeek);
    
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(tempDate));
      tempDate.setDate(tempDate.getDate() + 1);
    }
    return week;
  };

  const weekDays = getDaysInWeek();

  const handleDaySelect = (date: Date) => {
    soundEngine.playClick();
    setActiveModalDate(date);
    onSelectDate(getLocalDateString(date));
    setActiveInspectedQuestId(null);
  };

  const handleToggleInspectQuest = (quest: Quest) => {
    soundEngine.playClick();
    if (activeInspectedQuestId === quest.id) {
      setActiveInspectedQuestId(null);
    } else {
      setActiveInspectedQuestId(quest.id);
      setEditNotesText(quest.description || '');
      setEditScheduleDate(quest.dueDate || '');
    }
  };

  const handleSaveNotes = (quest: Quest) => {
    soundEngine.playClick();
    if (onUpdateQuest) {
      onUpdateQuest({
        ...quest,
        description: editNotesText,
      });
    }
  };

  const handleSaveSchedule = (quest: Quest) => {
    soundEngine.playSlash();
    if (onUpdateQuest && editScheduleDate) {
      onUpdateQuest({
        ...quest,
        dueDate: editScheduleDate,
      });
      setTimeout(() => {
        soundEngine.playSoulsClaimed();
      }, 200);
    }
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={styles.container}>
      <View style={[styles.cornerLine, { top: 0, left: 10, right: 10, height: 1, backgroundColor: 'rgba(200, 158, 92, 0.15)' }]} />
      <View style={[styles.cornerLine, { bottom: 0, left: 10, right: 10, height: 1, backgroundColor: 'rgba(200, 158, 92, 0.15)' }]} />

      {/* Header controls */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.iconBg}>
            <CalendarIcon size={18} color={COLORS.gothicGold} />
          </View>
          <View>
            <Text style={styles.headerTitleText}>Liturgy Calendar of Hours</Text>
            <Text style={styles.headerSubtitleText}>Reflect upon thy scheduled covenants in sacred views</Text>
          </View>
        </View>

        <View style={styles.controlsRow}>
          <View style={styles.navGroup}>
            <TouchableOpacity onPress={handleToday} style={styles.navBtn}>
              <Text style={styles.navBtnText}>TODAY</Text>
            </TouchableOpacity>
            <View style={styles.navDivider} />
            <TouchableOpacity onPress={handlePrev} style={styles.navIconBtn}>
              <ChevronLeft size={14} color={COLORS.gray400} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNext} style={styles.navIconBtn}>
              <ChevronRight size={14} color={COLORS.gray400} />
            </TouchableOpacity>
          </View>

          <Text style={styles.moonTitle}>
            {monthNames[month].toUpperCase()} {year}
          </Text>

          <View style={styles.viewSelector}>
            {(['Month', 'Week', 'Day'] as CalendarView[]).map(v => {
              const active = view === v;
              return (
                <TouchableOpacity
                  key={v}
                  onPress={() => { soundEngine.playClick(); setView(v); }}
                  style={[styles.viewSelectorBtn, active && styles.viewSelectorBtnActive]}
                >
                  <Text style={[styles.viewSelectorText, active && { color: COLORS.gothicGold, fontWeight: 'bold' }]}>
                    {v.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* MONTH VIEW */}
      {view === 'Month' && (
        <View style={styles.monthGrid}>
          {/* Weekday headers */}
          <View style={styles.weekdaysRow}>
            {weekdays.map(d => (
              <Text key={d} style={styles.weekdayLabel}>{d.toUpperCase()}</Text>
            ))}
          </View>

          {/* Month grids wrapping */}
          <View style={styles.monthCellsContainer}>
            {monthDays.map(({ date, isCurrentMonth }, idx) => {
              const dateQuests = getQuestsForDate(date);
              const isToday = new Date().toDateString() === date.toDateString();
              
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleDaySelect(date)}
                  style={[
                    styles.monthCell,
                    isCurrentMonth ? styles.monthCellCurrent : styles.monthCellOutside,
                    isToday && styles.monthCellToday
                  ]}
                >
                  <View style={styles.cellHeader}>
                    <Text style={[
                      styles.cellNum, 
                      isToday ? styles.cellNumToday : (isCurrentMonth ? styles.cellNumCurrent : styles.cellNumOutside)
                    ]}>
                      {date.getDate()}
                    </Text>
                    
                    {dateQuests.length > 0 && (
                      <Text style={styles.cellCount}>
                        ⚔ {dateQuests.filter(q => q.completed).length}/{dateQuests.length}
                      </Text>
                    )}
                  </View>

                  {/* Cell dots for mobile display */}
                  <View style={styles.cellDotsRow}>
                    {dateQuests.slice(0, 3).map(q => (
                      <View 
                        key={q.id}
                        style={[
                          styles.cellDot,
                          q.completed 
                            ? { backgroundColor: COLORS.gothicGold } 
                            : q.difficulty === 'Mortal Penance'
                            ? { backgroundColor: COLORS.gothicCrimson }
                            : q.difficulty === 'Sinuous Vow'
                            ? { backgroundColor: COLORS.gothicGold }
                            : { backgroundColor: COLORS.gothicSky }
                        ]}
                      />
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* WEEK VIEW */}
      {view === 'Week' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.weekGrid}>
            {weekDays.map((date, idx) => {
              const dateQuests = getQuestsForDate(date);
              const isToday = new Date().toDateString() === date.toDateString();

              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleDaySelect(date)}
                  style={[styles.weekColCard, isToday && styles.weekColToday]}
                >
                  <View style={styles.weekColHeader}>
                    <Text style={styles.weekColDayName}>{date.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()}</Text>
                    <View style={[styles.weekColNumBg, isToday && styles.weekColNumBgToday]}>
                      <Text style={[styles.weekColNumText, isToday && { color: '#000', fontWeight: 'bold' }]}>
                        {date.getDate()}
                      </Text>
                    </View>
                  </View>

                  <ScrollView style={styles.weekColQuestsScroll} contentContainerStyle={{ gap: 4 }}>
                    {dateQuests.length > 0 ? (
                      dateQuests.map(q => (
                        <View
                          key={q.id}
                          style={[
                            styles.weekQuestBadge,
                            q.completed 
                              ? styles.weekQuestBadgeCompleted 
                              : q.difficulty === 'Mortal Penance'
                              ? styles.weekQuestBadgeHard
                              : q.difficulty === 'Sinuous Vow'
                              ? styles.weekQuestBadgeMedium
                              : styles.weekQuestBadgeEasy
                          ]}
                        >
                          <Text style={styles.weekQuestTitle} numberOfLines={1}>
                            {q.title}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <View style={styles.quietHourCard}>
                        <Text style={styles.quietHourText}>Quiet Hour</Text>
                      </View>
                    )}
                  </ScrollView>
                  <Text style={styles.weekColFooter}>SELECT DAY</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* DAY VIEW */}
      {view === 'Day' && (
        <View style={styles.dayGrid}>
          <View style={styles.dayHeaderBar}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <CalendarDays size={16} color={COLORS.gothicGold} />
              <View>
                <Text style={styles.dayHeaderBarTitle}>
                  {currentDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>
                <Text style={styles.dayHeaderBarSubtitle}>Daily hour chronometer cycles</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.dayLiturgyBtn} onPress={() => handleDaySelect(currentDate)}>
              <Text style={styles.dayLiturgyBtnText}>Open Liturgy Ledger</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.hourlyContainer}>
            {['06:00 Vigils', '09:00 Matins', '12:00 Sext', '15:00 None', '18:00 Vespers', '21:00 Compline'].map((hourString, idx) => {
              const dayQuests = getQuestsForDate(currentDate);
              const indexedQuests = dayQuests.filter((_, qIdx) => qIdx % 6 === idx);

              return (
                <View key={idx} style={styles.hourRow}>
                  <View style={styles.hourLabelCol}>
                    <Text style={styles.hourLabelNum}>{hourString.split(' ')[0]}</Text>
                    <Text style={styles.hourLabelName}>{hourString.split(' ').slice(1).join(' ').toUpperCase()}</Text>
                  </View>

                  <View style={styles.hourQuestsCol}>
                    {indexedQuests.length > 0 ? (
                      indexedQuests.map(q => (
                        <TouchableOpacity
                          key={q.id}
                          onPress={() => handleDaySelect(currentDate)}
                          style={[
                            styles.hourQuestItem,
                            q.completed 
                              ? styles.hourQuestCompleted 
                              : q.difficulty === 'Mortal Penance'
                              ? styles.hourQuestHard
                              : q.difficulty === 'Sinuous Vow'
                              ? styles.hourQuestMedium
                              : styles.hourQuestEasy
                          ]}
                        >
                          <Text style={styles.hourQuestTick}>{q.completed ? '✓' : '†'}</Text>
                          <Text style={[styles.hourQuestTitle, q.completed && { textDecorationLine: 'line-through', color: COLORS.gray600 }]} numberOfLines={1}>
                            {q.title}
                          </Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.perfectStillnessText}>Perfect Stillness</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* DETAIL MODAL POPUP */}
      {activeModalDate && (() => {
        const dateStr = getLocalDateString(activeModalDate);
        const allQuestsForDate = quests.filter(q => q.dueDate === dateStr);
        const todayStrValue = getLocalDateString(new Date());

        const completedList = allQuestsForDate.filter(q => q.completed);
        const pendingList = allQuestsForDate.filter(q => !q.completed && dateStr >= todayStrValue);
        const missedList = allQuestsForDate.filter(q => !q.completed && dateStr < todayStrValue);

        return (
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={[styles.modalCorner, { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 }]} />
              <View style={[styles.modalCorner, { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 }]} />
              <View style={[styles.modalCorner, { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 }]} />
              <View style={[styles.modalCorner, { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 }]} />

              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalHeaderTitle}>⚔ LITURGY LEDGER OF DEEDS</Text>
                  <Text style={styles.modalHeaderDate}>
                    {activeModalDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>
                <TouchableOpacity style={styles.modalHeaderClose} onPress={() => setActiveModalDate(null)}>
                  <Text style={styles.modalHeaderCloseText}>ESC</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ flex: 1, marginVertical: 12 }} showsVerticalScrollIndicator={false}>
                {/* 1. COMPLETED LIST */}
                <View style={styles.listSection}>
                  <Text style={styles.listSectionTitle}>In Communion Absolved ({completedList.length})</Text>
                  {completedList.length > 0 ? (
                    completedList.map(q => (
                      <View key={q.id} style={styles.modalQuestItem}>
                        <View style={styles.modalQuestRow}>
                          <TouchableOpacity onPress={() => onToggleQuest(q.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                            <CheckCircle2 size={14} color={COLORS.gothicGold} />
                            <Text style={styles.modalQuestTitleCompleted} numberOfLines={1}>{q.title}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleToggleInspectQuest(q)} style={styles.inspectIcon}>
                            <Eye size={12} color={COLORS.gray400} />
                          </TouchableOpacity>
                        </View>

                        {activeInspectedQuestId === q.id && (
                          <View style={styles.inspectPanel}>
                            <Text style={styles.inspectLabel}>📜 LORE & NOTES</Text>
                            <TextInput
                              value={editNotesText}
                              onChangeText={setEditNotesText}
                              multiline
                              style={styles.inspectNotesInput}
                            />
                            <TouchableOpacity style={styles.saveNotesBtn} onPress={() => handleSaveNotes(q)}>
                              <Text style={styles.saveNotesBtnText}>Save Inscription</Text>
                            </TouchableOpacity>

                            <View style={styles.inspectRescheduleRow}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.inspectLabel}>RESCHEDULE</Text>
                                <TextInput
                                  value={editScheduleDate}
                                  onChangeText={setEditScheduleDate}
                                  style={styles.inspectDateInput}
                                  placeholder="YYYY-MM-DD"
                                  placeholderTextColor={COLORS.gray700}
                                />
                              </View>
                              <TouchableOpacity style={styles.saveScheduleBtn} onPress={() => handleSaveSchedule(q)}>
                                <Text style={styles.saveNotesBtnText}>SHIFT</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    ))
                  ) : (
                    <Text style={styles.quietStatusText}>No covenants absolved today.</Text>
                  )}
                </View>

                {/* 2. PENDING LIST */}
                <View style={styles.listSection}>
                  <Text style={[styles.listSectionTitle, { color: COLORS.gothicSky }]}>Solemn Trials Pending ({pendingList.length})</Text>
                  {pendingList.length > 0 ? (
                    pendingList.map(q => (
                      <View key={q.id} style={styles.modalQuestItem}>
                        <View style={styles.modalQuestRow}>
                          <TouchableOpacity onPress={() => onToggleQuest(q.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                            <View style={styles.pendingIndicatorBox} />
                            <Text style={styles.modalQuestTitlePending} numberOfLines={1}>{q.title}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleToggleInspectQuest(q)} style={styles.inspectIcon}>
                            <Eye size={12} color={COLORS.gray400} />
                          </TouchableOpacity>
                        </View>

                        {activeInspectedQuestId === q.id && (
                          <View style={styles.inspectPanel}>
                            <Text style={styles.inspectLabel}>📜 LORE & NOTES</Text>
                            <TextInput
                              value={editNotesText}
                              onChangeText={setEditNotesText}
                              multiline
                              style={styles.inspectNotesInput}
                            />
                            <TouchableOpacity style={styles.saveNotesBtn} onPress={() => handleSaveNotes(q)}>
                              <Text style={styles.saveNotesBtnText}>Save Inscription</Text>
                            </TouchableOpacity>

                            <View style={styles.inspectRescheduleRow}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.inspectLabel}>RESCHEDULE</Text>
                                <TextInput
                                  value={editScheduleDate}
                                  onChangeText={setEditScheduleDate}
                                  style={styles.inspectDateInput}
                                  placeholder="YYYY-MM-DD"
                                  placeholderTextColor={COLORS.gray700}
                                />
                              </View>
                              <TouchableOpacity style={styles.saveScheduleBtn} onPress={() => handleSaveSchedule(q)}>
                                <Text style={styles.saveNotesBtnText}>SHIFT</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    ))
                  ) : (
                    <Text style={styles.quietStatusText}>No pending solemn requirements mapped.</Text>
                  )}
                </View>

                {/* 3. MISSED LIST */}
                <View style={styles.listSection}>
                  <Text style={[styles.listSectionTitle, { color: COLORS.gothicCrimson }]}>Corrupted / Missed Covenants ({missedList.length})</Text>
                  {missedList.length > 0 ? (
                    missedList.map(q => (
                      <View key={q.id} style={styles.modalQuestItem}>
                        <View style={styles.modalQuestRow}>
                          <TouchableOpacity onPress={() => onToggleQuest(q.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                            <ShieldAlert size={14} color={COLORS.gothicCrimson} />
                            <Text style={styles.modalQuestTitleMissed} numberOfLines={1}>{q.title}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleToggleInspectQuest(q)} style={styles.inspectIcon}>
                            <Eye size={12} color={COLORS.gray400} />
                          </TouchableOpacity>
                        </View>

                        {activeInspectedQuestId === q.id && (
                          <View style={styles.inspectPanel}>
                            <Text style={styles.inspectLabel}>📜 LORE & NOTES</Text>
                            <TextInput
                              value={editNotesText}
                              onChangeText={setEditNotesText}
                              multiline
                              style={styles.inspectNotesInput}
                            />
                            <TouchableOpacity style={styles.saveNotesBtn} onPress={() => handleSaveNotes(q)}>
                              <Text style={styles.saveNotesBtnText}>Save Inscription</Text>
                            </TouchableOpacity>

                            <View style={styles.inspectRescheduleRow}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.inspectLabel}>RESCHEDULE</Text>
                                <TextInput
                                  value={editScheduleDate}
                                  onChangeText={setEditScheduleDate}
                                  style={styles.inspectDateInput}
                                  placeholder="YYYY-MM-DD"
                                  placeholderTextColor={COLORS.gray700}
                                />
                              </View>
                              <TouchableOpacity style={styles.saveScheduleBtn} onPress={() => handleSaveSchedule(q)}>
                                <Text style={styles.saveNotesBtnText}>SHIFT</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    ))
                  ) : (
                    <Text style={[styles.quietStatusText, { borderLeftColor: COLORS.gothicCrimson }]}>
                      Clean record for today. Thy soul is free of broken bounds.
                    </Text>
                  )}
                </View>
              </ScrollView>

              {/* Modal Footer */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  onPress={() => {
                    soundEngine.playClick();
                    onSelectDate(dateStr);
                    setActiveModalDate(null);
                    if (onNavigateToTab) {
                      onNavigateToTab('The Path');
                    }
                  }}
                  style={styles.modalFooterInscribeBtn}
                >
                  <Text style={styles.modalFooterInscribeBtnText}>Inscribe New Vow For Date</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => { soundEngine.playClick(); setActiveModalDate(null); }}
                  style={styles.modalFooterCloseBtn}
                >
                  <Text style={styles.modalFooterCloseBtnText}>Close Ledger</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      })()}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.gothicCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gothicBorder,
    padding: 12,
    position: 'relative',
    marginVertical: 10,
  },
  cornerLine: {
    position: 'absolute',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 50, 62, 0.3)',
    paddingBottom: 12,
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBg: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(10, 11, 13, 0.8)',
    borderWidth: 1,
    borderColor: COLORS.gothicBorder,
  },
  headerTitleText: {
    fontFamily: FONTS.cinzel,
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.gothicGold,
    letterSpacing: 0.5,
  },
  headerSubtitleText: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gray500,
  },
  controlsRow: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 12,
  },
  navGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gothicDark,
    borderWidth: 1,
    borderColor: COLORS.gothicBorder,
    borderRadius: 8,
    padding: 2,
    alignSelf: 'flex-start',
  },
  navBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  navBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gray400,
    fontWeight: 'bold',
  },
  navDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(46, 50, 62, 0.4)',
    marginHorizontal: 4,
  },
  navIconBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  moonTitle: {
    fontFamily: FONTS.cinzel,
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.gothicGold,
    letterSpacing: 1.5,
    marginVertical: 4,
  },
  viewSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.gothicDark,
    borderWidth: 1,
    borderColor: COLORS.gothicBorder,
    borderRadius: 8,
    padding: 2,
  },
  viewSelectorBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  viewSelectorBtnActive: {
    backgroundColor: 'rgba(200, 158, 92, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(200, 158, 92, 0.2)',
  },
  viewSelectorText: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gray500,
  },
  monthGrid: {
    width: '100%',
  },
  weekdaysRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 50, 62, 0.2)',
    paddingBottom: 6,
    marginBottom: 6,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: COLORS.gray500,
  },
  monthCellsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  monthCell: {
    width: '13.3%',
    minHeight: 52,
    borderRadius: 8,
    borderWidth: 1,
    padding: 4,
    justifyContent: 'space-between',
  },
  monthCellCurrent: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderColor: COLORS.gothicBorder,
  },
  monthCellOutside: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(46, 50, 62, 0.1)',
  },
  monthCellToday: {
    borderColor: COLORS.gothicGold,
  },
  cellHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cellNum: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    width: 14,
    height: 14,
    textAlign: 'center',
    lineHeight: 14,
    borderRadius: 7,
  },
  cellNumToday: {
    backgroundColor: COLORS.gothicGold,
    color: '#000',
    fontWeight: 'bold',
  },
  cellNumCurrent: {
    color: COLORS.gray300,
  },
  cellNumOutside: {
    color: COLORS.gray700,
  },
  cellCount: {
    fontFamily: FONTS.mono,
    fontSize: 6.5,
    color: COLORS.gray500,
  },
  cellDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 2,
    marginTop: 4,
  },
  cellDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  weekGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  weekColCard: {
    width: 110,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(46, 50, 62, 0.3)',
    borderRadius: 12,
    padding: 8,
    minHeight: 180,
    justifyContent: 'space-between',
  },
  weekColToday: {
    backgroundColor: 'rgba(200, 158, 92, 0.05)',
    borderColor: COLORS.gothicGold,
  },
  weekColHeader: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 50, 62, 0.2)',
    paddingBottom: 6,
    marginBottom: 8,
  },
  weekColDayName: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    color: COLORS.gray500,
  },
  weekColNumBg: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  weekColNumBgToday: {
    backgroundColor: COLORS.gothicGold,
  },
  weekColNumText: {
    fontFamily: FONTS.mono,
    fontSize: 10.5,
    color: COLORS.gray300,
  },
  weekColQuestsScroll: {
    flex: 1,
  },
  weekQuestBadge: {
    padding: 4,
    borderRadius: 4,
    borderWidth: 0.5,
  },
  weekQuestBadgeCompleted: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderColor: COLORS.gothicBorder,
  },
  weekQuestBadgeHard: {
    backgroundColor: 'rgba(164, 44, 56, 0.1)',
    borderColor: 'rgba(164, 44, 56, 0.3)',
  },
  weekQuestBadgeMedium: {
    backgroundColor: 'rgba(200, 158, 92, 0.1)',
    borderColor: 'rgba(200, 158, 92, 0.3)',
  },
  weekQuestBadgeEasy: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  weekQuestTitle: {
    fontFamily: FONTS.cinzel,
    fontSize: 7.5,
    color: COLORS.gray300,
    textTransform: 'uppercase',
  },
  quietHourCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  quietHourText: {
    fontFamily: FONTS.mono,
    fontSize: 7,
    color: COLORS.gray600,
    textTransform: 'uppercase',
  },
  weekColFooter: {
    fontFamily: FONTS.mono,
    fontSize: 6.5,
    color: COLORS.gray600,
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  dayGrid: {
    width: '100%',
  },
  dayHeaderBar: {
    flexDirection: 'column',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: COLORS.gothicBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  dayHeaderBarTitle: {
    fontFamily: FONTS.cinzel,
    fontSize: 11.5,
    fontWeight: 'bold',
    color: COLORS.gothicGold,
    textTransform: 'uppercase',
  },
  dayHeaderBarSubtitle: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: COLORS.gray500,
    textTransform: 'uppercase',
  },
  dayLiturgyBtn: {
    backgroundColor: 'rgba(200, 158, 92, 0.15)',
    borderColor: 'rgba(200, 158, 92, 0.3)',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  dayLiturgyBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: COLORS.gothicGold,
    textTransform: 'uppercase',
  },
  hourlyContainer: {
    borderWidth: 1,
    borderColor: COLORS.gothicBorder,
    borderRadius: 12,
    overflow: 'hidden',
  },
  hourRow: {
    flexDirection: 'row',
    minHeight: 48,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(46, 50, 62, 0.2)',
  },
  hourLabelCol: {
    width: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRightWidth: 0.5,
    borderRightColor: 'rgba(46, 50, 62, 0.3)',
    padding: 8,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  hourLabelNum: {
    fontFamily: FONTS.mono,
    fontSize: 9.5,
    color: COLORS.gothicGold,
    fontWeight: 'bold',
  },
  hourLabelName: {
    fontFamily: FONTS.mono,
    fontSize: 7,
    color: COLORS.gray500,
    marginTop: 1,
  },
  hourQuestsCol: {
    flex: 1,
    padding: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  perfectStillnessText: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    color: COLORS.gray600,
    textTransform: 'uppercase',
  },
  hourQuestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.5,
  },
  hourQuestCompleted: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderColor: 'rgba(200, 158, 92, 0.1)',
  },
  hourQuestHard: {
    backgroundColor: 'rgba(164, 44, 56, 0.1)',
    borderColor: 'rgba(164, 44, 56, 0.25)',
  },
  hourQuestMedium: {
    backgroundColor: 'rgba(200, 158, 92, 0.1)',
    borderColor: 'rgba(200, 158, 92, 0.25)',
  },
  hourQuestEasy: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  hourQuestTick: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    color: COLORS.gothicGold,
  },
  hourQuestTitle: {
    fontFamily: FONTS.cinzel,
    fontSize: 8.5,
    color: COLORS.gray300,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 11, 13, 0.95)',
    zIndex: 2000,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 500,
    height: '80%',
    backgroundColor: COLORS.gothicCard,
    borderWidth: 1,
    borderColor: 'rgba(200, 158, 92, 0.3)',
    borderRadius: 16,
    padding: 16,
    position: 'relative',
  },
  modalCorner: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderColor: COLORS.gothicGold,
    opacity: 0.45,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 50, 62, 0.3)',
    paddingBottom: 10,
  },
  modalHeaderTitle: {
    fontFamily: FONTS.cinzel,
    fontSize: 11.5,
    fontWeight: 'bold',
    color: COLORS.gothicGold,
    letterSpacing: 0.5,
  },
  modalHeaderDate: {
    fontFamily: FONTS.mono,
    fontSize: 9.5,
    color: COLORS.gray300,
    marginTop: 2,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  modalHeaderClose: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.gothicBorder,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modalHeaderCloseText: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gray400,
  },
  listSection: {
    marginBottom: 16,
  },
  listSectionTitle: {
    fontFamily: FONTS.cinzel,
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.gothicGold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  quietStatusText: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gray600,
    fontStyle: 'italic',
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(46, 50, 62, 0.2)',
    textTransform: 'uppercase',
  },
  modalQuestItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 0.5,
    borderColor: COLORS.gothicBorder,
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
  },
  modalQuestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  modalQuestTitleCompleted: {
    fontFamily: FONTS.cinzel,
    fontSize: 10,
    color: 'rgba(200, 158, 92, 0.5)',
    textDecorationLine: 'line-through',
    textTransform: 'uppercase',
    flex: 1,
  },
  modalQuestTitlePending: {
    fontFamily: FONTS.cinzel,
    fontSize: 10,
    color: COLORS.gray300,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    flex: 1,
  },
  modalQuestTitleMissed: {
    fontFamily: FONTS.cinzel,
    fontSize: 10,
    color: COLORS.gothicCrimson,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    flex: 1,
  },
  pendingIndicatorBox: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.gothicSky,
  },
  inspectIcon: {
    padding: 4,
  },
  inspectPanel: {
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(46, 50, 62, 0.2)',
    marginTop: 8,
    paddingTop: 8,
    gap: 6,
  },
  inspectLabel: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    color: COLORS.gothicGold,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  inspectNotesInput: {
    width: '100%',
    height: 48,
    backgroundColor: COLORS.gothicDark,
    borderWidth: 1,
    borderColor: COLORS.gothicBorder,
    borderRadius: 6,
    paddingHorizontal: 8,
    color: COLORS.gray300,
    fontSize: 11,
    fontFamily: FONTS.sans,
    textAlignVertical: 'top',
  },
  saveNotesBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(200, 158, 92, 0.15)',
    borderColor: 'rgba(200, 158, 92, 0.3)',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  saveNotesBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    color: COLORS.gothicGold,
    textTransform: 'uppercase',
  },
  inspectRescheduleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(46, 50, 62, 0.1)',
    paddingTop: 8,
  },
  inspectDateInput: {
    height: 28,
    backgroundColor: COLORS.gothicDark,
    borderWidth: 1,
    borderColor: COLORS.gothicBorder,
    borderRadius: 4,
    paddingHorizontal: 8,
    color: '#fff',
    fontSize: 10.5,
    fontFamily: FONTS.mono,
    marginTop: 4,
  },
  saveScheduleBtn: {
    backgroundColor: 'rgba(200, 158, 92, 0.15)',
    borderColor: 'rgba(200, 158, 92, 0.3)',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(46, 50, 62, 0.3)',
    paddingTop: 10,
    marginTop: 8,
  },
  modalFooterInscribeBtn: {
    backgroundColor: 'rgba(200, 158, 92, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(200, 158, 92, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
  },
  modalFooterInscribeBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    color: COLORS.gothicGold,
    fontWeight: 'bold',
  },
  modalFooterCloseBtn: {
    backgroundColor: COLORS.gothicGold,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 4,
  },
  modalFooterCloseBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: '#000',
    fontWeight: 'bold',
  }
});
export default GothicCalendar;
