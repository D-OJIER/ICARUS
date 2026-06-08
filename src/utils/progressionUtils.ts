/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { QuestDifficulty, QuestCategory, Quest } from '../types';
import { getLocalDateString, getTodayLocalDateString } from './dateUtils';

export interface CharacterStats {
  strength: number;
  endurance: number;
  discipline: number;
  recovery: number;
  focus: number;
  consistency: number;
  learningSpeed: number;
  resilience: number;
  programming: number;
  mathematics: number;
  finance: number;
  communication: number;
  creativity: number;
  leadership: number;
  networking: number;
  collaboration: number;
}

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  status: 'locked' | 'available' | 'unlocked';
  xp: number;
  requiredXp: number;
  prerequisites: string[]; // ids of prereq nodes
}

export interface SkillTree {
  category: 'Programming' | 'Fitness' | 'Personal Development';
  nodes: SkillNode[];
}

export interface ChronicleEntry {
  id: string;
  timeframe: string; // e.g. "June 2026"
  bullets: string[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'Learning' | 'Fitness' | 'Productivity' | 'Discipline' | 'Exploration' | 'Mastery';
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
  unlocked: boolean;
  unlockedAt?: string;
}

export interface CharacterProfile {
  id?: string;
  name: string;
  title: string;
  xp: number;
  stats: CharacterStats;
  chronicle: ChronicleEntry[];
  skillTrees: SkillTree[];
  achievements: Achievement[];
  earnedTitles: string[];
  lastAssessment?: string;
  lastAssessmentDate?: string;
  accountCreated?: string;
  preferredName?: string;
  dateOfBirth?: string;
  timezone?: string;
  avatarSeed?: string;
  monumentSeed?: string;
  streak?: number;
}

// Initial achievements list
const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach-first',
    name: 'First Liturgical Duty',
    description: 'Inscribe and complete your very first Vow.',
    category: 'Discipline',
    rarity: 'Common',
    unlocked: false
  },
  {
    id: 'ach-habit-heavy',
    name: 'Alchemical Crusader',
    description: 'Survive a 40-Day continuous Habit Cycle without break.',
    category: 'Productivity',
    rarity: 'Epic',
    unlocked: false
  },
  {
    id: 'ach-gym-god',
    name: 'Vessel of Agony',
    description: 'Demonstrate supreme athletic grit under hard trial severe burdens.',
    category: 'Fitness',
    rarity: 'Legendary',
    unlocked: false
  },
  {
    id: 'ach-react-m',
    name: 'Developer Guild Master',
    description: 'Fully master Frontend or AI components inside Programming.',
    category: 'Learning',
    rarity: 'Rare',
    unlocked: false
  },
  {
    id: 'ach-fire-k',
    name: 'bonfire Guardian',
    description: 'Gather and maintain high streak counts above 10.',
    category: 'Discipline',
    rarity: 'Common',
    unlocked: false
  },
  {
    id: 'ach-complete-all',
    name: 'The Miracle Absolute',
    description: 'Earn 30,000 XP in your records.',
    category: 'Mastery',
    rarity: 'Mythic',
    unlocked: false
  }
];

// Initial Skill Trees Structure
const INITIAL_SKILL_TREES: SkillTree[] = [
  {
    category: 'Programming',
    nodes: [
      { id: 'prog-fund', name: 'Programming Fundamentals', description: 'Core principles: logic, types, flow controls', level: 0, maxLevel: 1, status: 'available', xp: 0, requiredXp: 100, prerequisites: [] },
      { id: 'prog-java', name: 'Java Sanctuary', description: 'Strong, robust types & compilations', level: 0, maxLevel: 3, status: 'locked', xp: 0, requiredXp: 200, prerequisites: ['prog-fund'] },
      { id: 'prog-oop', name: 'OOP & Collections', description: 'Polymorphism and efficient structures', level: 0, maxLevel: 3, status: 'locked', xp: 0, requiredXp: 300, prerequisites: ['prog-java'] },
      { id: 'prog-spring', name: 'Spring Boot Castle', description: 'Enterprise backend orchestration', level: 0, maxLevel: 5, status: 'locked', xp: 0, requiredXp: 500, prerequisites: ['prog-oop'] },
      
      { id: 'prog-front', name: 'Frontend Guild', description: 'Inscribing direct canvas styles: HTML & CSS', level: 0, maxLevel: 1, status: 'locked', xp: 0, requiredXp: 150, prerequisites: ['prog-fund'] },
      { id: 'prog-react', name: 'React Componentry', description: 'Unifying flows with UI hooks and state', level: 0, maxLevel: 5, status: 'locked', xp: 0, requiredXp: 350, prerequisites: ['prog-front'] },
      { id: 'prog-next', name: 'NextJS Realm', description: 'Server-side pre-rendering & asset portals', level: 0, maxLevel: 4, status: 'locked', xp: 0, requiredXp: 450, prerequisites: ['prog-react'] },

      { id: 'prog-ai', name: 'AI Engineering', description: 'Communicating with celestial neural oracles', level: 0, maxLevel: 5, status: 'locked', xp: 0, requiredXp: 500, prerequisites: ['prog-fund'] }
    ]
  },
  {
    category: 'Fitness',
    nodes: [
      { id: 'fit-will', name: 'Ritual of Will', description: 'Initiating physical focus parameters', level: 0, maxLevel: 1, status: 'available', xp: 0, requiredXp: 100, prerequisites: [] },
      { id: 'fit-run', name: 'Swift Sentinel Running', description: 'Enhance heart longevity & aerobic speed', level: 0, maxLevel: 5, status: 'locked', xp: 0, requiredXp: 200, prerequisites: ['fit-will'] },
      { id: 'fit-strength', name: 'Iron Forging', description: 'Power training, compound weights and calisthenics', level: 0, maxLevel: 5, status: 'locked', xp: 0, requiredXp: 250, prerequisites: ['fit-will'] },
      { id: 'fit-mobility', name: 'Shadow Reflexes', description: 'Stretching, joints, and spine protection guidance', level: 0, maxLevel: 3, status: 'locked', xp: 0, requiredXp: 180, prerequisites: ['fit-will'] },
      { id: 'fit-nutrition', name: 'Herbology Alchemy', description: 'Proper fasting windows and metabolic clean intake', level: 0, maxLevel: 3, status: 'locked', xp: 0, requiredXp: 200, prerequisites: ['fit-will'] }
    ]
  },
  {
    category: 'Personal Development',
    nodes: [
      { id: 'dev-wake', name: 'Dawn Vigil', description: 'Conquer early morning shadows', level: 0, maxLevel: 1, status: 'available', xp: 0, requiredXp: 100, prerequisites: [] },
      { id: 'dev-time', name: 'Hour Dial Management', description: 'Rigid blocks of deep focused concentration', level: 0, maxLevel: 4, status: 'locked', xp: 0, requiredXp: 180, prerequisites: ['dev-wake'] },
      { id: 'dev-read', name: 'Scroll Reading studies', description: 'Continuous absorption of mystical volumes', level: 0, maxLevel: 5, status: 'locked', xp: 0, requiredXp: 150, prerequisites: ['dev-wake'] },
      { id: 'dev-habit', name: 'Chain of Iron Habits', description: 'Lock in standard repetition frequencies', level: 0, maxLevel: 5, status: 'locked', xp: 0, requiredXp: 200, prerequisites: ['dev-wake'] },
      { id: 'dev-journal', name: 'Annals Inscription', description: 'Daily journaling & high spiritual reflecting', level: 0, maxLevel: 3, status: 'locked', xp: 0, requiredXp: 120, prerequisites: ['dev-wake'] }
    ]
  }
];

const DEFAULT_PROFILE: CharacterProfile = {
  name: 'Ojier',
  title: 'The Forgotten Wanderer',
  xp: 12450, // Starts seasoned as requested in level 37 examples
  stats: {
    strength: 42,
    endurance: 38,
    discipline: 51,
    recovery: 30,
    focus: 45,
    consistency: 40,
    learningSpeed: 48,
    resilience: 50,
    programming: 35,
    mathematics: 20,
    finance: 15,
    communication: 25,
    creativity: 30,
    leadership: 10,
    networking: 8,
    collaboration: 12
  },
  chronicle: [
    {
      id: 'init-chron-1',
      timeframe: 'May 2026',
      bullets: [
        'Arrived at the silent Mausoleum of Vows as a blank slate.',
        'Swore the ancient daily covenants to tame mental shadows.',
        'Successfully completed a study trial streak of 5 continuous days.'
      ]
    },
    {
      id: 'init-chron-2',
      timeframe: 'June 2026',
      bullets: [
        'Maintained active Vigil and earned Developer Rank I.',
        'Completed deepwood code session, bolstering mental programming skills by +3.',
        'Failed to master early dawn wake up, triggering alchemical reflection.'
      ]
    }
  ],
  skillTrees: INITIAL_SKILL_TREES,
  achievements: INITIAL_ACHIEVEMENTS,
  earnedTitles: [
    'The Beginner',
    'The Consistent',
    'The Forgotten Wanderer',
    'Pathfinder'
  ]
};

export function getCurrentUserScopedKey(baseKey: string): string {
  try {
    const savedUser = localStorage.getItem('gothic_current_user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      if (u.id) {
        return `${baseKey}_${u.id}`;
      }
    }
  } catch (e) {
    console.error("Error reading gothic_current_user for key scoping", e);
  }
  return baseKey;
}

export function getDefaultProfileForCurrentUser(): CharacterProfile {
  let name = 'The Wanderer';
  let title = 'Level 1 Pilgrim';
  let userId = '';
  
  try {
    const savedUser = localStorage.getItem('gothic_current_user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      if (u.display_name) name = u.display_name;
      if (u.title) title = u.title;
      if (u.id) userId = u.id;
      if (u.characterProfile) {
        return u.characterProfile;
      }
    }
  } catch (e) {
    console.error("Error reading current user for dynamic default profile", e);
  }

  return {
    id: userId,
    name: name,
    title: title,
    xp: 0,
    stats: {
      strength: 10,
      endurance: 10,
      discipline: 10,
      recovery: 10,
      focus: 10,
      consistency: 10,
      learningSpeed: 10,
      resilience: 10,
      programming: 10,
      mathematics: 10,
      finance: 10,
      communication: 10,
      creativity: 10,
      leadership: 10,
      networking: 10,
      collaboration: 10
    },
    chronicle: [
      {
        id: `init-chron-${Date.now()}`,
        timeframe: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
        bullets: [
          `Awakened in the Hall of Seeds as ${name}.`,
          `Commenced the sacred daily alignment under the sign of Icarus.`
        ]
      }
    ],
    skillTrees: INITIAL_SKILL_TREES,
    achievements: INITIAL_ACHIEVEMENTS,
    earnedTitles: [title],
    streak: 0
  };
}

// Retrieve character profile from localStorage with proper player scoping
export function getCharacterProfile(): CharacterProfile {
  const key = getCurrentUserScopedKey('gothic_character_profile');
  const data = localStorage.getItem(key);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      // Fallback guarantees if new attributes added
      if (!parsed.skillTrees) parsed.skillTrees = INITIAL_SKILL_TREES;
      if (!parsed.achievements) parsed.achievements = INITIAL_ACHIEVEMENTS;
      if (!parsed.earnedTitles) parsed.earnedTitles = DEFAULT_PROFILE.earnedTitles;
      
      // Ensure specific fields exist and are mapped to real user parameters
      if (!parsed.stats) parsed.stats = { ...DEFAULT_PROFILE.stats };
      if (!parsed.chronicle) parsed.chronicle = [];
      if (parsed.streak === undefined) parsed.streak = 0;
      
      return parsed;
    } catch {
      return getDefaultProfileForCurrentUser();
    }
  }
  
  // Seed and return dynamic, real participant profile
  const seed = getDefaultProfileForCurrentUser();
  saveCharacterProfile(seed);
  return seed;
}

// Persist change scoped to active participant in localStorage database
export function saveCharacterProfile(profile: CharacterProfile) {
  const key = getCurrentUserScopedKey('gothic_character_profile');
  localStorage.setItem(key, JSON.stringify(profile));

  // Also propagate sync update to currently cached user context
  try {
    const savedUser = localStorage.getItem('gothic_current_user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      u.characterProfile = profile;
      u.xp = profile.xp;
      u.level = Math.floor((profile.xp || 0) / 1000) + 1;
      u.title = profile.title || u.title;
      u.streak = profile.streak || 0;
      localStorage.setItem('gothic_current_user', JSON.stringify(u));
    }
  } catch (e) {
    console.error("Error propagating profile sync inside local state", e);
  }
}

// Mathematically compute active daily consecutive streak of completing covenants/vows based on actual completed data
export function calculateActualStreak(quests: Quest[]): number {
  if (!quests || quests.length === 0) return 0;

  // Gather unique completed dates in local YYYY-MM-DD
  const completedDates = new Set<string>();
  quests.forEach(q => {
    if (q.completed) {
      const dateStr = q.dueDate ? q.dueDate.substring(0, 10) : (q.createdAt ? q.createdAt.substring(0, 10) : "");
      if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        completedDates.add(dateStr);
      }
    }
  });

  if (completedDates.size === 0) return 0;

  const todayStr = getTodayLocalDateString();
  let currentDate = new Date(todayStr);
  
  // If today is completed, we count starting today.
  // Otherwise, we check if yesterday is completed so that the streak does not break while today is still incomplete.
  let checkDateStr = todayStr;
  if (!completedDates.has(todayStr)) {
    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);
    if (completedDates.has(yesterdayStr)) {
      checkDateStr = yesterdayStr;
      currentDate = yesterday;
    } else {
      // Neither today nor yesterday had any completed vows
      return 0;
    }
  }

  let streak = 0;
  while (true) {
    const dateStr = getLocalDateString(currentDate);
    if (completedDates.has(dateStr)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// Mathematically compute the longest historical consecutive streak of completing daily covenants/vows based strictly on completed data
export function calculateLongestStreak(quests: Quest[]): number {
  if (!quests || quests.length === 0) return 0;

  // Gather unique completed dates in local YYYY-MM-DD
  const completedDates = new Set<string>();
  quests.forEach(q => {
    if (q.completed) {
      const dateStr = q.dueDate ? q.dueDate.substring(0, 10) : (q.createdAt ? q.createdAt.substring(0, 10) : "");
      if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        completedDates.add(dateStr);
      }
    }
  });

  if (completedDates.size === 0) return 0;

  // Sort dates chronologically
  const sortedDates = Array.from(completedDates).sort();

  let longest = 0;
  let current = 0;
  let lastDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const parts = dateStr.split('-');
    const currentDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    
    if (!lastDate) {
      current = 1;
    } else {
      const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        current++;
      } else if (diffDays > 1) {
        if (current > longest) longest = current;
        current = 1;
      }
    }
    lastDate = currentDate;
  }
  
  if (current > longest) longest = current;
  return longest;
}

// Calculate level based on RPG Level Scale
export function calculateLevelInfo(xp: number): {
  level: number;
  xpInCurrentLevel: number;
  xpNeededForNextLevel: number;
  progressPercentage: number;
} {
  // Classic linear-exponential dynamic scaling: Each level requires Level * 1000 XP
  // Total XP needed to reach next level: E.g Level 1 needs 1000 XP, Level 2 needs 2000 more (3000 total)...
  // Let us use a simplified, clean scale: Level = Math.floor(XP / 1000) + 1
  const level = Math.floor(xp / 1000) + 1;
  const xpInCurrentLevel = xp % 1000;
  const xpNeededForNextLevel = 1000;
  const progressPercentage = Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100);

  return {
    level,
    xpInCurrentLevel,
    xpNeededForNextLevel,
    progressPercentage
  };
}

// Reward XP and check Level up
export function rewardXp(points: number): { profile: CharacterProfile; leveledUp: boolean } {
  const profile = getCharacterProfile();
  const oldLevelInfo = calculateLevelInfo(profile.xp);
  
  profile.xp += points;
  const newLevelInfo = calculateLevelInfo(profile.xp);
  
  // Re-verify auto skill unlocked states or available nodes
  reconcileNodeAvailability(profile.skillTrees);
  
  const leveledUp = newLevelInfo.level > oldLevelInfo.level;
  
  // Check for legendary 30,000 XP Mythic achievement
  if (profile.xp >= 30000) {
    unlockAchievementById(profile, 'ach-complete-all');
  }

  saveCharacterProfile(profile);
  return { profile, leveledUp };
}

// Unlock individual skill node manually or via automatic check
export function reconcileNodeAvailability(trees: SkillTree[]) {
  // A node becomes "available" if its prerequisites are all "unlocked" and it is currently "locked"
  for (const tree of trees) {
    for (const node of tree.nodes) {
      if (node.status === 'locked') {
        const prereqs = node.prerequisites;
        const allUnlocked = prereqs.every(pId => {
          const found = tree.nodes.find(n => n.id === pId);
          return found && found.status === 'unlocked';
        });
        if (allUnlocked) {
          node.status = 'available';
        }
      }
    }
  }
}

// Complete individual task node in skill tree
export function unlockSkillNode(treeCategory: string, nodeId: string): CharacterProfile {
  const profile = getCharacterProfile();
  const tree = profile.skillTrees.find(t => t.category === treeCategory);
  if (tree) {
    const node = tree.nodes.find(n => n.id === nodeId);
    if (node && (node.status === 'available' || node.status === 'locked')) {
      node.status = 'unlocked';
      node.level = Math.min(node.level + 1, node.maxLevel);
      
      // Reward stats or change titles based on achievement
      if (nodeId === 'prog-react') {
        profile.stats.programming += 10;
        profile.stats.creativity += 5;
        unlockAchievementById(profile, 'ach-react-m');
      } else if (nodeId === 'fit-strength') {
        profile.stats.strength += 15;
        profile.stats.recovery += 8;
      }
      
      reconcileNodeAvailability(profile.skillTrees);
    }
  }
  saveCharacterProfile(profile);
  return profile;
}

// Allocate AI generated character stat points
export function rewardStatChanges(statChanges: Partial<CharacterStats>, chronicleBullet?: string) {
  const profile = getCharacterProfile();
  
  // Apply changes
  for (const [key, value] of Object.entries(statChanges)) {
    const sKey = key as keyof CharacterStats;
    if (profile.stats[sKey] !== undefined) {
      profile.stats[sKey] = Math.min(Math.max(profile.stats[sKey] + (value || 0), 0), 100);
    }
  }

  // Record bulletin in Chronicle if available
  if (chronicleBullet) {
    addChronicleLog(profile, chronicleBullet);
  }

  saveCharacterProfile(profile);
}

// Unlock an achievement
export function unlockAchievementById(profile: CharacterProfile, id: string): boolean {
  const ach = profile.achievements.find(a => a.id === id);
  if (ach && !ach.unlocked) {
    ach.unlocked = true;
    ach.unlockedAt = getTodayLocalDateString();
    return true;
  }
  return false;
}

// Add a chronicle entry
export function addChronicleLog(profile: CharacterProfile, text: string) {
  const today = new Date();
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const timeframeStr = `${months[today.getMonth()]} ${today.getFullYear()}`;
  
  // Look for matching timeframe log
  let currentMonthEntry = profile.chronicle.find(c => c.timeframe === timeframeStr);
  if (!currentMonthEntry) {
    currentMonthEntry = {
      id: `chron-${Date.now()}`,
      timeframe: timeframeStr,
      bullets: []
    };
    profile.chronicle.unshift(currentMonthEntry);
  }
  
  currentMonthEntry.bullets.unshift(text);
}

// Master global purge & complete database wipe of AI Studio Local state
export function purgePerfectGothicState() {
  localStorage.clear();
  sessionStorage.clear();
}
