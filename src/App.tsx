/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, 
  VolumeX, 
  Skull,
  Inbox,
  FlameKindling,
  Sparkles,
  BookOpen,
  LogOut
} from 'lucide-react';
import { Quest, Goal, QuestDifficulty, QuestCategory, GOTHIC_QUOTES } from './types';
import { Bonfire } from './components/Bonfire';
import { GothicQuestItem } from './components/GothicQuestItem';
import { CreateQuestForm } from './components/CreateQuestForm';
import { GothicCalendar } from './components/GothicCalendar';
import { GothicProfile } from './components/GothicProfile';
import { soundEngine } from './utils/audio';
import { JourneyTab } from './components/JourneyTab';
import { CampaignsTab } from './components/CampaignsTab';
import { Compass, Calendar as CalendarIcon, Shield } from 'lucide-react';
import { getCharacterProfile, saveCharacterProfile, rewardXp, addChronicleLog, purgePerfectGothicState, CharacterProfile, calculateActualStreak } from './utils/progressionUtils';
import { getLocalDateString, getTodayLocalDateString } from './utils/dateUtils';
import { ShieldAlert, RefreshCw, User, Flame } from 'lucide-react';
import { calculateDayContext, getContextAwareQuote } from './utils/contextAwareEngine';
import { DailyMonument } from './components/DailyMonument';
import { IcarusAuthPortal } from './components/IcarusAuthPortal';
import { db, auth } from './lib/firebase';
import { doc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<any | null>(() => {
    const saved = localStorage.getItem('gothic_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Load initial states from localStorage scoped by logged in user ID
  const [quests, setQuests] = useState<Quest[]>(() => {
    const savedUser = localStorage.getItem('gothic_current_user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      const saved = localStorage.getItem('gothic_quests_' + u.id);
      if (saved) return JSON.parse(saved);
      return u.quests || [];
    }
    return [];
  });

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
  
  const [characterProfile, setCharacterProfile] = useState<CharacterProfile>(() => {
    const savedUser = localStorage.getItem('gothic_current_user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      const saved = localStorage.getItem('gothic_character_profile_' + u.id);
      if (saved) return JSON.parse(saved);
      return u.characterProfile || getCharacterProfile();
    }
    return getCharacterProfile();
  });

  const [globalCommandInput, setGlobalCommandInput] = useState('');
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [resetConfirmationText, setResetConfirmationText] = useState('');
  
  // Lifted Goals State (Single Source of Truth)
  const [goals, setGoals] = useState<Goal[]>(() => {
    const savedUser = localStorage.getItem('gothic_current_user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      const saved = localStorage.getItem('gothic_goals_' + u.id);
      if (saved) return JSON.parse(saved);
      return u.goals || [];
    }
    return [];
  });
  const [goalsStats, setGoalsStats] = useState({ total: 0, completed: 0 });

  const [timeframeFilter, setTimeframeFilter] = useState<'Today' | 'This Week' | 'This Month' | 'Full Cycle'>(() => {
    const saved = sessionStorage.getItem('gothic_deeds_timeframe_filter');
    return (saved === 'Today' || saved === 'This Week' || saved === 'This Month' || saved === 'Full Cycle') ? saved : 'Today';
  });

  useEffect(() => {
    sessionStorage.setItem('gothic_deeds_timeframe_filter', timeframeFilter);
  }, [timeframeFilter]);

  // Auth Portal Dynamic Login Handlers
  const handleLoginSuccess = (userData: any) => {
    localStorage.setItem('gothic_current_user', JSON.stringify(userData));
    
    // Scoped initialization for the variables
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
    if (!currentUser) return;
    localStorage.setItem('gothic_quests_' + currentUser.id, JSON.stringify(quests));
    
    const timer = setTimeout(async () => {
      try {
        const userId = currentUser.id;
        // Direct Client-Side Firestore synchronization of quests
        const promises = quests.map(q => 
          setDoc(doc(db, "users", userId, "quests", q.id), q)
        );
        await Promise.all(promises);
      } catch (err) {
        console.warn("Background Firestore quests sync delay: ", err);
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [quests, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    localStorage.setItem('gothic_goals_' + currentUser.id, JSON.stringify(goals));
    
    const total = goals.length;
    const completed = goals.filter(g => g.status === 'Triumphant' || g.completed === true).length;
    setGoalsStats({ total, completed });

    const timer = setTimeout(async () => {
      try {
        const userId = currentUser.id;
        // Direct Client-Side Firestore synchronization of goals/campaigns
        const promises = goals.map(g => 
          setDoc(doc(db, "users", userId, "goals", g.id), g)
        );
        await Promise.all(promises);
      } catch (err) {
        console.warn("Background Firestore goals sync delay: ", err);
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [goals, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    localStorage.setItem('gothic_character_profile_' + currentUser.id, JSON.stringify(characterProfile));

    const timer = setTimeout(async () => {
      try {
        const userId = currentUser.id;
        // Direct Client-Side Firestore synchronization of the user profile record
        await setDoc(doc(db, "users", userId), {
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
        }, { merge: true });
      } catch (err) {
        console.warn("Background Firestore profile sync delay: ", err);
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [characterProfile, currentUser]);

  // Audio ambient bonfire/bench listener
  useEffect(() => {
    soundEngine.toggleBonfireAmbient(audioEnabled && isResting);
    return () => {
      soundEngine.toggleBonfireAmbient(false);
    };
  }, [audioEnabled, isResting]);

  // Dynamically compute the actual streak based on actual completed quests data
  const actualStreak = calculateActualStreak(quests);

  // Dynamically compute the day's context
  const dayContext = calculateDayContext(
    new Date(),
    goals,
    quests,
    actualStreak,
    characterProfile
  );

  // Sync quote to the day's context when context (goals, quests, streak, xp) updates
  useEffect(() => {
    const contextQuote = getContextAwareQuote(dayContext, characterProfile);
    setRandomQuote(contextQuote);
  }, [goals, quests, characterProfile.xp, actualStreak]);

  // Sync streak counts onto the character profile state (and localStorage/DB) if it changed
  useEffect(() => {
    if (currentUser && characterProfile.streak !== actualStreak) {
      const updated = { ...characterProfile, streak: actualStreak };
      setCharacterProfile(updated);
      saveCharacterProfile(updated);
    }
  }, [actualStreak, currentUser]);

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

  // Centralized, Unified Quest Toggling Handler (Completing / Uncompleting Vows & Day Instances)
  const handleCompleteQuest = (id: string, customCompletedState?: boolean) => {
    const target = quests.find(q => q.id === id);
    if (!target) return;

    // Determine new completion state
    const nextCompleted = customCompletedState !== undefined ? customCompletedState : !target.completed;
    if (nextCompleted === target.completed) return; // No change needed

    if (nextCompleted) {
      // --- ACTION: COMPLETE VOW ---
      let gainedXp = 15;
      if (target.difficulty === 'Mortal Penance') gainedXp = 100;
      else if (target.difficulty === 'Sinuous Vow') gainedXp = 40;

      // Reward XP in profile
      const { profile: updatedProfile, leveledUp } = rewardXp(gainedXp);
      const updated = { ...updatedProfile };
      addChronicleLog(updated, `Absolved Vow: "${target.title}" (+${gainedXp} XP).`);
      
      // Ensure 'First Liturgical Duty' achievement is unlocked
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
          alert(`✦ ASCENSION! You have reached Character Level ${Math.floor(updated.xp / 1000) + 1}! Check the Character Sheet to equip new titles!`);
        }, 300);
      }
    } else {
      // --- ACTION: REVERT / UNCOMPLETE VOW ---
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

  // Delete / Purge Vow
  const handleDeleteQuest = (id: string) => {
    if (currentUser) {
      deleteDoc(doc(db, "users", currentUser.id, "quests", id)).catch(err => console.warn(err));
    }
    setQuests(prev => prev.filter(q => q.id !== id));
  };

  // Centralized Campaign Abandon: deletes campaign from database plus all its corresponding quests
  const handleAbandonCampaign = (goalId: string) => {
    soundEngine.playClick();
    const targetGoal = goals.find(g => g.id === goalId);
    if (targetGoal) {
      // Escape any special characters for regex
      const escapedTitle = targetGoal.title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      // Match starts with ⚔️ or ⚔, followed by optional spaces, then [title] bracketed
      const regex = new RegExp(`^(⚔️|⚔)\\s*\\[${escapedTitle}\\]`, 'i');
      
      if (currentUser) {
        // Cascade delete from firestore
        deleteDoc(doc(db, "users", currentUser.id, "goals", goalId)).catch(err => console.warn(err));
        
        // Find matched quests to delete from Firestore
        const questsToDelete = quests.filter(q => regex.test(q.title));
        questsToDelete.forEach(q => {
          deleteDoc(doc(db, "users", currentUser.id, "quests", q.id)).catch(err => console.warn(err));
        });
      }

      // Cascade delete associated calendar tasks and task instances
      setQuests(prev => prev.filter(q => !regex.test(q.title)));
    }
    setGoals(prev => prev.filter(g => g.id !== goalId));
  };

  // Rest at the Altar / Bonfire: beautifully shuffles atmospheric souls quotes!
  const handleRestAtBench = () => {
    setIsResting(true);
    const randomIdx = Math.floor(Math.random() * GOTHIC_QUOTES.length);
    setRandomQuote(GOTHIC_QUOTES[randomIdx]);

    setTimeout(() => {
      setIsResting(false);
    }, 4500); // 4.5 seconds of restful loop
  };

  // Clear completed list (absolve non-pending tasks)
  const handlePurgeCompleted = () => {
    soundEngine.playClick();
    if (currentUser) {
      const completedList = quests.filter(q => q.completed);
      completedList.forEach(q => {
        deleteDoc(doc(db, "users", currentUser.id, "quests", q.id)).catch(err => console.warn(err));
      });
    }
    setQuests(prev => prev.filter(q => !q.completed));
  };

  // Filtering todos
  const filteredQuests = quests.filter(q => {
    const matchesCat = activeCategory === 'All' || q.category === activeCategory;
    const matchesDiff = activeDifficulty === 'All' || q.difficulty === activeDifficulty;
    return matchesCat && matchesDiff;
  });

  // helper to parse YYYY-MM-DD safely
  const parseDueDate = (dueDateStr?: string) => {
    if (!dueDateStr) return null;
    const parts = dueDateStr.split('-');
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day, 12, 0, 0, 0); // local noon
  };

  const todayDate = new Date();
  todayDate.setHours(12, 0, 0, 0);
  const todayStr = getTodayLocalDateString();

  const getStartOfWeek = (d: Date) => {
    const res = new Date(d);
    const day = res.getDay();
    const diff = res.getDate() - day; // back to Sunday
    res.setDate(diff);
    res.setHours(0, 0, 0, 0);
    return res;
  };

  const currentSunday = getStartOfWeek(new Date());
  const currentSaturday = new Date(currentSunday);
  currentSaturday.setDate(currentSunday.getDate() + 6);
  currentSaturday.setHours(23, 59, 59, 999);

  const startOfWeekStr = getLocalDateString(currentSunday);
  const endOfWeekStr = getLocalDateString(currentSaturday);

  const startOfMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1, 0, 0, 0, 0);
  const endOfMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0, 23, 59, 59, 999);
  const startOfMonthStr = getLocalDateString(startOfMonth);
  const endOfMonthStr = getLocalDateString(endOfMonth);

  // --- TODAY FILTERING & GROUPING ---
  const overdueQuests = filteredQuests.filter(q => !q.completed && q.dueDate && q.dueDate < todayStr);
  const todayQuests = filteredQuests.filter(q => q.dueDate === todayStr);
  const perpetualQuests = filteredQuests.filter(q => !q.dueDate && !q.completed);
  const completedTodayQuests = filteredQuests.filter(
    q => q.completed && (q.dueDate === todayStr || (!q.dueDate && q.createdAt?.startsWith(todayStr)))
  );

  const todayGroups = [
    { id: 'overdue', label: '💀 Overdue Penances', items: overdueQuests },
    { id: 'today', label: '🕯️ Today\'s Vows', items: todayQuests },
    { id: 'perpetual', label: '⚓ Perpetual Devotions', items: perpetualQuests },
    { id: 'completed', label: '⭐ Absolved Today', items: completedTodayQuests }
  ].filter(g => g.items.length > 0);

  // --- THIS WEEK FILTERING & GROUPING ---
  const weekOverdue = filteredQuests.filter(q => !q.completed && q.dueDate && q.dueDate < startOfWeekStr);
  const weekPerpetual = filteredQuests.filter(q => !q.dueDate && !q.completed);
  const weekCompleted = filteredQuests.filter(
    q => q.completed && q.dueDate && q.dueDate >= startOfWeekStr && q.dueDate <= endOfWeekStr
  );

  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weekDayGroups = weekdays.map((dayName, idx) => {
    const targetDate = new Date(currentSunday);
    targetDate.setDate(currentSunday.getDate() + idx);
    const targetDateStr = getLocalDateString(targetDate);
    const isDayToday = targetDateStr === todayStr;

    const items = filteredQuests.filter(q => q.dueDate === targetDateStr);
    return {
      id: `week-${dayName.toLowerCase()}`,
      label: `📅 ${dayName}${isDayToday ? ' (Today)' : ''}`,
      items
    };
  });

  const weekGroups = [
    { id: 'overdue', label: '💀 Overdue Penances', items: weekOverdue },
    ...weekDayGroups,
    { id: 'perpetual', label: '⚓ Perpetual Devotions', items: weekPerpetual },
    { id: 'completed', label: '⭐ Absolved This Week', items: weekCompleted }
  ].filter(g => g.items.length > 0);

  // --- THIS MONTH FILTERING & GROUPING ---
  const monthOverdue = filteredQuests.filter(q => !q.completed && q.dueDate && q.dueDate < startOfMonthStr);
  const monthPerpetual = filteredQuests.filter(q => !q.dueDate && !q.completed);
  const monthCompleted = filteredQuests.filter(
    q => q.completed && q.dueDate && q.dueDate >= startOfMonthStr && q.dueDate <= endOfMonthStr
  );

  const getMonthWeekLabel = (dueDateStr: string) => {
    const date = parseDueDate(dueDateStr);
    if (!date || date.getMonth() !== todayDate.getMonth() || date.getFullYear() !== todayDate.getFullYear()) return null;
    const day = date.getDate();
    if (day <= 7) return '📅 Week 1 (Days 1-7)';
    if (day <= 14) return '📅 Week 2 (Days 8-14)';
    if (day <= 21) return '📅 Week 3 (Days 15-21)';
    if (day <= 28) return '📅 Week 4 (Days 22-28)';
    return '📅 Week 5 (Remaining Days)';
  };

  const monthWeeks = [
    '📅 Week 1 (Days 1-7)',
    '📅 Week 2 (Days 8-14)',
    '📅 Week 3 (Days 15-21)',
    '📅 Week 4 (Days 22-28)',
    '📅 Week 5 (Remaining Days)'
  ];

  const monthWeekGroups = monthWeeks.map(label => {
    const items = filteredQuests.filter(q => q.dueDate && getMonthWeekLabel(q.dueDate) === label);
    return {
      id: `month-week-${label.replace(/\s+/g, '-').replace(/[()]/g, '')}`,
      label,
      items
    };
  });

  const monthGroups = [
    { id: 'overdue', label: '💀 Overdue Penances', items: monthOverdue },
    ...monthWeekGroups,
    { id: 'perpetual', label: '⚓ Perpetual Devotions', items: monthPerpetual },
    { id: 'completed', label: '⭐ Absolved This Month', items: monthCompleted }
  ].filter(g => g.items.length > 0);

  // --- FULL CYCLE (ALL HORIZONS) ---
  const allFutureOverdue = filteredQuests.filter(q => !q.completed && q.dueDate && q.dueDate < todayStr);
  const allFutureCompleted = filteredQuests.filter(q => q.completed);
  
  const horizonToday = filteredQuests.filter(q => !q.completed && q.dueDate === todayStr);
  const horizonNext7Days = filteredQuests.filter(q => !q.completed && q.dueDate && q.dueDate > todayStr && q.dueDate <= (() => {
    const d = new Date(todayStr + 'T12:00:00'); d.setDate(d.getDate() + 7); return getLocalDateString(d);
  })());
  const horizonNext30Days = filteredQuests.filter(q => !q.completed && q.dueDate && q.dueDate > (() => {
    const d = new Date(todayStr + 'T12:00:00'); d.setDate(d.getDate() + 7); return getLocalDateString(d);
  })() && q.dueDate <= (() => {
    const d = new Date(todayStr + 'T12:00:00'); d.setDate(d.getDate() + 30); return getLocalDateString(d);
  })());
  const horizonBeyond30Days = filteredQuests.filter(q => !q.completed && q.dueDate && q.dueDate > (() => {
    const d = new Date(todayStr + 'T12:00:00'); d.setDate(d.getDate() + 30); return getLocalDateString(d);
  })());
  const horizonPerpetual = filteredQuests.filter(q => !q.completed && !q.dueDate);

  const fullCycleGroups = [
    { id: 'overdue', label: '💀 Overdue Penances', items: allFutureOverdue },
    { id: 'horizon-today', label: '🕯️ Active Today', items: horizonToday },
    { id: 'horizon-7', label: '⚔️ Sovereign Fortnight (Next 7 Days)', items: horizonNext7Days },
    { id: 'horizon-30', label: '⏳ Outer Citadel (Days 8 to 30)', items: horizonNext30Days },
    { id: 'horizon-afar', label: '🪐 Abyss of Time (Days 31 to 40+)', items: horizonBeyond30Days },
    { id: 'horizon-perp', label: '⚓ Eternal Covenants', items: horizonPerpetual },
    { id: 'horizon-completed', label: '⭐ Absolute Absolutions (Completed)', items: allFutureCompleted }
  ].filter(g => g.items.length > 0);

  const currentGroups = 
    timeframeFilter === 'Today' ? todayGroups :
    timeframeFilter === 'This Week' ? weekGroups :
    timeframeFilter === 'This Month' ? monthGroups :
    fullCycleGroups;

  // Get active campaigns count
  const activeCampaignsCount = goals.filter(g => g.status === 'In Quest' && !g.completed).length;

  // Function to detect dynamic growing skills count
  const getGrowingSkillsCount = () => {
    const SKILLS_REGISTRY = [
      { id: "swimming", keywords: ["swim", "swimming", "pool", "lap", "stroke", "laps", "waters"], nodeId: "fit-swim" },
      { id: "strength_training", keywords: ["strength", "gym", "lift", "workout", "muscle", "iron", "pushup", "pullup", "squat", "deadlift", "bench"], nodeId: "fit-strength" },
      { id: "physical_conditioning", keywords: ["conditioning", "physical", "body", "cardio", "stamina", "run", "running", "jog"], nodeId: "fit-run" },
      { id: "recovery_management", keywords: ["recovery", "sleep", "fast", "diet", "nutrition", "stretching", "mobility", "warmup", "fasting"], nodeId: "fit-nutrition" },
      { id: "guitar", keywords: ["guitar", "acoustic", "electric", "strum", "fingerstyle", "fret", "frets", "guitarist"], nodeId: "music-guitar" },
      { id: "music_theory", keywords: ["music", "theory", "chord", "notes", "scales", "harmony", "rhythm", "sound", "metronome"], nodeId: "music-theory" },
      { id: "react", keywords: ["react", "jsx", "tsx", "useState", "useEffect", "component", "hook", "state", "props"], nodeId: "prog-react" },
      { id: "frontend_development", keywords: ["html", "css", "tailwind", "ui", "frontend", "web", "layout", "canvas", "element", "viewport"], nodeId: "prog-front" },
      { id: "component_design", keywords: ["component", "button", "modal", "card", "combobox", "select", "form", "modular", "reusable"], nodeId: "prog-front" },
      { id: "public_speaking", keywords: ["speech", "speak", "stage", "audience", "talk", "presentation", "verbal"], nodeId: "comm-speak" },
      { id: "communication", keywords: ["communication", "team", "write", "writing", "collaborate", "listening", "negotiate", "persuasion"], nodeId: "comm-general" },
      { id: "java", keywords: ["java", "spring", "backend", "oop", "maven", "gradle", "hibernate", "jdbc"], nodeId: "prog-java" },
      { id: "typescript", keywords: ["typescript", "ts", "types", "interfaces", "generics", "type-safety", "compiler"], nodeId: "prog-ts" },
      { id: "database", keywords: ["database", "sql", "postgresql", "query", "schema", "indexing", "joins", "migrations"], nodeId: "prog-db" },
      { id: "algorithms", keywords: ["algorithm", "data structure", "leetcode", "complexity", "big o", "sorting", "binary", "recursion"], nodeId: "prog-algo" },
      { id: "ai_engineering", keywords: ["ai", "prompt", "llm", "gemini", "openai", "rag", "agents", "machine learning"], nodeId: "prog-ai" },
      { id: "reading", keywords: ["read", "reading", "book", "scroll", "literature", "article", "paper", "newsletter"], nodeId: "dev-read" },
      { id: "time_management", keywords: ["time", "focus", "block", "pomodoro", "hour", "intervals", "distraction", "calendar", "deep"], nodeId: "dev-time" },
      { id: "habit_consistency", keywords: ["habit", "routine", "streak", "daily", "consistency", "discipline", "rituals"], nodeId: "dev-habit" },
      { id: "journaling", keywords: ["journal", "entry", "reflection", "diary", "scribe", "ledger", "evening", "review"], nodeId: "dev-journal" },
      { id: "dawn_vigil", keywords: ["wake", "morning", "dawn", "sunrise", "vigil", "early", "5am", "6am"], nodeId: "dev-wake" }
    ];

    const checkMatch = (text: string, kw: string[]) => {
      const lower = text.toLowerCase();
      return kw.some(k => lower.includes(k));
    };

    const mappedGoalIds = new Set<string>();
    let growingCount = 0;

    const savedGoals = goals || [];

    SKILLS_REGISTRY.forEach(reg => {
      let nodeLevel = 0;
      let nodeUnlocked = false;

      if (characterProfile && characterProfile.skillTrees) {
        for (const tree of characterProfile.skillTrees) {
          const matchingNode = tree.nodes.find(n => n.id === reg.nodeId);
          if (matchingNode) {
            nodeLevel = matchingNode.level;
            nodeUnlocked = matchingNode.status === 'unlocked';
            break;
          }
        }
      }

      const completedMatchingQuests = quests.filter(q => 
        q.completed && (checkMatch(q.title, reg.keywords) || checkMatch(q.description, reg.keywords))
      );
      const activeMatchingQuests = quests.filter(q => 
        !q.completed && (checkMatch(q.title, reg.keywords) || checkMatch(q.description, reg.keywords))
      );

      const completedMatchingCampaigns = savedGoals.filter(g => {
        const matches = (g.status === 'Triumphant' || g.completed) && 
          (checkMatch(g.title, reg.keywords) || checkMatch(g.aspiration, reg.keywords));
        if (matches) mappedGoalIds.add(g.id);
        return matches;
      });

      const activeMatchingCampaigns = savedGoals.filter(g => {
        const matches = g.status === 'In Quest' && !g.completed &&
          (checkMatch(g.title, reg.keywords) || checkMatch(g.aspiration, reg.keywords));
        if (matches) mappedGoalIds.add(g.id);
        return matches;
      });

      const hasCompletedQuests = completedMatchingQuests.length > 0;
      const hasCompletedCampaigns = completedMatchingCampaigns.length > 0;
      const hasActiveQuests = activeMatchingQuests.length > 0;
      const hasActiveCampaigns = activeMatchingCampaigns.length > 0;

      const hasEvidence = nodeUnlocked || hasCompletedQuests || hasCompletedCampaigns || hasActiveQuests || hasActiveCampaigns;

      if (hasEvidence) {
        let level = 1;
        level += completedMatchingCampaigns.length * 5;
        level += activeMatchingCampaigns.length * 1;
        level += completedMatchingQuests.length * 2;
        level += activeMatchingQuests.length > 0 ? 1 : 0;
        if (nodeUnlocked) {
          level += nodeLevel > 0 ? nodeLevel : 2;
        }

        const isPurelyDiscovered = (completedMatchingQuests.length === 0 && completedMatchingCampaigns.length === 0 && !nodeUnlocked);
        
        let status = 'Discovered';
        if (isPurelyDiscovered) {
          status = 'Discovered';
        } else if (level >= 25) {
          status = 'Mastered';
        } else if (level >= 15) {
          status = 'Advanced';
        } else if (level >= 10) {
          status = 'Proficient';
        } else if (level >= 5) {
          status = 'Developing';
        } else {
          status = 'Practicing';
        }

        if (status !== 'Mastered') {
          growingCount++;
        }
      }
    });

    // Custom skills count
    savedGoals.forEach(g => {
      if (!g || mappedGoalIds.has(g.id)) return;
      const skillName = g.title.length > 25 ? g.aspiration || g.title : g.title;
      const cleanCustomWords = skillName.toLowerCase().split(' ').filter(w => w.length > 3);
      const customKeywords = [skillName.toLowerCase(), ...cleanCustomWords];

      const completedMatchingQuests = quests.filter(q => 
        q.completed && (checkMatch(q.title, customKeywords) || checkMatch(q.description, customKeywords))
      );

      const isActiveGoal = g.status === 'In Quest' && !g.completed;
      const isCompletedGoal = g.status === 'Triumphant' || g.completed === true;

      let level = 1;
      if (isCompletedGoal) level += 5;
      if (isActiveGoal) level += 1;
      level += completedMatchingQuests.length * 2;

      const isPurelyDiscovered = (completedMatchingQuests.length === 0 && !isCompletedGoal);

      let status = 'Discovered';
      if (isPurelyDiscovered) {
        status = 'Discovered';
      } else if (level >= 25) {
        status = 'Mastered';
      } else if (level >= 15) {
        status = 'Advanced';
      } else if (level >= 10) {
        status = 'Proficient';
      } else if (level >= 5) {
        status = 'Developing';
      } else {
        status = 'Practicing';
      }

      if (status !== 'Mastered') {
        growingCount++;
      }
    });

    return growingCount;
  };

  // Function to count events this week (or fallback events scheduled/created)
  const getEventsThisWeekCount = () => {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    
    // Count quests where the dueDate exists and is within [now - 3 days, now + 4 days] or [now - 7 days, now + 7 days].
    const startOfWeek = new Date(now.getTime() - 3 * oneDay);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(now.getTime() + 4 * oneDay);
    endOfWeek.setHours(23, 59, 59, 999);

    const count = quests.filter(q => {
      if (!q.dueDate) return false;
      try {
        const d = new Date(q.dueDate);
        return d >= startOfWeek && d <= endOfWeek;
      } catch (e) {
        return false;
      }
    }).length;

    if (count > 0) return count;
    
    const sevenDaysAgo = new Date(now.getTime() - 7 * oneDay);
    return quests.filter(q => {
      try {
        const d = new Date(q.createdAt);
        return d >= sevenDaysAgo;
      } catch (e) {
        return true;
      }
    }).length;
  };

  const completedCount = quests.filter(q => q.completed).length;
  const activeCount = quests.filter(q => !q.completed).length;
  const totalCount = quests.length;

  const completedCampaignsCount = goals.filter(g => g.status === 'Triumphant').length;
  const hasFailedCampaign = goals.some(g => g.status === 'Abandoned');
  const unlockedSkillsCount = characterProfile.skillTrees.reduce((acc, tree) => acc + tree.nodes.filter(n => n.level > 0 || n.status === 'unlocked').length, 0);
  const titlesListCount = (characterProfile.earnedTitles || []).length;

  const filteredChronicle = (characterProfile.chronicle || []).map(entry => {
    const hits = entry.bullets.filter(b => 
      b.toLowerCase().includes(chronicleSearch.toLowerCase()) || 
      entry.timeframe.toLowerCase().includes(chronicleSearch.toLowerCase())
    );
    return { ...entry, bullets: hits };
  }).filter(entry => entry.bullets.length > 0);

  if (!currentUser) {
    return (
      <IcarusAuthPortal 
        onLoginSuccess={handleLoginSuccess}
        soundEngine={soundEngine}
      />
    );
  }

  return (
    <div className="min-h-screen text-gray-100 font-sans p-4 md:p-8 bg-gothic-back relative selection:bg-gothic-gold/30 selection:text-white">
      
      {/* Audio Ambient Controller & Logout Portal */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2.5">
        <button
          id="audio-toggle-btn"
          onClick={() => {
            soundEngine.playClick();
            setAudioEnabled(!audioEnabled);
          }}
          className="p-2.5 rounded-lg bg-gothic-card border border-gothic-border hover:border-gothic-gold text-gothic-gold cursor-pointer transition-all active:scale-95 flex items-center gap-2"
          title="Toggle Ambient Sounds"
        >
          {audioEnabled ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
          <span className="font-mono text-[9px] uppercase tracking-widest hidden md:inline">Ambient Synth</span>
        </button>

        <button
          id="logout-btn"
          onClick={handleLogout}
          className="p-2.5 rounded-lg bg-gothic-card border border-gothic-border hover:border-gothic-crimson text-gray-400 hover:text-gothic-crimson cursor-pointer transition-all active:scale-95 flex items-center gap-2"
          title="Depart from ICARUS"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-mono text-[9px] uppercase tracking-widest hidden md:inline">Depart ICARUS</span>
        </button>
      </div>

      <div className="max-w-6xl mx-auto">
        
        {/* ================= HEADER HUD PANEL ================= */}
        <header className="mb-8" id="icarus-header-monument">
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
              activeViewTab === 'The Path' ? `${activeCount} Active Duties • Complete vows to ignite the path` :
              activeViewTab === 'The Ascent' ? `${activeCampaignsCount} Active Campaigns • Charting the high ranges` :
              activeViewTab === 'The Chronicle' ? `${getEventsThisWeekCount()} Deeds Recorded • Keeping the eternal records` :
              activeViewTab === 'The Codex' ? `${getGrowingSkillsCount()} Disciplines Unlocked • Sharpening thy focus` :
              `Level ${Math.floor(characterProfile.xp / 1000) + 1} Ascendant • Evolving thy soul`
            }
          />
        </header>

        {/* ================= ALTAR / COMMUNION COMMUNION SCREENSAVER ================= */}
        <AnimatePresence>
          {isResting ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gothic-back/98 z-50 flex flex-col items-center justify-center p-6 text-center select-none"
            >
              <div className="w-96 h-96">
                <Bonfire 
                  completedCount={completedCount}
                  activeCount={activeCount}
                  isResting={true} 
                  onRest={() => {}} 
                  igniteTrigger={0} 
                />
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="max-w-xl mt-8"
              >
                <span className="font-cinzel text-gothic-gold text-[10px] tracking-widest font-bold block mb-3 uppercase">
                  † Penitent Communion †
                </span>
                <blockquote className="font-cinzel text-lg md:text-xl text-gray-300 italic tracking-wide">
                  "{randomQuote.text}"
                </blockquote>
                <cite className="block text-right font-mono text-[10px] text-gothic-gold mt-2 uppercase">
                  — {randomQuote.author}
                </cite>
              </motion.div>

              <button
                id="leave-altar-btn"
                onClick={() => setIsResting(false)}
                className="mt-12 px-6 py-2 border border-gothic-border hover:border-gothic-gold font-cinzel text-[11px] text-gray-400 hover:text-gothic-gold rounded-full cursor-pointer transition-colors uppercase tracking-widest"
              >
                Depart the bonfire
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* ================= MAIN ROUTED CONTENT VIEWPORT PANEL ================= */}
        <main className="mb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeViewTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
            >
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
                <div className="space-y-6">
                  {/* Calendar view with modal details */}
                  <GothicCalendar 
                    quests={quests}
                    onToggleQuest={handleCompleteQuest}
                    onDeleteQuest={handleDeleteQuest}
                    onSelectDate={(dateString) => {
                      setCalendarSelectedDate(dateString);
                    }}
                  />

                  {/* Searchable Chronicle Archive Timeline */}
                  <div className="p-6 bg-gothic-card rounded-2xl border border-gothic-border relative overflow-hidden" id="chronicle-archives-app">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gothic-border/20 pb-3 mb-5">
                      <h2 className="font-cinzel text-xs font-bold tracking-widest text-gothic-gold uppercase flex items-center gap-1.5 font-black">
                        <BookOpen className="w-4 h-4 text-gothic-gold" />
                        The Personal Chronicle
                      </h2>

                      <div className="relative w-full md:w-64">
                        <span className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-500">
                          🔍
                        </span>
                        <input
                          type="text"
                          placeholder="Search historical records..."
                          value={chronicleSearch}
                          onChange={(e) => setChronicleSearch(e.target.value)}
                          className="w-full bg-gothic-back/90 border border-gothic-border/40 rounded px-2.5 py-1.5 pl-8 text-[9px] font-mono uppercase text-gray-300 focus:outline-none focus:border-gothic-gold"
                          id="chronicle-filter-box-app"
                        />
                      </div>
                    </div>

                    <div className="space-y-5 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
                      {filteredChronicle.length > 0 ? (
                        filteredChronicle.map((ch) => (
                          <div key={ch.id} className="p-3 bg-gothic-back/30 rounded-lg border border-gothic-border/10">
                            <span className="font-cinzel text-[10px] text-gothic-gold-dim uppercase tracking-wider block border-b border-gothic-border/15 pb-1 mb-2 font-bold select-none">
                              ⚔ {ch.timeframe}
                            </span>

                            <ul className="space-y-1.5">
                              {ch.bullets.map((bullet, idx) => (
                                <li key={idx} className="flex gap-2 items-start text-[10px] font-mono text-gray-400 leading-relaxed uppercase">
                                  <span className="text-gothic-gold mt-1 text-[8px]">✦</span>
                                  <span>{bullet}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))
                      ) : (
                        <div className="py-10 text-center text-gray-600 uppercase font-mono text-[9px]">
                          No chronicles found matching search thresholds.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
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
            </motion.div>
          </AnimatePresence>
        </main>

        {/* ================= STICKY BOTTOM 5-TAB APP NAVIGATION BAR ================= */}
        <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-xl bg-gothic-card/95 border-2 border-gothic-gold/25 p-2 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.85)] z-40 backdrop-blur-md flex justify-around items-center">
          {(['The Path', 'The Ascent', 'The Chronicle', 'The Codex', 'The Wanderer'] as const).map((tab) => {
            const isActive = activeViewTab === tab;
            
            let icon = <Compass className="w-4.5 h-4.5" />;
            if (tab === 'The Ascent') icon = <Shield className="w-4.5 h-4.5" />;
            if (tab === 'The Chronicle') icon = <CalendarIcon className="w-4.5 h-4.5" />;
            if (tab === 'The Codex') icon = <BookOpen className="w-4.5 h-4.5" />;
            if (tab === 'The Wanderer') icon = <User className="w-4.5 h-4.5" />;

            return (
              <button
                key={tab}
                id={`bottom-nav-tab-${tab.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => {
                  soundEngine.playClick();
                  setActiveViewTab(tab);
                  
                  // Reload active profiles on tab activation
                  if (tab === 'The Codex' || tab === 'The Wanderer') {
                    const updateProfileRef = getCharacterProfile();
                    setCharacterProfile(updateProfileRef);
                  }
                }}
                className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl cursor-pointer transition-all duration-300 ${
                  isActive 
                    ? 'text-gothic-gold scale-110 font-bold' 
                    : 'text-gray-500 hover:text-white hover:scale-105'
                }`}
              >
                {icon}
                <span className="text-[8px] font-mono uppercase tracking-widest mt-1 hidden sm:block">
                  {isActive ? `† ${tab} †` : tab}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Irreversible Master Purge Decree Modal */}
        <AnimatePresence>
          {showResetConfirmModal && (
            <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="max-w-md w-full bg-gothic-card p-6 rounded-2xl border border-gothic-crimson shadow-[0_0_50px_rgba(220,38,38,0.15)] relative"
              >
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-gothic-crimson" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-gothic-crimson" />

                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gothic-crimson/10 border border-gothic-crimson flex items-center justify-center text-gothic-crimson animate-pulse">
                    <ShieldAlert className="w-8 h-8" />
                  </div>

                  <h3 className="font-cinzel text-lg font-bold tracking-widest text-gothic-crimson uppercase">
                    ⚠️ Absolute Purge Decree ⚠️
                  </h3>

                  <p className="font-mono text-[9.5px] text-gray-400 uppercase tracking-wide leading-relaxed">
                    This critical action is irreversible. Scribes will grind the archives, and the altar will be permanently cleared of:
                  </p>

                  <div className="text-left w-full h-36 overflow-y-auto bg-black/40 border border-gothic-crimson/25 p-3 rounded font-mono text-[9.5px] text-red-400 uppercase space-y-1 scrollbar-thin">
                    <div>† ALL PENDING GOALS</div>
                    <div>† ALL ACTIVE HABITS & ATTEMPTS</div>
                    <div>† ALL RECORDED QUESTS & COVENANTS</div>
                    <div>† ALL EARNED ACHIEVEMENTS</div>
                    <div>† ALL XP & CHARACTER PROGRESS LEVELS</div>
                    <div>† ALL STREAKS, CALENDAR EVENTS & LOGS</div>
                    <div>† THE CHRONICLE JOURNAL ARCHIVES</div>
                  </div>

                  <div className="w-full space-y-2">
                    <label className="block text-[8px] font-mono text-gray-500 uppercase tracking-widest text-center">
                      Type <span className="font-bold text-white px-1 py-0.5 bg-gothic-crimson">CONFIRM RESET</span> to proceed:
                    </label>
                    <input
                      type="text"
                      value={resetConfirmationText}
                      onChange={(e) => setResetConfirmationText(e.target.value)}
                      placeholder="Type confirmation phrase..."
                      className="w-full bg-gothic-back border border-gothic-crimson/40 rounded px-3 py-2 text-center text-xs font-mono tracking-wider font-bold text-white outline-none focus:border-gothic-crimson"
                    />
                  </div>

                  <div className="flex gap-3 w-full">
                    <button
                      type="button"
                      onClick={() => {
                        setShowResetConfirmModal(false);
                        setResetConfirmationText('');
                        soundEngine.playClick();
                      }}
                      className="flex-1 py-2 bg-gothic-back border border-gothic-border text-gray-400 text-[10px] font-mono uppercase tracking-widest hover:text-white rounded cursor-pointer"
                    >
                      Recant Decree
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (resetConfirmationText === 'CONFIRM RESET') {
                          soundEngine.playSoulsClaimed();
                          try {
                            // 1. Send administrative wipe request to the backend server to clear local registry
                            await fetch('/api/auth/wipe-all', { method: 'POST' }).catch(err => {
                              console.warn("Backend local database wipe skip:", err);
                            });

                            // 2. Clear real Firestore records for the active logged-in user
                            if (currentUser && currentUser.id) {
                              const userId = currentUser.id;
                              
                              // Clear subcollections
                              const questsSnap = await getDocs(collection(db, "users", userId, "quests"));
                              const questDeletes = questsSnap.docs.map(doc => deleteDoc(doc.ref));
                              await Promise.all(questDeletes);
                              
                              const goalsSnap = await getDocs(collection(db, "users", userId, "goals"));
                              const goalDeletes = goalsSnap.docs.map(doc => deleteDoc(doc.ref));
                              await Promise.all(goalDeletes);
                              
                              // Delete main doc
                              await deleteDoc(doc(db, "users", userId));
                              
                              // Sign out
                              await signOut(auth);
                            }
                          } catch (err) {
                            console.error("Failed to fully purge database documents: ", err);
                          } finally {
                            purgePerfectGothicState();
                            alert("The purge cycle is complete. Ground has been turned to dust.");
                            window.location.reload();
                          }
                        } else {
                          soundEngine.playSlash();
                          alert("The scribes refuse backdoors. Type exact phrase 'CONFIRM RESET' to proceed.");
                        }
                      }}
                      className="flex-1 py-2 bg-gothic-crimson hover:bg-red-700 text-white text-[10px] font-mono uppercase tracking-widest font-bold rounded flex items-center justify-center gap-1 shadow-[0_0_15px_rgba(220,38,38,0.2)] cursor-pointer"
                    >
                      Commit Wipe
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ================= GOTHIC BENCH BENCH ACCORDION LOWER DECK ================= */}
        <footer className="text-center py-8 border-t border-gothic-border/40">
          <p className="font-cinzel text-[10px] text-gothic-gold-dim uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-gothic-gold" />
            Sorrowful be the heart, Penitent Ashen Knight
          </p>
          <p className="font-mono text-[8px] text-gray-700 uppercase tracking-widest mt-1">
            Pure Dark Todo • Inspired by Blasphemous, Dark Souls & Hollow Knight • Generated entirely using Vectors & Synthesized Web Chimes.
          </p>
        </footer>

      </div>
    </div>
  );
}
