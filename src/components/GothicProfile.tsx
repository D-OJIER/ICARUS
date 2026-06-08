/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Trophy, 
  Search, 
  TrendingUp, 
  ShieldAlert, 
  Compass, 
  BookOpen, 
  Zap, 
  Lock, 
  Unlock, 
  Sparkles, 
  CheckCircle2, 
  Award,
  History,
  Activity,
  ChevronRight,
  Flame,
  CornerDownRight,
  RefreshCw,
  MessageSquare,
  Bookmark,
  GitCommit,
  Brain,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { 
  CharacterProfile, 
  calculateLevelInfo, 
  unlockSkillNode, 
  reconcileNodeAvailability,
  addChronicleLog, 
  saveCharacterProfile,
  calculateActualStreak,
  calculateLongestStreak
} from '../utils/progressionUtils';
import { Quest, Goal } from '../types';
import { getTodayLocalDateString } from '../utils/dateUtils';
import { soundEngine } from '../utils/audio';
import { ProceduralAvatar } from './ProceduralAvatar';

interface GothicProfileProps {
  quests: Quest[];
  goals: Goal[];
  goalsCount: number;
  completedGoalsCount: number;
  profile: CharacterProfile;
  onUpdateProfile: (updated: CharacterProfile) => void;
  onReset?: () => void;
  tab: 'The Codex' | 'The Wanderer';
}

export const GothicProfile: React.FC<GothicProfileProps> = ({
  quests,
  goals,
  goalsCount,
  completedGoalsCount,
  profile,
  onUpdateProfile,
  onReset,
  tab
}) => {
  const [chronicleSearch, setChronicleSearch] = useState('');
  const [activeTreeCategory, setActiveTreeCategory] = useState<'Programming' | 'Fitness' | 'Personal Development'>('Programming');
  const [isAssessing, setIsAssessing] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<string | null>(null);

  // Redesigned Skills Tab States
  const [activeSkillTab, setActiveSkillTab] = useState<'growing' | 'mastered'>('growing');
  const [skillSearch, setSkillSearch] = useState('');
  const [skillDomainFilter, setSkillDomainFilter] = useState('All Domains');
  const [skillSortBy, setSkillSortBy] = useState<'level' | 'active' | 'recently_unlocked' | 'mastery' | 'confidence'>('level');
  const [selectedSkill, setSelectedSkill] = useState<any | null>(null);

  // Dynamic Skill recognition engine
  const getRecognizedSkills = () => {
    const savedGoals = goals || [];

    const SKILLS_REGISTRY = [
      {
        id: "swimming",
        name: "Swimming",
        domain: "Fitness",
        keywords: ["swim", "swimming", "pool", "lap", "stroke", "laps", "waters"],
        contributesTo: ["Endurance", "Agility", "Stamina"],
        description: "Navigating deep aquatic thresholds and aerobic fluid masteries.",
        recommendation: "Focus on deep breath synchronization and high lap pacing consistency.",
        nodeId: "fit-swim"
      },
      {
        id: "strength_training",
        name: "Strength Training",
        domain: "Fitness",
        keywords: ["strength", "gym", "lift", "workout", "muscle", "iron", "pushup", "pullup", "squat", "deadlift", "bench"],
        contributesTo: ["Sovereign Strength", "Discipline", "Focus"],
        description: "Commanding mechanical weights and progress load thresholds.",
        recommendation: "Introduce compound tracking on barbell squats and vertical presses.",
        nodeId: "fit-strength"
      },
      {
        id: "physical_conditioning",
        name: "Physical Conditioning",
        domain: "Fitness",
        keywords: ["conditioning", "physical", "body", "cardio", "stamina", "run", "running", "jog"],
        contributesTo: ["Vitality", "Resilience", "Agility"],
        description: "Honing full-body oxygen kinetics, endurance matrices, and physical performance.",
        recommendation: "Engage interval sprints twice weekly to accelerate oxygen intake thresholds.",
        nodeId: "fit-run"
      },
      {
        id: "recovery_management",
        name: "Recovery Management",
        domain: "Fitness",
        keywords: ["recovery", "sleep", "fast", "diet", "nutrition", "stretching", "mobility", "warmup", "fasting"],
        contributesTo: ["Endurance", "Recovery Rate", "Sovereignty"],
        description: "Optimizing restorative rest, cellular fasting, and tissue rebuilding.",
        recommendation: "Deploy a rigorous 8-hour slumber gate and schedule warm stretches.",
        nodeId: "fit-nutrition"
      },
      {
        id: "guitar",
        name: "Guitar",
        domain: "Music",
        keywords: ["guitar", "acoustic", "electric", "strum", "fingerstyle", "fret", "frets", "guitarist"],
        contributesTo: ["Creativity", "Focus", "Dexterity"],
        description: "Orchestrating musical notes and dynamic finger placements on physical strings.",
        recommendation: "Solidify fluid movement across complex minor-seventh flat-five chord gates.",
        nodeId: "music-guitar"
      },
      {
        id: "music_theory",
        name: "Music Theory",
        domain: "Music",
        keywords: ["music", "theory", "chord", "notes", "scales", "harmony", "rhythm", "sound", "harmony", "metronome"],
        contributesTo: ["Wisdom", "Mathematics", "Creativity"],
        description: "Analyzing the mathematical structures, scales, keys, and spatial sound harmonies.",
        recommendation: "Inscribe chord progressions and test transposition variations under a strict metronome.",
        nodeId: "music-theory"
      },
      {
        id: "react",
        name: "React Mastery",
        domain: "Programming",
        keywords: ["react", "jsx", "tsx", "useState", "useEffect", "component", "hook", "state", "props"],
        contributesTo: ["Programming", "Creativity", "Focus"],
        description: "Modern modular SPA orchestrations with reactive hook states.",
        recommendation: "Master customized hook closures or advanced state providers.",
        nodeId: "prog-react"
      },
      {
        id: "frontend_development",
        name: "Frontend Development",
        domain: "Programming",
        keywords: ["html", "css", "tailwind", "ui", "frontend", "web", "layout", "canvas", "element", "viewport"],
        contributesTo: ["Programming", "Creativity", "Design"],
        description: "Transcribing high-fidelity layouts, dark thematic palettes, and responsive grids.",
        recommendation: "Incorporate strict container limits and semantic HTML structures.",
        nodeId: "prog-front"
      },
      {
        id: "component_design",
        name: "Component Design",
        domain: "Programming",
        keywords: ["component", "button", "modal", "card", "combobox", "select", "form", "modular", "reusable"],
        contributesTo: ["Programming", "Creativity", "Collaboration"],
        description: "Encapsulating isolated client markup, atomic properties, and custom components.",
        recommendation: "Deconstruct rich dialogs to reusable atomic properties structure.",
        nodeId: "prog-front"
      },
      {
        id: "public_speaking",
        name: "Public Speaking",
        domain: "Communication",
        keywords: ["speech", "speak", "stage", "audience", "talk", "presentation", "verbal"],
        contributesTo: ["Focus", "Sovereignty", "Wisdom"],
        description: "Commanding focal gazes and projecting vocal dynamics onto general spaces.",
        recommendation: "Structure transitions sequentially with concrete illustrations.",
        nodeId: "comm-speak"
      },
      {
        id: "communication",
        name: "Communication",
        domain: "Communication",
        keywords: ["communication", "team", "write", "writing", "collaborate", "listening", "negotiate", "persuasion"],
        contributesTo: ["Wisdom", "Collaboration", "Leader Rank"],
        description: "Conveying intricate concepts cleanly and resolving dialogue gaps.",
        recommendation: "Introduce absolute active listening cues and summarize core terms.",
        nodeId: "comm-general"
      },
      {
        id: "java",
        name: "Java Fundamentals",
        domain: "Programming",
        keywords: ["java", "class", "inheritance", "polymorphism", "interface", "compiler", "maven", "gradle"],
        contributesTo: ["Programming", "Discipline", "Mathematics"],
        description: "Strongly typed core compilation structures and strict object-oriented paradigms.",
        recommendation: "Leverage decoupled Java records and abstract factory patterns.",
        nodeId: "prog-java"
      },
      {
        id: "oop",
        name: "OOP & Collections",
        domain: "Programming",
        keywords: ["oop", "object-oriented", "collections", "hashmap", "list", "generic", "arraylist"],
        contributesTo: ["Programming", "Mathematics", "Discipline"],
        description: "Structuring complex data models through interfaces, collections, and polymorphism.",
        recommendation: "Transition code flows to modern stream mapping interfaces.",
        nodeId: "prog-oop"
      },
      {
        id: "spring",
        name: "Spring Boot Castle",
        domain: "Programming",
        keywords: ["spring", "boot", "dependency injection", "autowired", "jpa", "controller", "endpoint", "server", "express"],
        contributesTo: ["Programming", "Focus", "Structure"],
        description: "Developing robust server environments, REST API controllers, and database links.",
        recommendation: "Configure stateless JWT verification vaults and audit logger middleware.",
        nodeId: "prog-spring"
      },
      {
        id: "ai",
        name: "AI Engineering",
        domain: "Programming",
        keywords: ["ai", "gemini", "prompt", "model", "neural", "oracle", "nlp", "vector", "api", "scribe", "alchemical assessment"],
        contributesTo: ["Programming", "Learning Speed", "Creativity"],
        description: "Synthesizing generative AI prompt matrices and orchestrating semantic flows.",
        recommendation: "Implement automated pipeline feedback loops and streaming JSON responses.",
        nodeId: "prog-ai"
      },
      {
        id: "reading",
        name: "Deep Reading & Scroll Study",
        domain: "Learning",
        keywords: ["read", "study", "book", "scroll", "literature", "scripture", "paper", "library", "research"],
        contributesTo: ["Learning Speed", "Focus", "Wisdom"],
        description: "Rapid technical reading and memorization of ancient or modern scrolls.",
        recommendation: "Inscribe review cards directly to secure knowledge retention.",
        nodeId: "dev-read"
      },
      {
        id: "time_management",
        name: "Focus & Time Management",
        domain: "Productivity",
        keywords: ["time", "focus", "block", "pomodoro", "hour", "intervals", "distraction", "calendar", "deep"],
        contributesTo: ["Focus", "Discipline", "Consistency"],
        description: "Rigid block planning and defense of deep focus spaces against distractions.",
        recommendation: "Commit to single-task pomodoro structures to prevent mental fragmentation.",
        nodeId: "dev-time"
      },
      {
        id: "habit_consistency",
        name: "Habit Consistency",
        domain: "Productivity",
        keywords: ["habit", "routine", "chain", "streak", "daily", "consistency", "day", "perseverance"],
        contributesTo: ["Consistency", "Discipline", "Resilience"],
        description: "Maintaining unbreakable daily streaks of vows and personal discipline.",
        recommendation: "Rigorously link new target vows to pre-existing sensory cues.",
        nodeId: "dev-habit"
      },
      {
        id: "journaling",
        name: "Journaling & Annals",
        domain: "Creativity",
        keywords: ["journal", "log", "write", "inscription", "annals", "diary", "reflect"],
        contributesTo: ["Creativity", "Recovery", "Resilience"],
        description: "Deep evening reflection and chronicled self-evaluation of accomplishments.",
        recommendation: "Inscribe three absolute daily wins inside the ledger before rest.",
        nodeId: "dev-journal"
      },
      {
        id: "dawn_vigil",
        name: "Dawn Vigil",
        domain: "Lifestyle",
        keywords: ["wake", "morning", "dawn", "sunrise", "vigil", "early", "5am", "6am"],
        contributesTo: ["Discipline", "Consistency", "Focus"],
        description: "Conquering dawn shadows to claim focused quiet hours of sovereignty.",
        recommendation: "Automate sleep triggers thirty minutes early to streamline dawn waking.",
        nodeId: "dev-wake"
      }
    ];

    const checkMatch = (text: string, keywords: string[]) => {
      if (!text) return false;
      const lower = text.toLowerCase();
      return keywords.some(k => lower.includes(k));
    };

    // Keep track of which goals were mapped so we don't duplicate
    const mappedGoalIds = new Set<string>();

    const recognizedSkills = SKILLS_REGISTRY.map(reg => {
      let nodeLevel = 0;
      let nodeUnlocked = false;

      if (profile && profile.skillTrees) {
        for (const tree of profile.skillTrees) {
          const matchingNode = tree.nodes.find(n => n.id === reg.nodeId);
          if (matchingNode) {
            if (matchingNode.status === 'unlocked' || matchingNode.level > 0) {
              nodeUnlocked = true;
              nodeLevel = matchingNode.level;
            }
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

      // AI Discovery Rule: Unlocked Node OR Quest (Active/Completed) OR Campaign (Active/Completed)
      // Display ONLY real, earned or actively/intentionally pursuing skills.
      // Do not display if absolutely no evidence.
      const hasCompletedQuests = completedMatchingQuests.length > 0;
      const hasCompletedCampaigns = completedMatchingCampaigns.length > 0;
      const hasActiveQuests = activeMatchingQuests.length > 0;
      const hasActiveCampaigns = activeMatchingCampaigns.length > 0;

      const hasEvidence = nodeUnlocked || hasCompletedQuests || hasCompletedCampaigns || hasActiveQuests || hasActiveCampaigns;

      if (!hasEvidence) return null;

      // Base Level begins at 1
      let level = 1;
      
      // Calculate levels
      level += completedMatchingCampaigns.length * 5;
      level += activeMatchingCampaigns.length * 1;
      level += completedMatchingQuests.length * 2;
      level += activeMatchingQuests.length > 0 ? 1 : 0;
      if (nodeUnlocked) {
        level += nodeLevel > 0 ? nodeLevel : 2;
      }

      // Check if user has ONLY active things without any completion
      const isPurelyDiscovered = (completedMatchingQuests.length === 0 && completedMatchingCampaigns.length === 0 && !nodeUnlocked);

      // Status lifecycle matching: Discovered -> Practicing -> Developing -> Proficient -> Advanced -> Mastered
      let status: 'Discovered' | 'Practicing' | 'Developing' | 'Proficient' | 'Advanced' | 'Mastered' = 'Discovered';
      let mastery = 0;

      if (isPurelyDiscovered) {
        status = 'Discovered';
        mastery = 0;
      } else if (level >= 25) {
        status = 'Mastered';
        mastery = 100;
      } else if (level >= 15) {
        status = 'Advanced';
        mastery = Math.min(70 + (level - 15) * 2 + completedMatchingQuests.length, 89);
      } else if (level >= 10) {
        status = 'Proficient';
        mastery = Math.min(50 + (level - 10) * 4 + completedMatchingQuests.length, 69);
      } else if (level >= 5) {
        status = 'Developing';
        mastery = Math.min(26 + (level - 5) * 5, 49);
      } else {
        status = 'Practicing';
        mastery = Math.min(10 + (level - 2) * 5, 25);
      }

      // Tab mapping:
      // - Mastered status maps to 'mastered' tab
      // - Discovered, Practicing, Developing, Proficient, Advanced map to 'growing' tab (originally practicing)
      const tabGroup: 'growing' | 'mastered' = (status === 'Mastered') ? 'mastered' : 'growing';

      let aiConfidence = "HIGH";
      const totalEvidencePoints = completedMatchingQuests.length + (completedMatchingCampaigns.length * 3) + (nodeUnlocked ? 3 : 0);
      if (totalEvidencePoints >= 6) {
        aiConfidence = "ABSOLUTE";
      } else if (totalEvidencePoints <= 1) {
        aiConfidence = "MODERATE";
      }

      let assessmentText = `Thy progress in ${reg.name} is developing steadily. `;
      if (status === 'Mastered') {
        assessmentText += `Absolute mastery is validated. Thy exceptional comprehension is a shining shield of resolve.`;
      } else if (status === 'Advanced' || status === 'Proficient') {
        assessmentText += `Thy focus has hollowed out the core complexities. Technique optimization is becoming second nature.`;
      } else if (status === 'Developing') {
        assessmentText += `Component alignment is and continues to expand. Core execution metrics are showing substantial growth.`;
      } else {
        assessmentText += `Evidence has been verified, yet consistent repetition is demanded to forge this into a permanent weapon of intellect.`;
      }
      assessmentText += ` Recommended focus: ${reg.recommendation}`;

      // Source Name
      let sourceName = "Demonstrated Habits & Duties";
      if (activeMatchingCampaigns.length > 0) {
        sourceName = `${activeMatchingCampaigns[0].title} Campaign`;
      } else if (completedMatchingCampaigns.length > 0) {
        sourceName = `${completedMatchingCampaigns[0].title} Campaign (Completed)`;
      } else if (activeMatchingQuests.length > 0) {
        sourceName = `Trial of "${activeMatchingQuests[0].title}"`;
      }

      return {
        ...reg,
        level,
        mastery,
        status,
        tabGroup,
        source: sourceName,
        relatedCampaigns: activeMatchingCampaigns.length + completedMatchingCampaigns.length,
        aiConfidence,
        assessment: assessmentText,
        evidenceList: [
          ...(nodeUnlocked ? ["Unlocked via Alchemist's Skill Tree Node"] : []),
          ...completedMatchingCampaigns.map(c => `Completed Campaign: "${c.title}"`),
          ...activeMatchingCampaigns.map(c => `Active Campaign: "${c.title}"`),
          ...completedMatchingQuests.slice(0, 3).map(q => `Demonstrated Duty: "${q.title}"`),
          ...(completedMatchingQuests.length > 3 ? [`and ${completedMatchingQuests.length - 3} other duties`] : [])
        ],
        recentActivity: hasActiveQuests || hasActiveCampaigns || hasCompletedQuests
      };
    }).filter((s): s is NonNullable<typeof s> => s !== null);

    // Dynamic custom skills mapper: Map any campaign (goal) that wasn't mapped above directly!
    savedGoals.forEach(g => {
      if (!g) return;
      if (mappedGoalIds.has(g.id)) return; // Already covered!

      // Generate a clean skill name
      const skillName = g.title.length > 25 ? g.aspiration || g.title : g.title;
      const skillId = `custom-sc-${g.id}`;

      // Map domain
      let sDomain = g.categoryName || "Lifestyle";
      const availableDomains = ["Programming", "Fitness", "Learning", "Productivity", "Creativity", "Business", "Communication", "Health", "Lifestyle", "Music"];
      const foundDom = availableDomains.find(d => d.toLowerCase() === sDomain.toLowerCase() || sDomain.toLowerCase().includes(d.toLowerCase()));
      if (foundDom) {
        sDomain = foundDom;
      } else {
        sDomain = "Lifestyle";
      }

      // Check quests matching this custom title
      const cleanCustomWords = skillName.toLowerCase().split(' ').filter(w => w.length > 3);
      const customKeywords = [skillName.toLowerCase(), ...cleanCustomWords];
      
      const completedMatchingQuests = quests.filter(q => 
        q.completed && (checkMatch(q.title, customKeywords) || checkMatch(q.description, customKeywords))
      );
      const activeMatchingQuests = quests.filter(q => 
        !q.completed && (checkMatch(q.title, customKeywords) || checkMatch(q.description, customKeywords))
      );

      const isActiveGoal = g.status === 'In Quest' && !g.completed;
      const isCompletedGoal = g.status === 'Triumphant' || g.completed === true;

      let level = 1;
      if (isCompletedGoal) level += 5;
      if (isActiveGoal) level += 1;
      level += completedMatchingQuests.length * 2;
      level += activeMatchingQuests.length > 0 ? 1 : 0;

      const isPurelyDiscovered = (completedMatchingQuests.length === 0 && !isCompletedGoal);

      let status: 'Discovered' | 'Practicing' | 'Developing' | 'Proficient' | 'Advanced' | 'Mastered' = 'Discovered';
      let mastery = 0;

      if (isPurelyDiscovered) {
        status = 'Discovered';
        mastery = 0;
      } else if (level >= 25) {
        status = 'Mastered';
        mastery = 100;
      } else if (level >= 15) {
        status = 'Advanced';
        mastery = Math.min(70 + (level - 15) * 2 + completedMatchingQuests.length, 89);
      } else if (level >= 10) {
        status = 'Proficient';
        mastery = Math.min(50 + (level - 10) * 4 + completedMatchingQuests.length, 69);
      } else if (level >= 5) {
        status = 'Developing';
        mastery = Math.min(26 + (level - 5) * 5, 49);
      } else {
        status = 'Practicing';
        mastery = Math.min(10 + (level - 2) * 5, 25);
      }

      const tabGroup: 'growing' | 'mastered' = (status === 'Mastered') ? 'mastered' : 'growing';

      let aiConfidence = isCompletedGoal || completedMatchingQuests.length >= 3 ? "HIGH" : "MODERATE";
      if (completedMatchingQuests.length >= 6) aiConfidence = "ABSOLUTE";

      const assessmentText = `Thy pursuits in this custom sphere represent a unique covenant of thy sovereign life. Consistent focus is recommended. Recommended focus: Deepen structured progression layers of "${skillName}".`;

      recognizedSkills.push({
        id: skillId,
        name: skillName,
        domain: sDomain,
        keywords: customKeywords,
        contributesTo: ["Sovereignty", "Wisdom", "Focus"],
        description: g.timelineExplanation || `Realized attributes and specialized techniques in thy pursuit of ${skillName}.`,
        recommendation: `Fulfill thy active milestone stages of this custom sphere.`,
        nodeId: null,
        level,
        mastery,
        status,
        tabGroup,
        source: `${g.title} Campaign${isCompletedGoal ? ' (Completed)' : ''}`,
        relatedCampaigns: 1,
        aiConfidence,
        assessment: assessmentText,
        evidenceList: [
          ...(isCompletedGoal ? [`Completed Campaign: "${g.title}"`] : [`Active Campaign: "${g.title}"`]),
          ...completedMatchingQuests.slice(0, 3).map(q => `Demonstrated Duty: "${q.title}"`)
        ],
        recentActivity: isActiveGoal || activeMatchingQuests.length > 0 || completedMatchingQuests.length > 0
      });
    });

    return recognizedSkills;
  };

  // Global quest and habit metrics
  const activeQuests = quests.filter(q => !q.completed);
  const completedQuests = quests.filter(q => q.completed);
  const completedCount = completedQuests.length;
  const totalCount = quests.length;
  const activeCount = activeQuests.length;

  const currentStreak = calculateActualStreak(quests);
  const longestStreak = calculateLongestStreak(quests);

  // Level Information calculated
  const levelInfo = calculateLevelInfo(profile.xp);

  // Filter chronic entries
  const filteredChronicle = profile.chronicle.map(entry => {
    const hits = entry.bullets.filter(b => 
      b.toLowerCase().includes(chronicleSearch.toLowerCase()) || 
      entry.timeframe.toLowerCase().includes(chronicleSearch.toLowerCase())
    );
    return { ...entry, bullets: hits };
  }).filter(entry => entry.bullets.length > 0);

  // Auto assign level ranks
  let curRank = 'Pilgrim';
  if (levelInfo.level >= 45) {
    curRank = 'Master of Virtues';
  } else if (levelInfo.level >= 30) {
    curRank = 'Scholar of the Altar';
  } else if (levelInfo.level >= 15) {
    curRank = 'Covenant Crusader';
  } else if (levelInfo.level >= 5) {
    curRank = 'Pathfinder';
  }

  // Trigger conversational review with Master Scribe
  const handleTriggerAIAssessment = async () => {
    setIsAssessing(true);
    setAssessmentResult(null);
    soundEngine.playSoulsClaimed();

    const activeHabitsCount = quests.filter(q => q.category === 'Habit' && !q.completed).length;
    const completedQuestsList = quests.filter(q => q.completed);

    try {
      const response = await fetch('/api/gemini/profile-assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          title: profile.title,
          xp: profile.xp,
          stats: profile.stats,
          chronicle: profile.chronicle,
          unlockedSkillsCount: profile.skillTrees.flatMap(t => t.nodes).filter(n => n.status === 'unlocked').length,
          unlockedAchievementsCount: profile.achievements.filter(a => a.unlocked).length,
          completedQuests: completedQuestsList
        })
      });

      if (!response.ok) throw new Error('Void interference from oracle');
      
      const res = await response.json();
      
      // Update local profile with suggestions
      const updated = { ...profile };
      
      // Update assessment cache
      updated.lastAssessment = res.assessment;
      updated.lastAssessmentDate = getTodayLocalDateString();

      // Automatically award and activate the recommended title
      if (res.recommendedTitle) {
        updated.title = res.recommendedTitle;
        if (!updated.earnedTitles.includes(res.recommendedTitle)) {
          updated.earnedTitles.push(res.recommendedTitle);
        }
      }

      // Add stat boosts
      if (res.statBoosts) {
        for (const [key, val] of Object.entries(res.statBoosts)) {
          const sKey = key as keyof typeof updated.stats;
          if (updated.stats[sKey] !== undefined) {
            updated.stats[sKey] = Math.min(updated.stats[sKey] + (val as number), 100);
          }
        }
      }

      // Process automated node unlocks dictated by the AI Game Master
      let newlyUnlockedNodes: string[] = [];
      if (res.unlockedNodeIds && Array.isArray(res.unlockedNodeIds)) {
        for (const nodeId of res.unlockedNodeIds) {
          for (const tree of updated.skillTrees) {
            const node = tree.nodes.find(n => n.id === nodeId);
            if (node && node.status !== 'unlocked') {
              node.status = 'unlocked';
              node.level = Math.min(node.level + 1, node.maxLevel);
              newlyUnlockedNodes.push(node.name);
            }
          }
        }
        reconcileNodeAvailability(updated.skillTrees);
      }

      // Add chronicle log of assessment review
      const statChangesStr = Object.entries(res.statBoosts || {})
        .map(([k, v]) => `+${v} ${k.toUpperCase()}`)
        .join(', ');
      
      const skillUnlockMsg = newlyUnlockedNodes.length > 0 
        ? `; revealed Skill Covenants: [${newlyUnlockedNodes.join(', ')}]`
        : '';
      
      addChronicleLog(updated, `Underwent Alchemical Assessment. Game Master appointed thy title to "${res.recommendedTitle || 'Wanderer'}"${skillUnlockMsg}, awarding attributes: [${statChangesStr}].`);

      onUpdateProfile(updated);
      setAssessmentResult(`Assessment Completed!\n\n"${res.assessment}"\n\nRewards Claimed: ${statChangesStr}\nApproved Active Title: "${res.recommendedTitle}"${newlyUnlockedNodes.length > 0 ? `\nSkill Unlocked: ${newlyUnlockedNodes.join(', ')}` : ''}`);
      soundEngine.playSoulsClaimed();

    } catch (err) {
      console.error('AI Profile assessment failure:', err);
      // Fallback
      const updated = { ...profile };
      updated.lastAssessment = "Thy grit continues to withstand the weight of daily vows. Strengthen thy resolve in Programming to unlock higher tiers.";
      updated.lastAssessmentDate = getTodayLocalDateString();
      
      updated.stats.discipline = Math.min(updated.stats.discipline + 2, 100);
      updated.stats.programming = Math.min(updated.stats.programming + 1, 100);

      const fallbackTitle = "The Consistent";
      updated.title = fallbackTitle;
      if (!updated.earnedTitles.includes(fallbackTitle)) {
        updated.earnedTitles.push(fallbackTitle);
      }

      // Try unlocking fundamental programming as a fallback
      for (const tree of updated.skillTrees) {
        const node = tree.nodes.find(n => n.id === 'prog-fund');
        if (node && node.status !== 'unlocked') {
          node.status = 'unlocked';
          node.level = 1;
        }
      }
      reconcileNodeAvailability(updated.skillTrees);

      addChronicleLog(updated, "Completed periodic mental evaluation. Awarded +2 Discipline, +1 Programming. Formulated title 'The Consistent' and unlocked Programming Fundamentals.");
      
      onUpdateProfile(updated);
      setAssessmentResult(`[Offline Alchemy Check] Vows Audited!\n\n"Thy grit continues to withstand the weight of daily vows. Strengthen thy resolve in Programming to unlock higher tiers."\n\nStat Boosts Applied: +2 Discipline, +1 Programming\nTitle Earned: "The Consistent"`);
      soundEngine.playSoulsClaimed();
    } finally {
      setIsAssessing(false);
    }
  };

  // Attempt to unlock a node - Now blocked to force AI-authority unlocks!
  const handleNodeClick = (nodeId: string) => {
    soundEngine.playSlash(); // Play fail swipe
    alert("❌ HOLY COVENANT BOUND: Thy may not unlock skill tree nodes manually! The Grand Mentor Scribe controls progression. Deliver thy evidence of completed quests and habits, then click 'AUDIT PILGRIMS LEDGER' above to let the AI evaluate thy growth and unlock skill pathways.");
  };

  return (
    <div className="space-y-8" id="gothic-rpg-character-sheet">
      
      {/* 1. CHARACTER CARD & PROFILE OVERVIEW HEADER */}
      {tab === 'The Wanderer' && (
        <div className="p-6 bg-gothic-card rounded-2xl border border-gothic-border relative overflow-hidden" id="character-ledger-card">
          <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.02] pointer-events-none">
            <User className="w-full h-full text-white" />
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            {/* Left info */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <div className="relative mb-3 flex justify-center">
                <ProceduralAvatar profile={profile} size={150} />
                <div className="absolute bottom-1 right-1/2 translate-x-1/2 bg-gradient-to-b from-yellow-300 via-gothic-gold to-yellow-600 text-black text-[8px] font-mono px-2 py-0.5 rounded border border-yellow-200/40 font-black tracking-wider shadow-[0_0_15px_rgba(200,158,92,0.6)] uppercase">
                  Lvl {levelInfo.level}
                </div>
              </div>

              <h1 className="font-cinzel text-xl font-bold tracking-wide text-white uppercase flex items-center gap-2">
                {profile.name}
                <span className="text-[9px] border border-gothic-border/60 px-2 py-0.5 font-mono text-gray-400 bg-gothic-back/40 font-normal">
                  {curRank}
                </span>
              </h1>

              <p className="font-cinzel text-[10.5px] font-medium text-gothic-gold tracking-widest mt-1 uppercase">
                † {profile.title} †
              </p>

              {/* Earned Titles Showcase - Informative indicator, non-customizable */}
              <div className="mt-4 text-left">
                <span className="text-[7.5px] font-mono text-gray-500 uppercase tracking-widest block mb-1">
                  Bestowed Scrolls of Honor:
                </span>
                <div className="flex flex-wrap gap-1.5 max-w-sm">
                  {profile.earnedTitles.map((t) => (
                    <span 
                      key={t}
                      className={`px-2 py-0.5 rounded font-mono text-[8px] uppercase tracking-wider border ${
                        profile.title === t 
                          ? 'bg-gothic-gold/20 text-gothic-gold border-gothic-gold/50 font-bold shadow-[0_0_8px_rgba(200,158,92,0.25)]' 
                          : 'bg-gothic-back/40 text-gray-500 border-gothic-border/20'
                      }`}
                    >
                      {t === profile.title ? '🛡 ' : '📜 '} {t}
                    </span>
                  ))}
                </div>
                <span className="text-[7px] font-mono text-gray-600 italic block mt-1.5 uppercase">
                  * Titles and honors are granted solely by the AI Mentor's assessments.
                </span>
              </div>
            </div>

            {/* Right level / experience parameters block */}
            <div className="w-full md:w-72 space-y-2">
              <div className="flex justify-between items-end text-[9px] font-mono uppercase">
                <span className="text-gray-500">Exp. points</span>
                <span className="text-gothic-gold font-bold">
                  {levelInfo.xpInCurrentLevel} / {levelInfo.xpNeededForNextLevel} XP ({profile.xp} Total)
                </span>
              </div>

              <div className="h-2 bg-gothic-back border border-gothic-border/40 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-700 via-gothic-gold to-yellow-500 transition-all duration-500"
                  style={{ width: `${levelInfo.progressPercentage}%` }}
                />
              </div>

              <p className="text-[7.5px] font-mono text-gray-500 text-right uppercase tracking-widest leading-normal">
                Accumulate XP to climb levels and unlock forbidden skill covenants.
              </p>
            </div>
          </div>

          {/* PROGRESS METRICS HUD MATRIX */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gothic-border/15">
            <div className="p-3 bg-gothic-back/30 border border-gothic-border/10 rounded-xl text-center">
              <span className="text-[16px] font-mono text-gothic-sky font-bold block leading-none">
                {goalsCount}
              </span>
              <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest block mt-1">
                Active Goals
              </span>
            </div>

            <div className="p-3 bg-gothic-back/30 border border-gothic-border/10 rounded-xl text-center">
              <span className="text-[16px] font-mono text-gothic-gold font-bold block leading-none">
                {quests.filter(q => q.category === 'Habit').length}
              </span>
              <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest block mt-1">
                Active Habits
              </span>
            </div>

            <div className="p-3 bg-gothic-back/30 border border-gothic-border/10 rounded-xl text-center">
              <span className="text-[16px] font-mono text-green-500 font-bold block leading-none">
                {completedCount}
              </span>
              <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest block mt-1">
                Completed Quests
              </span>
            </div>

            <div className="p-3 bg-gothic-back/40 border border-gothic-crimson/25 rounded-xl text-center shadow-[inset_0_0_8px_rgba(154,23,23,0.15),_0_0_15px_rgba(154,23,23,0.1)] hover:border-gothic-crimson/40 transition-colors duration-300">
              <span className="text-[16px] font-mono text-gothic-crimson font-bold block leading-none drop-shadow-[0_0_4px_rgba(154,23,23,0.4)] animate-pulse-blood">
                {longestStreak} Days
              </span>
              <span className="text-[8px] font-mono text-gothic-crimson/70 uppercase tracking-widest block mt-1 font-semibold">
                Longest Streak
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. DYNAMIC REALIZED SKILLS LEDGER */}
      {tab === 'The Codex' && (
        <>
          <div className="p-4 sm:p-5 md:p-6 bg-gothic-card rounded-2xl border border-gothic-border relative overflow-hidden" id="skill-tree-complex">
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-gothic-gold/30" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-gothic-gold/30" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-gothic-gold/30" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-gothic-gold/30" />

        <div className="space-y-5">
          {/* Header & Main Core Navigation */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gothic-border/20 pb-4">
            <div className="space-y-1">
              <h2 className="font-cinzel text-xs font-bold tracking-widest text-gothic-gold uppercase flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-gothic-gold animate-pulse text-shrink-0" />
                Realized Covenants of Growth
              </h2>
              <p className="text-[7.5px] font-mono text-gray-500 uppercase tracking-widest leading-none">
                Verified attributes & demonstrated dynamic skills
              </p>
            </div>

            {/* RPG Top Navigation Tab Selector */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setActiveSkillTab('growing');
                  soundEngine.playClick();
                }}
                className={`px-3 py-1 bg-gothic-back/40 font-mono text-[9px] font-medium uppercase tracking-widest transition-all rounded border ${
                  activeSkillTab === 'growing'
                    ? 'text-gothic-gold border-gothic-gold/50 bg-gothic-gold/5 shadow-[0_0_12px_rgba(200,158,92,0.1)]'
                    : 'text-gray-500 border-transparent hover:text-gray-300'
                }`}
                title="Skills currently being active and growing (Discovered, Practicing, Developing, Proficient, Advanced)"
              >
                [ Growing ]
              </button>
              <button
                onClick={() => {
                  setActiveSkillTab('mastered');
                  soundEngine.playClick();
                }}
                className={`px-3 py-1 bg-gothic-back/40 font-mono text-[9px] font-medium uppercase tracking-widest transition-all rounded border ${
                  activeSkillTab === 'mastered'
                    ? 'text-gothic-gold border-gothic-gold/50 bg-gothic-gold/5 shadow-[0_0_12px_rgba(200,158,92,0.1)]'
                    : 'text-gray-500 border-transparent hover:text-gray-300'
                }`}
                title="Subconscious masteries finalized into permanent covenants of absolute capability"
              >
                [ Mastered ]
              </button>
            </div>
          </div>

          {/* Search, Domain Filters & Sort Controls Bar */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-gothic-back/50 p-2.5 rounded-xl border border-gothic-border/10">
            {/* Search inputs */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search recognized skills..."
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                className="w-full bg-gothic-back/90 text-white font-mono text-[9.5px] uppercase tracking-wider pl-8 pr-3 py-1.5 rounded-lg border border-gothic-border/20 placeholder-gray-650 focus:outline-none focus:border-gothic-gold/40 focus:ring-1 focus:ring-gothic-gold/10 transition-all font-semibold"
              />
            </div>

            {/* Dropdowns group */}
            <div className="flex gap-2">
              {/* Domain Switcher */}
              <div className="relative flex-1 sm:flex-initial min-w-[110px]">
                <select
                  value={skillDomainFilter}
                  onChange={(e) => {
                    setSkillDomainFilter(e.target.value);
                    soundEngine.playClick();
                  }}
                  className="w-full bg-gothic-back/95 text-gothic-gold font-mono text-[8.5px] uppercase tracking-widest pl-2.5 pr-8 py-1.5 rounded-lg border border-gothic-border/20 appearance-none focus:outline-none focus:border-gothic-gold/40 cursor-pointer text-center font-bold"
                >
                  {["All Domains", "Programming", "Fitness", "Music", "Communication", "Learning", "Productivity", "Creativity", "Lifestyle"].map((dom) => (
                    <option key={dom} value={dom} className="bg-gothic-card text-white font-semibold">
                      {dom}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-gothic-gold absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-80" />
              </div>

              {/* Sort selector dropdown */}
              <div className="relative flex-1 sm:flex-initial min-w-[125px]">
                <select
                  value={skillSortBy}
                  onChange={(e) => {
                    setSkillSortBy(e.target.value as any);
                    soundEngine.playClick();
                  }}
                  className="w-full bg-gothic-back/95 text-gothic-gold font-mono text-[8.5px] uppercase tracking-widest pl-2.5 pr-8 py-1.5 rounded-lg border border-gothic-border/20 appearance-none focus:outline-none focus:border-gothic-gold/40 cursor-pointer text-center font-bold"
                >
                  <option value="level" className="bg-gothic-card text-white">Tier Level ⚔️</option>
                  <option value="active" className="bg-gothic-card text-white">Most Active ⚡</option>
                  <option value="recently_unlocked" className="bg-gothic-card text-white">Newest Earned 🔑</option>
                  <option value="mastery" className="bg-gothic-card text-white">Mastery Ratio 📈</option>
                  <option value="confidence" className="bg-gothic-card text-white">AI Confidence ☄️</option>
                </select>
                <SlidersHorizontal className="w-3 h-3 text-gothic-gold absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-80" />
              </div>
            </div>
          </div>

          {/* Core Dynamic Content Hub */}
          <div>
            {(() => {
              const detectedList = getRecognizedSkills();
              
              // Filter operations
              const filteredList = detectedList.filter(s => {
                const matchesTab = s.tabGroup === activeSkillTab;
                const matchesSearch = s.name.toLowerCase().includes(skillSearch.toLowerCase()) || 
                                      s.description.toLowerCase().includes(skillSearch.toLowerCase());
                const matchesDomain = skillDomainFilter === 'All Domains' ? true : s.domain === skillDomainFilter;
                return matchesTab && matchesSearch && matchesDomain;
              });

              // Sort operations
              const sortedList = [...filteredList].sort((a, b) => {
                if (skillSortBy === 'level') return b.level - a.level;
                if (skillSortBy === 'mastery') return b.mastery - a.mastery;
                if (skillSortBy === 'active') {
                  if (a.recentActivity && !b.recentActivity) return -1;
                  if (!a.recentActivity && b.recentActivity) return 1;
                  return b.level - a.level;
                }
                if (skillSortBy === 'recently_unlocked') {
                  return b.evidenceList.length - a.evidenceList.length;
                }
                if (skillSortBy === 'confidence') {
                  const confIndex: Record<string, number> = { "ABSOLUTE": 3, "HIGH": 2, "MODERATE": 1 };
                  return confIndex[b.aiConfidence] - confIndex[a.aiConfidence];
                }
                return 0;
              });

              if (sortedList.length === 0) {
                return (
                  <div className="py-12 px-6 bg-gothic-back/40 rounded-xl border border-gothic-border/10 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-gothic-back/60 border border-gothic-border/20 flex items-center justify-center text-gray-600">
                      <Lock className="w-5 h-5 opacity-40" />
                    </div>
                    <h3 className="font-cinzel text-xs font-bold tracking-widest text-gray-400 uppercase">
                      No Recognized Skills in [ {activeSkillTab === 'growing' ? 'Growing' : 'Mastered'} ]
                    </h3>
                    <p className="font-mono text-[9px] text-gray-500 max-w-sm uppercase tracking-wide leading-relaxed">
                      {activeSkillTab === 'growing' 
                        ? "Initiate campaigns or tasks to discover new skills today. No locked placeholders are displayed."
                        : "Sovereign masteries will crystallize here once thy skill stages achieve full absolute completion."}
                    </p>
                  </div>
                );
              }

              const getStatusBadgeStyle = (status: string) => {
                switch (status) {
                  case 'Discovered':
                    return 'text-slate-400 border-slate-500/20 bg-slate-500/5';
                  case 'Practicing':
                    return 'text-orange-400 border-orange-500/20 bg-orange-500/5';
                  case 'Developing':
                    return 'text-sky-400 border-sky-400/20 bg-sky-400/5';
                  case 'Proficient':
                    return 'text-indigo-400 border-indigo-400/20 bg-indigo-400/5';
                  case 'Advanced':
                    return 'text-purple-400 border-purple-400/20 bg-purple-400/5';
                  case 'Mastered':
                    return 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5';
                  default:
                    return 'text-gothic-gold border-gothic-gold/20 bg-gothic-gold/5';
                }
              };

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {sortedList.map(skill => {
                    return (
                      <motion.div
                        key={skill.id}
                        layoutId={`skill-card-${skill.id}`}
                        onClick={() => {
                          soundEngine.playClick();
                          setSelectedSkill(skill);
                        }}
                        whileHover={{ scale: 1.015 }}
                        className="p-3.5 bg-gothic-back/60 hover:bg-gothic-back/90 border border-gothic-border/15 hover:border-gothic-gold/30 rounded-xl cursor-pointer transition-all duration-300 relative group flex flex-col justify-between"
                      >
                        {/* Interactive Highlight */}
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gothic-gold/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0 flex-1">
                              <span className="text-[7px] font-mono text-gray-500 uppercase tracking-widest block font-bold">
                                ⚜️ {skill.domain}
                              </span>
                              <h4 className="font-cinzel text-[11px] font-bold text-white uppercase tracking-wider truncate group-hover:text-gothic-gold transition-colors block mt-0.5">
                                {skill.name}
                              </h4>
                            </div>
                            <span className="font-mono text-[10px] font-black text-gothic-sky bg-gothic-sky/5 border border-gothic-sky/15 px-1.5 py-0.5 rounded leading-none">
                              Lvl {skill.level}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {/* Proportional progression display indicator bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[7.5px] font-mono text-gray-500">
                                <span className="uppercase">Progress Matrix</span>
                                <span className="text-white font-bold">{skill.mastery}%</span>
                              </div>
                              <div className="h-1 bg-gothic-back rounded-full overflow-hidden border border-gothic-border/5">
                                <div 
                                  className="h-full bg-gradient-to-r from-gothic-sky/50 to-gothic-sky transition-all duration-500"
                                  style={{ width: `${skill.mastery}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center border-t border-gothic-border/10 pt-2.5 mt-3 gap-2">
                          <span className="inline-flex items-center gap-0.5 text-[7px] font-mono text-gray-500 uppercase tracking-wider truncate max-w-[150px]">
                            ⚓ {skill.source}
                          </span>

                          <span className={`text-[6.5px] font-mono uppercase tracking-widest font-black px-1.5 py-0.5 rounded border shrink-0 ${getStatusBadgeStyle(skill.status)}`}>
                            {skill.status}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* DETAILED COVENANT ASSESSMENT OVERLAY MODAL */}
      <AnimatePresence>
        {selectedSkill && (
          <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              layoutId={`skill-card-${selectedSkill.id}`}
              className="max-w-md w-full bg-gothic-card p-5 sm:p-6 rounded-2xl border-2 border-gothic-gold/30 shadow-[0_0_50px_rgba(0,0,0,0.95)] relative space-y-5"
            >
              {/* Cathedral Frame Ends */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-gothic-gold" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-gothic-gold" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-gothic-gold" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-gothic-gold" />

              <div className="flex justify-between items-start gap-3 border-b border-gothic-border/20 pb-3">
                <div>
                  <span className="text-[7.5px] font-mono text-gothic-gold uppercase tracking-widest font-bold font-semibold">
                    🛡️ Verified Growth Sphere
                  </span>
                  <h3 className="font-cinzel text-base font-bold text-white uppercase tracking-widest block mt-1">
                    {selectedSkill.name}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    setSelectedSkill(null);
                  }}
                  className="text-gray-500 hover:text-white font-mono text-[10px] uppercase tracking-widest px-2 py-1 hover:bg-gothic-back rounded-lg border border-transparent hover:border-gothic-border/20 cursor-pointer"
                >
                  [ Dismiss ]
                </button>
              </div>

              {/* 1. OVERVIEW AREA */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-gothic-back/40 rounded-xl border border-gothic-border/15">
                  <span className="text-[7px] font-mono text-gray-500 uppercase tracking-widest block">
                    Lifecycle Stage
                  </span>
                  <span className="text-[10px] font-cinzel font-black text-gothic-sky uppercase block mt-1">
                    ★ {selectedSkill.status}
                  </span>
                </div>
                <div className="p-2.5 bg-gothic-back/40 rounded-xl border border-gothic-border/15">
                  <span className="text-[7px] font-mono text-gray-500 uppercase tracking-widest block">
                    Oracle Score Matrix
                  </span>
                  <span className="text-[10.5px] font-mono text-white block mt-1 font-bold">
                    Tier {selectedSkill.level} ({selectedSkill.mastery}% mastery)
                  </span>
                </div>
              </div>

              {/* 2. VERIFIED EVIDENCE SECTION */}
              <div className="space-y-1.5">
                <h4 className="font-cinzel text-[9.5px] font-bold text-gothic-gold uppercase tracking-widest flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-gothic-gold shrink-0 animate-pulse" />
                  Demonstrated Evidence
                </h4>
                <div className="bg-gothic-back/70 rounded-xl p-3 border border-gothic-border/20 space-y-2">
                  <p className="text-[8px] font-mono text-gray-400 uppercase tracking-wide leading-relaxed">
                    The Scribe recorded these completed actions & intentions as proof of thy training:
                  </p>
                  <ul className="space-y-1.5">
                    {selectedSkill.evidenceList.map((ev: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5 text-[8.5px] font-mono text-white leading-normal">
                        <span className="text-gothic-gold shrink-0">†</span>
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 3. RELATED STATS */}
              <div className="space-y-1.5">
                <h4 className="font-cinzel text-[9.5px] font-bold text-gothic-gold uppercase tracking-widest flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-gothic-gold" />
                  Related Core Attributes
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSkill.contributesTo.map((stat: string) => (
                    <span 
                      key={stat} 
                      className="px-2 py-0.5 bg-gothic-back/50 border border-gothic-border/15 rounded text-[8px] font-mono text-gray-400 uppercase tracking-wider"
                    >
                      {stat} Attribute +Rank
                    </span>
                  ))}
                  <span 
                    className="px-2 py-0.5 bg-gothic-sky/10 border border-gothic-sky/20 rounded text-[8px] font-mono text-gothic-sky uppercase tracking-wider"
                  >
                    AI CONFIDENCE: {selectedSkill.aiConfidence}
                  </span>
                </div>
              </div>

              {/* 4. AI ASSESSMENT BLOCK */}
              <div className="space-y-1.5">
                <h4 className="font-cinzel text-[9.5px] font-bold text-gothic-gold uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-gothic-gold" />
                  Scribe's AI Assessment
                </h4>
                <div className="bg-gothic-back/90 rounded-xl p-3 border border-gothic-gold/15 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 opacity-5 pointer-events-none">
                    <Brain className="w-full h-full text-gothic-gold" />
                  </div>
                  <p className="text-[8.5px] font-mono text-gothic-gold/90 leading-normal uppercase tracking-wide">
                    {selectedSkill.assessment}
                  </p>
                </div>
              </div>

              {/* Action and Dismiss btn */}
              <div className="flex justify-end pt-2 border-t border-gothic-border/10">
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    setSelectedSkill(null);
                  }}
                  className="w-full bg-gradient-to-r from-gothic-gold/10 to-gothic-gold/20 hover:from-gothic-gold/20 hover:to-gothic-gold/30 text-gothic-gold text-[9.5px] font-mono uppercase tracking-widest py-2 rounded-xl border border-gothic-gold/30 hover:border-gothic-gold/50 cursor-pointer transition-all text-center font-bold"
                >
                  Close Scroll of Assess
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </>
      )}

      {/* 3. AI ASSESSMENT ENGINE & EVOLVING STATS */}
      {tab === 'The Wanderer' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CHARACTER STATS GROUP CARD */}
        <div className="p-6 bg-gothic-card rounded-2xl border border-gothic-border md:col-span-2 space-y-4">
          <h2 className="font-cinzel text-xs font-bold tracking-widest text-gothic-gold uppercase flex items-center gap-1.5 border-b border-gothic-border/20 pb-2">
            <Activity className="w-4 h-4 text-gothic-gold" />
            Character Attributes
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3.5">
            {/* Translate list of items */}
            {Object.entries(profile.stats).map(([statName, val]) => {
              const valNum = val as number;
              // Convert camel case to beautiful literal spaces
              const label = statName.replace(/([A-Z])/g, ' $1').toUpperCase();
              
              // Map colors based on category
              let colorBar = 'bg-gothic-gold';
              if (['strength', 'endurance', 'discipline', 'recovery'].includes(statName)) {
                colorBar = 'bg-gothic-crimson';
              } else if (statName === 'programming') {
                colorBar = 'bg-gothic-sky';
              }

              // Stat ranks mapped out
              let rankName = 'Novice';
              if (valNum >= 90) rankName = 'Master';
              else if (valNum >= 70) rankName = 'Expert';
              else if (valNum >= 45) rankName = 'Adept';
              else if (valNum >= 25) rankName = 'Apprentice';

              return (
                <div key={statName} className="space-y-1">
                  <div className="flex justify-between items-end text-[8.5px] font-mono uppercase">
                    <span className="text-gray-400 font-bold">{label}</span>
                    <span className="text-gray-500 font-semibold">{rankName} ({valNum}/100)</span>
                  </div>
                  
                  <div className="h-1.5 bg-gothic-back rounded-sm overflow-hidden border border-gothic-border/10">
                    <div 
                      className={`h-full ${colorBar} transition-all duration-500`}
                      style={{ width: `${valNum}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI PERIODIC ASSESSMENT CONTROL */}
        <div className="p-6 bg-gothic-card rounded-2xl border border-gothic-border flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-gothic-gold-dim">
              <MessageSquare className="w-4 h-4 text-gothic-gold" />
              <span className="font-cinzel text-[10px] uppercase tracking-widest font-bold">AI Examiner</span>
            </div>
            
            <p className="text-[10px] font-mono text-gray-400 leading-relaxed uppercase">
              The Grand Examiner audits thy complete performance list to reward stat points, customize advanced titles, and counsel pacing.
            </p>

            {profile.lastAssessment ? (
              <div className="p-3 bg-gothic-back/40 border border-gothic-border/10 rounded-lg space-y-1">
                <span className="text-[6.5px] font-mono text-gray-500 uppercase block font-bold">
                  LAST INSPECTION: {profile.lastAssessmentDate}
                </span>
                <span className="text-[9.5px] font-mono text-gothic-gold block leading-relaxed italic">
                  "{profile.lastAssessment}"
                </span>
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <button
              onClick={handleTriggerAIAssessment}
              disabled={isAssessing}
              className="w-full py-2 bg-gothic-gold text-black text-[10px] uppercase font-mono font-bold tracking-widest hover:bg-yellow-500 transition-colors flex items-center justify-center gap-1.5"
            >
              {isAssessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Inspecting Soul...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  Perform Assessment
                </>
              )}
            </button>

            {/* Display output report card dialog modal */}
            <AnimatePresence>
              {assessmentResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-3 p-3 bg-gothic-back border border-gothic-gold/30 rounded-lg text-left"
                >
                  <div className="flex justify-between items-center border-b border-gothic-border/20 pb-1 mb-1.5">
                    <span className="text-[7.5px] font-mono text-gothic-gold uppercase tracking-wider font-bold">
                      CRUCIBLE INSCRIPTION SUCCESS
                    </span>
                    <button 
                      onClick={() => setAssessmentResult(null)}
                      className="text-[9px] font-mono text-gray-500 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  <pre className="text-[9.5px] font-mono text-gray-300 whitespace-pre-wrap leading-relaxed uppercase">
                    {assessmentResult}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    )}

      {/* 5. THE ACHIEVEMENTS HALL */}
      {tab === 'The Wanderer' && (
        <>
          <div className="p-6 bg-gothic-card rounded-2xl border border-gothic-border relative overflow-hidden" id="achievements-ledger">
        <h2 className="font-cinzel text-xs font-bold tracking-widest text-gothic-gold uppercase mb-5 flex items-center gap-1.5 border-b border-gothic-border/20 pb-3">
          <Award className="w-4 h-4 text-gothic-gold animate-pulse" />
          The Achievements hall
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profile.achievements.map((ach) => {
            const unlocked = ach.unlocked;
            
            // Map rarity glow styles
            let cardStyle = 'border-gothic-border/20 text-gray-600 bg-gothic-card/20 filter grayscale';
            let glowBadge = 'text-gray-500 bg-gothic-back/50 border-gothic-border/20';

            if (unlocked) {
              if (ach.rarity === 'Mythic') {
                cardStyle = 'border-purple-600/40 text-purple-400 bg-purple-950/5 shadow-[0_0_15px_rgba(168,85,247,0.1)]';
                glowBadge = 'text-purple-400 bg-purple-950/20 border-purple-500/35';
              } else if (ach.rarity === 'Legendary') {
                cardStyle = 'border-orange-600/40 text-orange-400 bg-orange-950/5 shadow-[0_0_15px_rgba(234,88,12,0.1)]';
                glowBadge = 'text-orange-400 bg-orange-950/20 border-orange-500/35';
              } else if (ach.rarity === 'Epic') {
                cardStyle = 'border-gothic-gold-dim text-gothic-gold bg-gothic-gold/5 shadow-[0_0_12px_rgba(200,158,92,0.08)]';
                glowBadge = 'text-gothic-gold bg-gothic-gold/15 border-gothic-gold/25';
              } else {
                cardStyle = 'border-gothic-sky/30 text-gothic-sky bg-gothic-sky/5';
                glowBadge = 'text-gothic-sky bg-gothic-sky/15 border-gothic-sky/25';
              }
            }

            return (
              <div 
                key={ach.id} 
                className={`p-4 border rounded-xl flex items-start gap-3 transition-all ${cardStyle}`}
                id={`achievement-card-${ach.id}`}
              >
                <div className="mt-0.5">
                  <div className={`w-10 h-10 rounded-full border flex items-center justify-center flex-shrink-0 ${glowBadge}`}>
                    <Trophy className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-1 uppercase select-none">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] font-cinzel font-bold font-medium tracking-wide ${unlocked ? 'text-white' : 'text-gray-600'}`}>
                      {ach.name}
                    </span>
                    <span className="text-[6.5px] font-mono rounded px-1 border border-current font-bold">
                      {ach.rarity}
                    </span>
                  </div>

                  <p className="text-[9px] font-mono text-gray-500 leading-normal">
                    {ach.description}
                  </p>

                  {unlocked && ach.unlockedAt && (
                    <span className="text-[7px] font-mono text-gray-500 block">
                      Unlocked: {ach.unlockedAt}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. ABSOLUTE PENANCE PURGE DIVISION */}
      <div className="p-6 bg-gothic-card rounded-2xl border border-gothic-border/30 relative overflow-hidden flex flex-col sm:flex-row justify-between items-center gap-4 mt-6" id="purge-division">
        <div className="text-left font-sans">
          <h2 className="font-cinzel text-xs font-bold tracking-widest text-gothic-crimson uppercase flex items-center gap-1.5 font-black">
            <ShieldAlert className="w-4 h-4 text-gothic-crimson" />
            The Ultimate Absolution
          </h2>
          <p className="font-mono text-[8.5px] text-gray-500 uppercase mt-1 leading-relaxed max-w-md">
            Wipe thy records clean. To shatter thy current penance and begin anew, invoke the decree of ultimate departure.
          </p>
        </div>

        <button
          onClick={() => {
            soundEngine.playClick();
            if (onReset) onReset();
          }}
          className="px-6 py-2.5 bg-gothic-back hover:bg-gothic-crimson/15 border-2 border-gothic-crimson/50 hover:border-gothic-crimson text-gothic-crimson text-[9.5px] font-mono tracking-widest uppercase font-black rounded-lg transition-all cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.05)] active:scale-95 shrink-0"
          id="purge-enough-btn"
        >
          † Enough †
        </button>
      </div>
        </>
      )}

    </div>
  );
};
