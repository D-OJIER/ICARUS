import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  StyleSheet, 
  Dimensions, 
  ActivityIndicator,
  Alert,
  Modal,
  Platform
} from 'react-native';
import { 
  Volume2, 
  VolumeX, 
  Skull,
  BookOpen,
  LogOut,
  Compass, 
  Shield, 
  Calendar as CalendarIcon, 
  User,
  ShieldAlert, 
  Sparkles, 
  RefreshCw
} from 'lucide-react-native';
import { Quest, Goal, QuestDifficulty, QuestCategory, GOTHIC_QUOTES } from './types';
import { Bonfire } from './components/Bonfire';
import { GothicQuestItem } from './components/GothicQuestItem';
import { CreateQuestForm } from './components/CreateQuestForm';
import { GothicCalendar } from './components/GothicCalendar';
import { GothicProfile } from './components/GothicProfile';
import { soundEngine } from './utils/audio';
import { JourneyTab } from './components/JourneyTab';
import { CampaignsTab } from './components/CampaignsTab';
import { getCharacterProfile, saveCharacterProfile, rewardXp, addChronicleLog, purgePerfectGothicState, CharacterProfile, calculateActualStreak, calculateLongestStreak } from './utils/progressionUtils';
import { getLocalDateString, getTodayLocalDateString } from './utils/dateUtils';
import { calculateDayContext, getContextAwareQuote } from './utils/contextAwareEngine';
import { DailyMonument } from './components/DailyMonument';
import { IcarusAuthPortal } from './components/IcarusAuthPortal';
import { deleteGoal, deleteQuest, deleteQuests, purgeUserData, saveGoals, saveQuests, saveUserProfile, signOutOfSupabase } from './lib/supabase';
import { nativeStorage } from './utils/nativeStorage';
import { COLORS, FONTS } from './theme';

export default function App() {
  const [isStorageReady, setIsStorageReady] = useState(false);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  // Scoped lists states
  const [quests, setQuests] = useState<Quest[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [characterProfile, setCharacterProfile] = useState<CharacterProfile | null>(null);
  const [goalsStats, setGoalsStats] = useState({ total: 0, completed: 0 });

  // UI States
  const [activeCategory, setActiveCategory] = useState<QuestCategory | 'All'>('All');
  const [activeDifficulty, setActiveDifficulty] = useState<QuestDifficulty | 'All'>('All');
  const [isResting, setIsResting] = useState(false);
  const [igniteTrigger, setIgniteTrigger] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [randomQuote, setRandomQuote] = useState(() => GOTHIC_QUOTES[0]);
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<string>('');
  const [activeViewTab, setActiveViewTab] = useState<'The Path' | 'The Ascent' | 'The Chronicle' | 'The Codex' | 'The Wanderer'>('The Path');
  const [chronicleSearch, setChronicleSearch] = useState('');
  
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [resetConfirmationText, setResetConfirmationText] = useState('');

  const [timeframeFilter, setTimeframeFilter] = useState<'Today' | 'This Week' | 'This Month' | 'Full Cycle'>('Today');

  // 1. Storage gate load on app startup before App.tsx mounts
  useEffect(() => {
    async function loadStorage() {
      await nativeStorage.init();
      
      const savedUserStr = localStorage.getItem('gothic_current_user');
      if (savedUserStr) {
        const u = JSON.parse(savedUserStr);
        setCurrentUser(u);

        const savedQuests = localStorage.getItem('gothic_quests_' + u.id);
        if (savedQuests) setQuests(JSON.parse(savedQuests));
        else setQuests(u.quests || []);

        const savedGoals = localStorage.getItem('gothic_goals_' + u.id);
        if (savedGoals) setGoals(JSON.parse(savedGoals));
        else setGoals(u.goals || []);

        const savedProfile = localStorage.getItem('gothic_character_profile_' + u.id);
        if (savedProfile) setCharacterProfile(JSON.parse(savedProfile));
        else setCharacterProfile(u.characterProfile || getCharacterProfile());
      } else {
        setCharacterProfile(getCharacterProfile());
      }
      setIsStorageReady(true);
    }
    loadStorage();
  }, []);

  // Auth Portal Dynamic Login Handlers
  const handleLoginSuccess = (userData: any) => {
    localStorage.setItem('gothic_current_user', JSON.stringify(userData));
    
    const userQuests = localStorage.getItem('gothic_quests_' + userData.id);
    const resolvedQuests = userQuests ? JSON.parse(userQuests) : (userData.quests || []);
    setQuests(resolvedQuests);
    localStorage.setItem('gothic_quests_' + userData.id, JSON.stringify(resolvedQuests));

    const userGoals = localStorage.getItem('gothic_goals_' + userData.id);
    const resolvedGoals = userGoals ? JSON.parse(userGoals) : (userData.goals || []);
    setGoals(resolvedGoals);
    localStorage.setItem('gothic_goals_' + userData.id, JSON.stringify(resolvedGoals));

    const userProfile = localStorage.getItem('gothic_character_profile_' + userData.id);
    const resolvedProfile = userProfile ? JSON.parse(userProfile) : userData.characterProfile;
    setCharacterProfile(resolvedProfile);
    localStorage.setItem('gothic_character_profile_' + userData.id, JSON.stringify(resolvedProfile));
    
    setCurrentUser(userData);
  };

  const handleLogout = () => {
    soundEngine.playClick();
    localStorage.removeItem('gothic_current_user');
    setCurrentUser(null);
  };

  // Safe client-side persistence and secure background synchronizer triggers
  useEffect(() => {
    if (!currentUser || !isStorageReady) return;
    localStorage.setItem('gothic_quests_' + currentUser.id, JSON.stringify(quests));
    
    const timer = setTimeout(async () => {
      try {
        const userId = currentUser.id;
        await saveQuests(userId, quests);
      } catch (err) {
        console.warn("Background Supabase quests sync delay: ", err);
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [quests, currentUser, isStorageReady]);

  useEffect(() => {
    if (!currentUser || !isStorageReady) return;
    localStorage.setItem('gothic_goals_' + currentUser.id, JSON.stringify(goals));
    
    const total = goals.length;
    const completed = goals.filter(g => g.status === 'Triumphant').length;
    setGoalsStats({ total, completed });

    const timer = setTimeout(async () => {
      try {
        const userId = currentUser.id;
        await saveGoals(userId, goals);
      } catch (err) {
        console.warn("Background Supabase goals sync delay: ", err);
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [goals, currentUser, isStorageReady]);

  useEffect(() => {
    if (!currentUser || !characterProfile || !isStorageReady) return;
    localStorage.setItem('gothic_character_profile_' + currentUser.id, JSON.stringify(characterProfile));

    const timer = setTimeout(async () => {
      try {
        const userId = currentUser.id;
        await saveUserProfile({
          id: userId,
          email: currentUser.email || "",
          display_name: currentUser.display_name || "",
          preferred_name: currentUser.preferred_name || "",
          date_of_birth: currentUser.date_of_birth || "",
          timezone: currentUser.timezone || "UTC",
          level: Math.floor((characterProfile.xp || 0) / 1000) + 1,
          xp: characterProfile.xp || 0,
          title: characterProfile.title || "The Wanderer",
          avatar_seed: characterProfile.avatarSeed || "",
          monument_seed: characterProfile.monumentSeed || "",
          created_at: characterProfile.accountCreated || new Date().toISOString(),
          characterProfile: characterProfile
        });
      } catch (err) {
        console.warn("Background Supabase profile sync delay: ", err);
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [characterProfile, currentUser, isStorageReady]);

  // Audio ambient bonfire/bench listener
  useEffect(() => {
    soundEngine.toggleBonfireAmbient(audioEnabled && isResting);
    return () => {
      soundEngine.toggleBonfireAmbient(false);
    };
  }, [audioEnabled, isResting]);

  const actualStreak = calculateActualStreak(quests);

  const dayContext = calculateDayContext(
    new Date(),
    goals,
    quests,
    actualStreak,
    characterProfile || getCharacterProfile()
  );

  useEffect(() => {
    if (!characterProfile) return;
    const contextQuote = getContextAwareQuote(dayContext, characterProfile);
    setRandomQuote(contextQuote);
  }, [goals, quests, characterProfile?.xp, actualStreak]);

  useEffect(() => {
    if (currentUser && characterProfile && characterProfile.streak !== actualStreak) {
      const updated = { ...characterProfile, streak: actualStreak };
      setCharacterProfile(updated);
      saveCharacterProfile(updated);
    }
  }, [actualStreak, currentUser, characterProfile]);

  // Add new task
  const handleAddQuest = (questData: {
    title: string;
    description: string;
    difficulty: QuestDifficulty;
    category: QuestCategory;
    dueDate?: string;
  }) => {
    const newQuest: Quest = {
      id: `quest-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: questData.title,
      description: questData.description,
      difficulty: questData.difficulty,
      category: questData.category,
      dueDate: questData.dueDate,
      completed: false,
      createdAt: new Date().toISOString()
    };
    setQuests(prev => [newQuest, ...prev]);
  };

  const handleUpdateQuest = (updatedQuest: Quest) => {
    setQuests(prev => prev.map(q => q.id === updatedQuest.id ? updatedQuest : q));
  };

  // Add multiple quests in a batch (e.g. for Campaign calendar distribution)
  const handleAddQuestsBatch = (questsBatch: {
    title: string;
    description: string;
    difficulty: QuestDifficulty;
    category: QuestCategory;
    dueDate?: string;
  }[]) => {
    const newQuests: Quest[] = questsBatch.map((q, idx) => ({
      id: `quest-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
      title: q.title,
      description: q.description,
      difficulty: q.difficulty,
      category: q.category,
      dueDate: q.dueDate,
      completed: false,
      createdAt: new Date().toISOString()
    }));
    setQuests(prev => [...newQuests, ...prev]);
  };

  const handleCompleteQuest = (id: string, customCompletedState?: boolean) => {
    const target = quests.find(q => q.id === id);
    if (!target || !characterProfile) return;

    const nextCompleted = customCompletedState !== undefined ? customCompletedState : !target.completed;
    if (nextCompleted === target.completed) return; 

    if (nextCompleted) {
      let gainedXp = 15;
      if (target.difficulty === 'Mortal Penance') gainedXp = 100;
      else if (target.difficulty === 'Sinuous Vow') gainedXp = 40;

      const { profile: updatedProfile, leveledUp } = rewardXp(gainedXp);
      const updated = { ...updatedProfile };
      addChronicleLog(updated, `Absolved Vow: "${target.title}" (+${gainedXp} XP).`);
      
      const ach = updated.achievements.find(a => a.id === 'ach-first');
      if (ach && !ach.unlocked) {
        ach.unlocked = true;
        ach.unlockedAt = getTodayLocalDateString();
        addChronicleLog(updated, "Unlocked Achievement: 'First Liturgical Duty' - Completed your very first Vow.");
      }

      saveCharacterProfile(updated);
      setCharacterProfile(updated);

      soundEngine.playSlash();
      setTimeout(() => {
        soundEngine.playSoulsClaimed();
      }, 400);
      setIgniteTrigger(prev => prev + 1);

      if (leveledUp) {
        setTimeout(() => {
          Alert.alert("Ascension!", `✦ You have reached Character Level ${Math.floor(updated.xp / 1000) + 1}! Check the Codex to inspect attributes!`);
        }, 300);
      }
    } else {
      let lostXp = 15;
      if (target.difficulty === 'Mortal Penance') lostXp = 100;
      else if (target.difficulty === 'Sinuous Vow') lostXp = 40;

      const profile = getCharacterProfile();
      const updated = { ...profile };
      updated.xp = Math.max(0, updated.xp - lostXp);
      addChronicleLog(updated, `Reverted Vow: "${target.title}" (-${lostXp} XP).`);
      saveCharacterProfile(updated);
      setCharacterProfile(updated);

      soundEngine.playClick();
    }

    setQuests(prev => prev.map(q => q.id === id ? { ...q, completed: nextCompleted } : q));
  };

  const handleDeleteQuest = (id: string) => {
    if (currentUser) {
      deleteQuest(currentUser.id, id).catch(err => console.warn(err));
    }
    setQuests(prev => prev.filter(q => q.id !== id));
  };

  const handleAbandonCampaign = (goalId: string) => {
    soundEngine.playClick();
    const targetGoal = goals.find(g => g.id === goalId);
    if (targetGoal) {
      const escapedTitle = targetGoal.title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`^(⚔️|⚔)\\s*\\[${escapedTitle}\\]`, 'i');
      
      if (currentUser) {
        deleteGoal(currentUser.id, goalId).catch(err => console.warn(err));
        const questsToDelete = quests.filter(q => regex.test(q.title));
        deleteQuests(currentUser.id, questsToDelete.map(q => q.id)).catch(err => console.warn(err));
      }
      setQuests(prev => prev.filter(q => !regex.test(q.title)));
    }
    setGoals(prev => prev.filter(g => g.id !== goalId));
  };

  const handleRestAtBench = () => {
    setIsResting(true);
    const randomIdx = Math.floor(Math.random() * GOTHIC_QUOTES.length);
    setRandomQuote(GOTHIC_QUOTES[randomIdx]);

    setTimeout(() => {
      setIsResting(false);
    }, 4500);
  };

  const completedCount = quests.filter(q => q.completed).length;
  const activeCount = quests.filter(q => !q.completed).length;

  const completedCampaignsCount = goals.filter(g => g.status === 'Triumphant').length;
  const activeCampaignsCount = goals.filter(g => g.status === 'In Quest').length;
  const hasFailedCampaign = goals.some(g => g.status === 'Abandoned');
  
  const unlockedSkillsCount = characterProfile 
    ? characterProfile.skillTrees.reduce((acc, tree) => acc + tree.nodes.filter(n => n.level > 0 || n.status === 'unlocked').length, 0)
    : 0;

  const titlesListCount = characterProfile ? (characterProfile.earnedTitles || []).length : 0;

  const filteredChronicle = characterProfile
    ? (characterProfile.chronicle || []).map(entry => {
        const hits = entry.bullets.filter(b => 
          b.toLowerCase().includes(chronicleSearch.toLowerCase()) || 
          entry.timeframe.toLowerCase().includes(chronicleSearch.toLowerCase())
        );
        return { ...entry, bullets: hits };
      }).filter(entry => entry.bullets.length > 0)
    : [];

  // Storage gate loading splash
  if (!isStorageReady || !characterProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.gothicGold} />
        <Text style={styles.loadingText}>AWAKENING THE ALTAR...</Text>
      </View>
    );
  }

  // Not logged in screen
  if (!currentUser) {
    return (
      <IcarusAuthPortal 
        onLoginSuccess={handleLoginSuccess}
        soundEngine={soundEngine}
      />
    );
  }

  return (
    <View style={styles.rootContainer}>
      
      {/* Absolute Header Ambient Soundtrack Audio Controls */}
      <View style={styles.absoluteHeaderControls}>
        <TouchableOpacity
          onPress={() => {
            soundEngine.playClick();
            setAudioEnabled(!audioEnabled);
          }}
          style={styles.controlPill}
        >
          {audioEnabled ? <Volume2 size={12} color={COLORS.gothicGold} /> : <VolumeX size={12} color={COLORS.gray500} />}
          <Text style={[styles.controlPillText, audioEnabled && { color: COLORS.gothicGold }]}>AMBIENT</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLogout}
          style={styles.controlPill}
        >
          <LogOut size={11} color={COLORS.gray400} />
          <Text style={styles.controlPillText}>DEPART</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.mainScrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* ================= DAILY STATS MONUMENT BANNER ================= */}
        <View style={styles.monumentWrapper}>
          <DailyMonument 
            date={new Date()}
            activeCampaignsCou={activeCampaignsCount}
            completedCampaignsCou={completedCampaignsCount}
            skillsCount={unlockedSkillsCount}
            titlesCount={titlesListCount}
            level={Math.floor(characterProfile.xp / 1000) + 1}
            streak={actualStreak}
            season={dayContext.season}
            specialOccasion={dayContext.specialOccasion}
            hasFailedCampaign={hasFailedCampaign}
            activeViewTab={activeViewTab}
            activeViewLabel={
              activeViewTab === 'The Path' ? `${activeCount} ACTIVE DUTIES` :
              activeViewTab === 'The Ascent' ? `${activeCampaignsCount} ACTIVE CAMPAIGNS` :
              activeViewTab === 'The Chronicle' ? `${filteredChronicle.length} RECORDS JOURNALED` :
              activeViewTab === 'The Codex' ? `${unlockedSkillsCount} DISCIPINES REVEALED` :
              `LEVEL ${Math.floor(characterProfile.xp / 1000) + 1} SOVEREIGN KNIGHT`
            }
          />
        </View>

        {/* ================= ACTIVE TAB PANEL VIEWPORT ================= */}
        <View style={styles.tabViewport}>
          {activeViewTab === 'The Path' && (
            <JourneyTab
              quests={quests}
              onCompleteQuest={handleCompleteQuest}
              onDeleteQuest={handleDeleteQuest}
              userLevel={Math.floor(characterProfile.xp / 1000) + 1}
              streak={actualStreak}
              randomQuote={randomQuote}
              dayContext={dayContext}
            />
          )}

          {activeViewTab === 'The Ascent' && (
            <CampaignsTab
              quests={quests}
              onCompleteQuest={handleCompleteQuest}
              onDeleteQuest={handleDeleteQuest}
              onAddQuest={handleAddQuest}
              onAddQuestsBatch={handleAddQuestsBatch}
              goals={goals}
              onUpdateGoals={setGoals}
              onAbandonCampaign={handleAbandonCampaign}
            />
          )}

          {activeViewTab === 'The Chronicle' && (
            <View style={{ gap: 12 }}>
              <GothicCalendar 
                quests={quests}
                onToggleQuest={handleCompleteQuest}
                onDeleteQuest={handleDeleteQuest}
                onSelectDate={(dateString) => {
                  setCalendarSelectedDate(dateString);
                }}
                onUpdateQuest={handleUpdateQuest}
                onNavigateToTab={setActiveViewTab}
              />

              {/* Personal Searchable Chronicle Ledger list */}
              <View style={styles.chronicleCard}>
                <View style={styles.chronicleHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <BookOpen size={14} color={COLORS.gothicGold} />
                    <Text style={styles.chronicleTitle}>THE PERSONAL CHRONICLE</Text>
                  </View>
                  <View style={styles.chronicleSearchWrap}>
                    <TextInput
                      placeholder="SEARCH RECORDS..."
                      placeholderTextColor={COLORS.gray700}
                      value={chronicleSearch}
                      onChangeText={setChronicleSearch}
                      style={styles.chronicleSearchInput}
                    />
                  </View>
                </View>

                <ScrollView style={styles.chronicleEntriesContainer} nestedScrollEnabled>
                  {filteredChronicle.length > 0 ? (
                    filteredChronicle.map((ch) => (
                      <View key={ch.id} style={styles.chronicleItem}>
                        <Text style={styles.chronicleItemTime}>⚔ {ch.timeframe.toUpperCase()}</Text>
                        <View style={styles.bulletsList}>
                          {ch.bullets.map((bullet, idx) => (
                            <View key={idx} style={styles.bulletRow}>
                              <Text style={styles.bulletSymbol}>✦</Text>
                              <Text style={styles.bulletText}>{bullet.toUpperCase()}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyChronicleText}>NO CHRONICLES MATCH SEARCH THRESHOLDS</Text>
                  )}
                </ScrollView>
              </View>
            </View>
          )}

          {activeViewTab === 'The Codex' && (
            <GothicProfile 
              quests={quests}
              goals={goals}
              goalsCount={goalsStats.total}
              completedGoalsCount={goalsStats.completed}
              profile={characterProfile}
              onUpdateProfile={(updated) => {
                setCharacterProfile(updated);
                saveCharacterProfile(updated);
              }}
              tab="The Codex"
            />
          )}

          {activeViewTab === 'The Wanderer' && (
            <GothicProfile 
              quests={quests}
              goals={goals}
              goalsCount={goalsStats.total}
              completedGoalsCount={goalsStats.completed}
              profile={characterProfile}
              onUpdateProfile={(updated) => {
                setCharacterProfile(updated);
                saveCharacterProfile(updated);
              }}
              onReset={() => {
                soundEngine.playSlash();
                setResetConfirmationText('');
                setShowResetConfirmModal(true);
              }}
              tab="The Wanderer"
            />
          )}
        </View>

        {/* Footer info */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>† SORROWFUL BE THE HEART, PENITENT ASHEN KNIGHT †</Text>
          <Text style={styles.footerText}>
            ICARUS • STANDALONE MOBILE PROGRESSION ENGINE
          </Text>
        </View>
      </ScrollView>

      {/* ================= RESTING BONFIRE COMMUNION SCREENSAVER ================= */}
      <Modal visible={isResting} animationType="fade" transparent>
        <View style={styles.restingOverlay}>
          <View style={styles.restingContainer}>
            <View style={styles.screensaverBonfireContainer}>
              <Bonfire 
                completedCount={completedCount}
                activeCount={activeCount}
                isResting={true} 
                onRest={() => {}} 
                igniteTrigger={0} 
              />
            </View>

            <View style={styles.quoteBlock}>
              <Text style={styles.quoteSub}>† PENITENT COMMUNION †</Text>
              <Text style={styles.quoteMain}>"{randomQuote.text.toUpperCase()}"</Text>
              <Text style={styles.quoteAuthor}>— {randomQuote.author.toUpperCase()}</Text>
            </View>

            <TouchableOpacity
              onPress={() => setIsResting(false)}
              style={styles.leaveAltarBtn}
            >
              <Text style={styles.leaveAltarBtnText}>DEPART THE BONFIRE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= MASTER PURGE CONFIRMATION MODAL ================= */}
      <Modal visible={showResetConfirmModal} animationType="slide" transparent>
        <View style={styles.purgeOverlay}>
          <View style={styles.purgeCard}>
            <View style={styles.purgeBadge}>
              <ShieldAlert size={24} color={COLORS.gothicCrimson} />
            </View>

            <Text style={styles.purgeCardTitle}>⚠️ ABSOLUTE PURGE DECREE ⚠️</Text>
            <Text style={styles.purgeCardDesc}>
              This critical action is irreversible. Scribes will grind the archives, and the altar will be permanently cleared of:
            </Text>

            <ScrollView style={styles.purgeList} showsVerticalScrollIndicator={false}>
              <Text style={styles.purgeListItem}>† ALL PENDING GOALS</Text>
              <Text style={styles.purgeListItem}>† ALL ACTIVE HABITS & ATTEMPTS</Text>
              <Text style={styles.purgeListItem}>† ALL RECORDED QUESTS & COVENANTS</Text>
              <Text style={styles.purgeListItem}>† ALL EARNED ACHIEVEMENTS</Text>
              <Text style={styles.purgeListItem}>† ALL XP & CHARACTER PROGRESS LEVELS</Text>
              <Text style={styles.purgeListItem}>† ALL STREAKS, CALENDAR EVENTS & LOGS</Text>
              <Text style={styles.purgeListItem}>† THE CHRONICLE JOURNAL ARCHIVES</Text>
            </ScrollView>

            <View style={{ width: '100%', gap: 6, marginVertical: 12 }}>
              <Text style={styles.purgeConfirmPrompt}>
                TYPE <Text style={{ color: '#fff', fontWeight: 'bold' }}>CONFIRM RESET</Text> TO PROCEED:
              </Text>
              <TextInput
                value={resetConfirmationText}
                onChangeText={setResetConfirmationText}
                placeholder="TYPE CONFIRMATION PHRASE..."
                placeholderTextColor={COLORS.gray700}
                style={styles.purgeConfirmInput}
              />
            </View>

            <View style={styles.purgeActions}>
              <TouchableOpacity
                onPress={() => { setShowResetConfirmModal(false); soundEngine.playClick(); }}
                style={styles.purgeCancelBtn}
              >
                <Text style={styles.purgeCancelBtnText}>RECANT DECREE</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  if (resetConfirmationText === 'CONFIRM RESET') {
                    soundEngine.playSoulsClaimed();
                    try {
                      if (currentUser && currentUser.id) {
                        await purgeUserData(currentUser.id);
                        await signOutOfSupabase();
                      }
                    } catch (err) {
                      console.warn("Failed to fully purge database: ", err);
                    } finally {
                      purgePerfectGothicState();
                      Alert.alert("Purge Completed", "The purge cycle is complete. Ground has been turned to dust.");
                      setShowResetConfirmModal(false);
                      setCurrentUser(null);
                    }
                  } else {
                    soundEngine.playSlash();
                    Alert.alert("Denied", "The scribes refuse backdoors. Type exact phrase 'CONFIRM RESET' to proceed.");
                  }
                }}
                style={styles.purgeConfirmBtn}
              >
                <Text style={styles.purgeConfirmBtnText}>COMMIT WIPE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= STICKY BOTTOM 5-TAB APP NAVIGATION BAR ================= */}
      <View style={styles.bottomTabBar}>
        {(['The Path', 'The Ascent', 'The Chronicle', 'The Codex', 'The Wanderer'] as const).map((tab) => {
          const isActive = activeViewTab === tab;
          
          let icon = <Compass size={16} color={isActive ? COLORS.gothicGold : COLORS.gray500} />;
          if (tab === 'The Ascent') icon = <Shield size={16} color={isActive ? COLORS.gothicGold : COLORS.gray500} />;
          if (tab === 'The Chronicle') icon = <CalendarIcon size={16} color={isActive ? COLORS.gothicGold : COLORS.gray500} />;
          if (tab === 'The Codex') icon = <BookOpen size={16} color={isActive ? COLORS.gothicGold : COLORS.gray500} />;
          if (tab === 'The Wanderer') icon = <User size={16} color={isActive ? COLORS.gothicGold : COLORS.gray500} />;

          return (
            <TouchableOpacity
              key={tab}
              onPress={() => {
                soundEngine.playClick();
                setActiveViewTab(tab);
                
                if (tab === 'The Codex' || tab === 'The Wanderer') {
                  const updateProfileRef = getCharacterProfile();
                  setCharacterProfile(updateProfileRef);
                }
              }}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
            >
              {icon}
              <Text style={[styles.tabItemText, isActive && { color: COLORS.gothicGold, fontWeight: 'bold' }]}>
                {tab.split(' ').pop()?.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: COLORS.gothicDark,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.gothicDark,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.gothicGold,
    letterSpacing: 1.5,
  },
  absoluteHeaderControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
    paddingBottom: 8,
    backgroundColor: COLORS.gothicDark,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 50, 62, 0.2)',
  },
  controlPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.gothicCard,
    borderColor: COLORS.gothicBorder,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  controlPillText: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gray400,
    fontWeight: 'bold',
  },
  mainScrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 110, // Avoid overlapping the sticky bottom navigation bar
  },
  monumentWrapper: {
    marginBottom: 16,
  },
  tabViewport: {
    flex: 1,
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
    color: COLORS.gothicGoldDim,
    letterSpacing: 0.5,
  },
  footerText: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    color: COLORS.gray600,
    letterSpacing: 1,
  },
  bottomTabBar: {
    position: 'absolute',
    bottom: 20,
    left: '4%',
    width: '92%',
    height: 52,
    backgroundColor: 'rgba(18, 19, 23, 0.94)',
    borderWidth: 2,
    borderColor: 'rgba(200, 158, 92, 0.25)',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.85,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 1000,
  },
  tabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabItemActive: {
    transform: [{ scale: 1.05 }],
  },
  tabItemText: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    color: COLORS.gray500,
  },
  chronicleCard: {
    backgroundColor: COLORS.gothicCard,
    borderColor: COLORS.gothicBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  chronicleHeader: {
    flexDirection: 'column',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 50, 62, 0.2)',
    paddingBottom: 10,
    marginBottom: 12,
  },
  chronicleTitle: {
    fontFamily: FONTS.cinzel,
    fontSize: 10.5,
    fontWeight: 'bold',
    color: COLORS.gothicGold,
  },
  chronicleSearchWrap: {
    backgroundColor: COLORS.gothicDark,
    borderColor: COLORS.gothicBorder,
    borderWidth: 1,
    borderRadius: 8,
    height: 28,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  chronicleSearchInput: {
    color: '#fff',
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    padding: 0,
  },
  chronicleEntriesContainer: {
    maxHeight: 250,
  },
  chronicleItem: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderColor: 'rgba(46, 50, 62, 0.2)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  chronicleItemTime: {
    fontFamily: FONTS.cinzel,
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.gothicGoldDim,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(46, 50, 62, 0.3)',
    paddingBottom: 4,
    marginBottom: 6,
  },
  bulletsList: {
    gap: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  bulletSymbol: {
    color: COLORS.gothicGold,
    fontFamily: FONTS.mono,
    fontSize: 8,
    marginTop: 1,
  },
  bulletText: {
    flex: 1,
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gray400,
    lineHeight: 11,
  },
  emptyChronicleText: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gray600,
    textAlign: 'center',
    paddingVertical: 32,
  },
  restingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 11, 13, 0.98)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  restingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 400,
    gap: 20,
  },
  screensaverBonfireContainer: {
    width: 250,
    height: 250,
  },
  quoteBlock: {
    alignItems: 'center',
    gap: 8,
  },
  quoteSub: {
    fontFamily: FONTS.cinzel,
    fontSize: 9,
    color: COLORS.gothicGold,
    letterSpacing: 1.5,
    fontWeight: 'bold',
  },
  quoteMain: {
    fontFamily: FONTS.cinzel,
    fontSize: 14,
    color: COLORS.gray300,
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  quoteAuthor: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gothicGold,
    marginTop: 4,
  },
  leaveAltarBtn: {
    borderColor: COLORS.gothicBorder,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 20,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  leaveAltarBtnText: {
    fontFamily: FONTS.cinzel,
    fontSize: 9,
    color: COLORS.gray400,
    letterSpacing: 1,
  },
  purgeOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 11, 13, 0.96)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  purgeCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.gothicCard,
    borderColor: COLORS.gothicCrimson,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  purgeBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderColor: COLORS.gothicCrimson,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  purgeCardTitle: {
    fontFamily: FONTS.cinzel,
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.gothicCrimson,
    letterSpacing: 0.5,
  },
  purgeCardDesc: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gray400,
    textAlign: 'center',
    lineHeight: 12,
    marginVertical: 10,
  },
  purgeList: {
    width: '100%',
    maxHeight: 120,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderColor: 'rgba(220, 38, 38, 0.2)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
  },
  purgeListItem: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gothicCrimson,
    marginBottom: 4,
  },
  purgeConfirmPrompt: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    color: COLORS.gray500,
    textAlign: 'center',
  },
  purgeConfirmInput: {
    backgroundColor: COLORS.gothicDark,
    borderColor: 'rgba(220, 38, 38, 0.4)',
    borderWidth: 1,
    borderRadius: 6,
    height: 32,
    color: '#fff',
    fontFamily: FONTS.mono,
    fontSize: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  purgeActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  purgeCancelBtn: {
    flex: 1,
    backgroundColor: COLORS.gothicDark,
    borderColor: COLORS.gothicBorder,
    borderWidth: 1,
    borderRadius: 6,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purgeCancelBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gray400,
  },
  purgeConfirmBtn: {
    flex: 1,
    backgroundColor: COLORS.gothicCrimson,
    borderRadius: 6,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purgeConfirmBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: '#fff',
    fontWeight: 'bold',
  }
});

