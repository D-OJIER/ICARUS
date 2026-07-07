import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  StyleSheet, 
  Dimensions, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { 
  User, 
  Trophy, 
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
  Activity,
  MessageSquare,
  RefreshCw,
  Search,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react-native';
import { 
  CharacterProfile, 
  calculateLevelInfo, 
  reconcileNodeAvailability,
  addChronicleLog, 
  calculateActualStreak,
  calculateLongestStreak 
} from '../utils/progressionUtils';
import { Quest, Goal } from '../types';
import { getTodayLocalDateString } from '../utils/dateUtils';
import { soundEngine } from '../utils/audio';
import { ProceduralAvatar } from './ProceduralAvatar';
import { generateProfileAssessment, getApiKey } from '../utils/aiEngine';
import { COLORS, FONTS } from '../theme';

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
  const [activeSkillTab, setActiveSkillTab] = useState<'growing' | 'mastered'>('growing');
  const [skillSearch, setSkillSearch] = useState('');
  const [skillDomainFilter, setSkillDomainFilter] = useState('All Domains');
  const [skillSortBy, setSkillSortBy] = useState<'level' | 'active' | 'recently_unlocked' | 'mastery' | 'confidence'>('level');
  const [selectedSkill, setSelectedSkill] = useState<any | null>(null);

  const [isAssessing, setIsAssessing] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<string | null>(null);

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
        keywords: ["ai", "ai", "prompt", "model", "neural", "oracle", "nlp", "vector", "api", "scribe", "alchemical assessment"],
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
        const matches = g.status === 'Triumphant' && 
          (checkMatch(g.title, reg.keywords) || checkMatch(g.aspiration, reg.keywords));
        if (matches) mappedGoalIds.add(g.id);
        return matches;
      });

      const activeMatchingCampaigns = savedGoals.filter(g => {
        const matches = g.status === 'In Quest' && 
          (checkMatch(g.title, reg.keywords) || checkMatch(g.aspiration, reg.keywords));
        if (matches) mappedGoalIds.add(g.id);
        return matches;
      });

      const hasCompletedQuests = completedMatchingQuests.length > 0;
      const hasCompletedCampaigns = completedMatchingCampaigns.length > 0;
      const hasActiveQuests = activeMatchingQuests.length > 0;
      const hasActiveCampaigns = activeMatchingCampaigns.length > 0;

      const hasEvidence = nodeUnlocked || hasCompletedQuests || hasCompletedCampaigns || hasActiveQuests || hasActiveCampaigns;

      if (!hasEvidence) return null;

      let level = 1;
      level += completedMatchingCampaigns.length * 5;
      level += activeMatchingCampaigns.length * 1;
      level += completedMatchingQuests.length * 2;
      level += activeMatchingQuests.length > 0 ? 1 : 0;
      if (nodeUnlocked) {
        level += nodeLevel > 0 ? nodeLevel : 2;
      }

      const isPurelyDiscovered = (completedMatchingQuests.length === 0 && completedMatchingCampaigns.length === 0 && !nodeUnlocked);

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

    savedGoals.forEach(g => {
      if (!g) return;
      if (mappedGoalIds.has(g.id)) return;

      const skillName = g.title.length > 25 ? g.aspiration || g.title : g.title;
      const skillId = `custom-sc-${g.id}`;

      let sDomain = g.categoryName || "Lifestyle";
      const availableDomains = ["Programming", "Fitness", "Learning", "Productivity", "Creativity", "Business", "Communication", "Health", "Lifestyle", "Music"];
      const foundDom = availableDomains.find(d => d.toLowerCase() === sDomain.toLowerCase() || sDomain.toLowerCase().includes(d.toLowerCase()));
      if (foundDom) {
        sDomain = foundDom;
      } else {
        sDomain = "Lifestyle";
      }

      const cleanCustomWords = skillName.toLowerCase().split(' ').filter(w => w.length > 3);
      const customKeywords = [skillName.toLowerCase(), ...cleanCustomWords];
      
      const completedMatchingQuests = quests.filter(q => 
        q.completed && (checkMatch(q.title, customKeywords) || checkMatch(q.description, customKeywords))
      );
      const activeMatchingQuests = quests.filter(q => 
        !q.completed && (checkMatch(q.title, customKeywords) || checkMatch(q.description, customKeywords))
      );

      const isActiveGoal = g.status === 'In Quest';
      const isCompletedGoal = g.status === 'Triumphant';

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

  const completedQuests = quests.filter(q => q.completed);
  const completedCount = completedQuests.length;
  const currentStreak = calculateActualStreak(quests);
  const longestStreak = calculateLongestStreak(quests);
  const levelInfo = calculateLevelInfo(profile.xp);

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

  const handleTriggerAIAssessment = async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      soundEngine.playSlash();
      Alert.alert("Oracle Status", "AI is unavailable. Please come back later.");
      return;
    }

    setIsAssessing(true);
    setAssessmentResult(null);
    soundEngine.playSoulsClaimed();

    const completedQuestsList = quests.filter(q => q.completed);

    try {
      const res = await generateProfileAssessment({
        name: profile.name,
        title: profile.title,
        xp: profile.xp,
        stats: profile.stats,
        chronicle: profile.chronicle,
        unlockedSkillsCount: profile.skillTrees.flatMap(t => t.nodes).filter(n => n.status === 'unlocked').length,
        unlockedAchievementsCount: profile.achievements.filter(a => a.unlocked).length,
        completedQuests: completedQuestsList
      });

      const updated = { ...profile };
      updated.lastAssessment = res.assessment;
      updated.lastAssessmentDate = getTodayLocalDateString();

      if (res.recommendedTitle) {
        updated.title = res.recommendedTitle;
        if (!updated.earnedTitles.includes(res.recommendedTitle)) {
          updated.earnedTitles.push(res.recommendedTitle);
        }
      }

      if (res.statBoosts) {
        for (const [key, val] of Object.entries(res.statBoosts)) {
          const sKey = key as keyof typeof updated.stats;
          if (updated.stats[sKey] !== undefined) {
            updated.stats[sKey] = Math.min(updated.stats[sKey] + (val as number), 100);
          }
        }
      }

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
      console.warn('AI assessment failure:', err);
      Alert.alert("Oracle Status", "AI is unavailable. Please come back later.");
    } finally {
      setIsAssessing(false);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Discovered': return { color: '#94a3b8', borderColor: 'rgba(148, 163, 184, 0.2)', backgroundColor: 'rgba(148, 163, 184, 0.05)' };
      case 'Practicing': return { color: '#fb923c', borderColor: 'rgba(251, 146, 60, 0.2)', backgroundColor: 'rgba(251, 146, 60, 0.05)' };
      case 'Developing': return { color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.2)', backgroundColor: 'rgba(56, 189, 248, 0.05)' };
      case 'Proficient': return { color: '#818cf8', borderColor: 'rgba(129, 140, 248, 0.2)', backgroundColor: 'rgba(129, 140, 248, 0.05)' };
      case 'Advanced': return { color: '#c084fc', borderColor: 'rgba(192, 132, 252, 0.2)', backgroundColor: 'rgba(192, 132, 252, 0.05)' };
      case 'Mastered': return { color: '#34d399', borderColor: 'rgba(52, 211, 153, 0.2)', backgroundColor: 'rgba(52, 211, 153, 0.05)' };
      default: return { color: COLORS.gothicGold, borderColor: 'rgba(200, 158, 92, 0.2)', backgroundColor: 'rgba(200, 158, 92, 0.05)' };
    }
  };

  const detectedList = getRecognizedSkills();
  const filteredList = detectedList.filter(s => {
    const matchesTab = s.tabGroup === activeSkillTab;
    const matchesSearch = s.name.toLowerCase().includes(skillSearch.toLowerCase()) || 
                          s.description.toLowerCase().includes(skillSearch.toLowerCase());
    const matchesDomain = skillDomainFilter === 'All Domains' ? true : s.domain === skillDomainFilter;
    return matchesTab && matchesSearch && matchesDomain;
  });

  const sortedList = [...filteredList].sort((a, b) => {
    if (skillSortBy === 'level') return b.level - a.level;
    if (skillSortBy === 'mastery') return b.mastery - a.mastery;
    if (skillSortBy === 'active') {
      if (a.recentActivity && !b.recentActivity) return -1;
      if (!a.recentActivity && b.recentActivity) return 1;
      return b.level - a.level;
    }
    if (skillSortBy === 'recently_unlocked') return b.evidenceList.length - a.evidenceList.length;
    if (skillSortBy === 'confidence') {
      const confIndex: Record<string, number> = { "ABSOLUTE": 3, "HIGH": 2, "MODERATE": 1 };
      return confIndex[b.aiConfidence] - confIndex[a.aiConfidence];
    }
    return 0;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      
      {/* 1. CHARACTER CARD & PROFILE OVERVIEW HEADER */}
      {tab === 'The Wanderer' && (
        <View style={styles.card}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarContainer}>
              <ProceduralAvatar profile={profile} size={110} />
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>LVL {levelInfo.level}</Text>
              </View>
            </View>

            <View style={styles.avatarDetails}>
              <Text style={styles.characterName}>{profile.name.toUpperCase()}</Text>
              <Text style={styles.rankBadge}>{curRank.toUpperCase()}</Text>
              <Text style={styles.characterTitle}>† {profile.title.toUpperCase()} †</Text>
            </View>
          </View>

          {/* Experience Bar */}
          <View style={styles.xpBlock}>
            <View style={styles.xpRow}>
              <Text style={styles.xpLabel}>EXP. POINTS</Text>
              <Text style={styles.xpValue}>
                {levelInfo.xpInCurrentLevel} / {levelInfo.xpNeededForNextLevel} XP ({profile.xp} TOTAL)
              </Text>
            </View>
            <View style={styles.xpTrack}>
              <View style={[styles.xpFill, { width: `${levelInfo.progressPercentage}%` }]} />
            </View>
          </View>

          {/* Titles list */}
          <View style={styles.titlesRow}>
            <Text style={styles.titlesHeading}>SCROLLS OF HONORS:</Text>
            <View style={styles.titlesList}>
              {profile.earnedTitles.map(t => (
                <View key={t} style={[styles.titlePill, profile.title === t && styles.titlePillActive]}>
                  <Text style={[styles.titlePillText, profile.title === t && { color: COLORS.gothicGold }]}>
                    {profile.title === t ? '🛡️ ' : '📜 '} {t.toUpperCase()}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Metrics HUD Grid */}
          <View style={styles.hudGrid}>
            <View style={styles.hudItem}>
              <Text style={styles.hudValText}>{goalsCount}</Text>
              <Text style={styles.hudLblText}>ACTIVE GOALS</Text>
            </View>
            <View style={styles.hudItem}>
              <Text style={styles.hudValText}>{quests.filter(q => q.category === 'Habit').length}</Text>
              <Text style={styles.hudLblText}>ACTIVE HABITS</Text>
            </View>
            <View style={styles.hudItem}>
              <Text style={[styles.hudValText, { color: COLORS.gothicSky }]}>{completedCount}</Text>
              <Text style={styles.hudLblText}>COMPLETED</Text>
            </View>
            <View style={[styles.hudItem, { borderColor: COLORS.gothicCrimson }]}>
              <Text style={[styles.hudValText, { color: COLORS.gothicCrimson }]}>{longestStreak} DAYS</Text>
              <Text style={[styles.hudLblText, { color: COLORS.gothicCrimson }]}>LONGEST STREAK</Text>
            </View>
          </View>
        </View>
      )}

      {/* 2. DYNAMIC REALIZED SKILLS LEDGER */}
      {tab === 'The Codex' && (
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardHeaderTitle}>⚔️ REALIZED COVENANTS OF GROWTH</Text>
              <Text style={styles.cardHeaderSubtitle}>Demonstrated skills & dynamic attributes</Text>
            </View>
            
            {/* Growing/Mastered Tab Selectors */}
            <View style={styles.subTabRow}>
              <TouchableOpacity onPress={() => { soundEngine.playClick(); setActiveSkillTab('growing'); }} style={[styles.subTabBtn, activeSkillTab === 'growing' && styles.subTabActive]}>
                <Text style={[styles.subTabBtnText, activeSkillTab === 'growing' && { color: COLORS.gothicGold }]}>[ GROWING ]</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { soundEngine.playClick(); setActiveSkillTab('mastered'); }} style={[styles.subTabBtn, activeSkillTab === 'mastered' && styles.subTabActive]}>
                <Text style={[styles.subTabBtnText, activeSkillTab === 'mastered' && { color: COLORS.gothicGold }]}>[ MASTERED ]</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search, Filter & Sort Row */}
          <View style={styles.filtersContainer}>
            <View style={styles.searchWrap}>
              <Search size={12} color={COLORS.gray500} style={styles.searchIcon} />
              <TextInput
                value={skillSearch}
                onChangeText={setSkillSearch}
                placeholder="SEARCH RECOGNIZED SKILLS..."
                placeholderTextColor={COLORS.gray700}
                style={styles.searchInput}
              />
            </View>

            {/* Horizontal selection lists instead of dropdowns for premium mobile styling */}
            <Text style={styles.filterTitleLabel}>DOMAINS:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
              {["All Domains", "Programming", "Fitness", "Music", "Communication", "Learning", "Productivity", "Creativity", "Lifestyle"].map(d => (
                <TouchableOpacity
                  key={d}
                  onPress={() => { soundEngine.playClick(); setSkillDomainFilter(d); }}
                  style={[styles.filterPill, skillDomainFilter === d && styles.filterPillActive]}
                >
                  <Text style={[styles.filterPillText, skillDomainFilter === d && { color: COLORS.gothicGold }]}>
                    {d.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.filterTitleLabel}>SORT BY:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
              {[
                { k: 'level', l: 'Tier Level ⚔️' },
                { k: 'active', l: 'Most Active ⚡' },
                { k: 'recently_unlocked', l: 'Newest Earned 🔑' },
                { k: 'mastery', l: 'Mastery Ratio 📈' },
                { k: 'confidence', l: 'AI Confidence ☄️' }
              ].map(s => (
                <TouchableOpacity
                  key={s.k}
                  onPress={() => { soundEngine.playClick(); setSkillSortBy(s.k as any); }}
                  style={[styles.filterPill, skillSortBy === s.k && styles.filterPillActive]}
                >
                  <Text style={[styles.filterPillText, skillSortBy === s.k && { color: COLORS.gothicGold }]}>
                    {s.l.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Skill lists items */}
          <View style={styles.skillsGrid}>
            {sortedList.length > 0 ? (
              sortedList.map(skill => (
                <TouchableOpacity
                  key={skill.id}
                  onPress={() => { soundEngine.playClick(); setSelectedSkill(skill); }}
                  style={styles.skillCard}
                >
                  <View style={styles.skillHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.skillDomainText}>⚜️ {skill.domain.toUpperCase()}</Text>
                      <Text style={styles.skillNameText} numberOfLines={1}>{skill.name.toUpperCase()}</Text>
                    </View>
                    <View style={styles.skillLvlBadge}>
                      <Text style={styles.skillLvlBadgeText}>LVL {skill.level}</Text>
                    </View>
                  </View>

                  <View style={styles.skillProgressBlock}>
                    <View style={styles.skillProgressHeader}>
                      <Text style={styles.skillProgressLabel}>PROGRESS</Text>
                      <Text style={styles.skillProgressVal}>{skill.mastery}%</Text>
                    </View>
                    <View style={styles.skillProgressTrack}>
                      <View style={[styles.skillProgressFill, { width: `${skill.mastery}%` }]} />
                    </View>
                  </View>

                  <View style={styles.skillFooterRow}>
                    <Text style={styles.skillSourceText} numberOfLines={1}>⚓ {skill.source.toUpperCase()}</Text>
                    <View style={[styles.statusBadge, { borderColor: getStatusBadgeStyle(skill.status).borderColor, backgroundColor: getStatusBadgeStyle(skill.status).backgroundColor }]}>
                      <Text style={[styles.statusBadgeText, { color: getStatusBadgeStyle(skill.status).color }]}>
                        {skill.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptySkillsCard}>
                <Lock size={16} color={COLORS.gray600} />
                <Text style={styles.emptySkillsTitle}>NO RECOGNIZED COVENANTS</Text>
                <Text style={styles.emptySkillsDesc}>
                  Initiate campaigns or tasks matching domains to discover new skills.
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* 3. ALCHEMICAL ATTRIBUTES GRID & EXAMINE SOUL */}
      {tab === 'The Wanderer' && (
        <View style={styles.row}>
          {/* Attributes */}
          <View style={[styles.card, { flex: 2 }]}>
            <Text style={styles.cardHeaderTitle}>⚔️ CHARACTER ATTRIBUTES</Text>
            <View style={styles.attrsList}>
              {Object.entries(profile.stats).map(([statName, val]) => {
                const valNum = val as number;
                const label = statName.replace(/([A-Z])/g, ' $1').toUpperCase();
                
                let colorBar = COLORS.gothicGold;
                if (['strength', 'endurance', 'discipline', 'recovery'].includes(statName)) {
                  colorBar = COLORS.gothicCrimson;
                } else if (statName === 'programming') {
                  colorBar = COLORS.gothicSky;
                }

                let rankName = 'Novice';
                if (valNum >= 90) rankName = 'Master';
                else if (valNum >= 70) rankName = 'Expert';
                else if (valNum >= 45) rankName = 'Adept';
                else if (valNum >= 25) rankName = 'Apprentice';

                return (
                  <View key={statName} style={styles.attrRow}>
                    <View style={styles.attrHeader}>
                      <Text style={styles.attrLabel}>{label}</Text>
                      <Text style={styles.attrRank}>{rankName} ({valNum}/100)</Text>
                    </View>
                    <View style={styles.attrTrack}>
                      <View style={[styles.attrFill, { backgroundColor: colorBar, width: `${valNum}%` }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* AI Auditing Column */}
          <View style={[styles.card, { flex: 1, marginTop: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <MessageSquare size={14} color={COLORS.gothicGold} />
              <Text style={styles.cardHeaderTitle}>AI SOUL EXAMINER</Text>
            </View>
            <Text style={styles.coachingDesc}>
              The examiner audits thy completed ledger of deeds to reward attributes, unlock paths, and customize advanced titles.
            </Text>

            {profile.lastAssessment ? (
              <View style={styles.lastAuditCard}>
                <Text style={styles.lastAuditDate}>LAST INSPECTION: {profile.lastAssessmentDate}</Text>
                <Text style={styles.lastAuditText}>"{profile.lastAssessment.toUpperCase()}"</Text>
              </View>
            ) : null}

            <TouchableOpacity 
              onPress={handleTriggerAIAssessment} 
              disabled={isAssessing} 
              style={[styles.auditBtn, isAssessing && { opacity: 0.6 }]}
            >
              {isAssessing ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ActivityIndicator size="small" color="#000" />
                  <Text style={styles.auditBtnText}>INSPECTING SOUL...</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <RefreshCw size={12} color="#000" />
                  <Text style={styles.auditBtnText}>PERFORM ASSESSMENT</Text>
                </View>
              )}
            </TouchableOpacity>

            {assessmentResult && (
              <View style={styles.auditResultBox}>
                <View style={styles.auditResultHeader}>
                  <Text style={styles.auditResultTitle}>CRUCIBLE INSCRIPTION SUCCESS</Text>
                  <TouchableOpacity onPress={() => setAssessmentResult(null)}>
                    <Text style={{ color: COLORS.gray500, fontSize: 10 }}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.auditResultText}>{assessmentResult}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* 4. ACHIEVEMENTS HALL */}
      {tab === 'The Wanderer' && (
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardHeaderTitle}>🏆 THE ACHIEVEMENTS HALL</Text>
          <View style={styles.achievementsGrid}>
            {profile.achievements.map((ach) => {
              const unlocked = ach.unlocked;
              
              let borderColor = 'rgba(46, 50, 62, 0.2)';
              let bg = 'rgba(46, 50, 62, 0.05)';
              let iconColor = COLORS.gray500;
              let nameColor = COLORS.gray600;

              if (unlocked) {
                nameColor = '#fff';
                if (ach.rarity === 'Mythic') {
                  borderColor = 'rgba(168, 85, 247, 0.4)';
                  bg = 'rgba(168, 85, 247, 0.05)';
                  iconColor = '#a855f7';
                } else if (ach.rarity === 'Legendary') {
                  borderColor = 'rgba(234, 88, 12, 0.4)';
                  bg = 'rgba(234, 88, 12, 0.05)';
                  iconColor = '#ea580c';
                } else if (ach.rarity === 'Epic') {
                  borderColor = COLORS.gothicBorder;
                  bg = 'rgba(200, 158, 92, 0.05)';
                  iconColor = COLORS.gothicGold;
                } else {
                  borderColor = 'rgba(56, 189, 248, 0.3)';
                  bg = 'rgba(56, 189, 248, 0.05)';
                  iconColor = COLORS.gothicSky;
                }
              }

              return (
                <View key={ach.id} style={[styles.achCard, { borderColor, backgroundColor: bg }]}>
                  <View style={[styles.achIconBg, unlocked && { borderColor: iconColor }]}>
                    <Trophy size={16} color={iconColor} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
                      <Text style={[styles.achName, { color: nameColor }]}>{ach.name.toUpperCase()}</Text>
                      <View style={[styles.achRarityBadge, { borderColor: iconColor }]}>
                        <Text style={[styles.achRarityBadgeText, { color: iconColor }]}>{ach.rarity.toUpperCase()}</Text>
                      </View>
                    </View>
                    <Text style={styles.achDesc}>{ach.description.toUpperCase()}</Text>
                    {unlocked && ach.unlockedAt && (
                      <Text style={styles.achTime}>UNLOCKED: {ach.unlockedAt}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* 5. ULTIMATE PENANCE WIPE */}
      {tab === 'The Wanderer' && (
        <View style={styles.purgeCard}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ShieldAlert size={14} color={COLORS.gothicCrimson} />
              <Text style={styles.purgeTitle}>THE ULTIMATE ABSOLUTION</Text>
            </View>
            <Text style={styles.purgeDesc}>
              Wipe thy records clean. To shatter thy current penance and begin anew, invoke the decree of ultimate departure.
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => { soundEngine.playClick(); if (onReset) onReset(); }}
            style={styles.purgeBtn}
          >
            <Text style={styles.purgeBtnText}>† ENOUGH †</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* SELECTED SKILL COVENANT OVERLAY MODAL */}
      {selectedSkill && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.modalCorner, { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 }]} />
            <View style={[styles.modalCorner, { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 }]} />
            <View style={[styles.modalCorner, { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 }]} />
            <View style={[styles.modalCorner, { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 }]} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalHeaderLabel}>🛡️ VERIFIED GROWTH SPHERE</Text>
                <Text style={styles.modalHeaderTitle}>{selectedSkill.name.toUpperCase()}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedSkill(null)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseBtnText}>[ DISMISS ]</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, marginVertical: 12 }}>
              <View style={styles.modalStatsRow}>
                <View style={styles.modalStatBox}>
                  <Text style={styles.modalStatLabel}>LIFECYCLE STAGE</Text>
                  <Text style={styles.modalStatVal}>★ {selectedSkill.status.toUpperCase()}</Text>
                </View>
                <View style={styles.modalStatBox}>
                  <Text style={styles.modalStatLabel}>ORACLE SCORE</Text>
                  <Text style={styles.modalStatVal}>TIER {selectedSkill.level} ({selectedSkill.mastery}%)</Text>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>DEMONSTRATED EVIDENCE</Text>
                <View style={styles.modalSectionBox}>
                  {selectedSkill.evidenceList.map((ev: string, idx: number) => (
                    <Text key={idx} style={styles.modalEvidenceText}>† {ev.toUpperCase()}</Text>
                  ))}
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>RELATED ATTRIBUTES</Text>
                <View style={styles.attributesListRow}>
                  {selectedSkill.contributesTo.map((stat: string) => (
                    <View key={stat} style={styles.modalAttrPill}>
                      <Text style={styles.modalAttrPillText}>{stat.toUpperCase()} +RANK</Text>
                    </View>
                  ))}
                  <View style={[styles.modalAttrPill, { backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}>
                    <Text style={[styles.modalAttrPillText, { color: COLORS.gothicSky }]}>CONFIDENCE: {selectedSkill.aiConfidence}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>SCRIBE'S AI ASSESSMENT</Text>
                <View style={[styles.modalSectionBox, { borderColor: COLORS.gothicGold }]}>
                  <Text style={styles.modalAssessmentText}>{selectedSkill.assessment.toUpperCase()}</Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity onPress={() => setSelectedSkill(null)} style={styles.modalSubmitBtn}>
              <Text style={styles.modalSubmitBtnText}>CLOSE SCROLL OF ASSESS</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    backgroundColor: COLORS.gothicCard,
    borderColor: COLORS.gothicBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    transform: [{ translateX: -30 }],
    backgroundColor: COLORS.gothicGold,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  levelBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    color: '#000',
    fontWeight: 'black',
  },
  avatarDetails: {
    flex: 1,
    gap: 4,
  },
  characterName: {
    fontFamily: FONTS.cinzel,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  rankBadge: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    color: COLORS.gray400,
    backgroundColor: COLORS.gothicDark,
    borderColor: 'rgba(46, 50, 62, 0.6)',
    borderWidth: 1,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  characterTitle: {
    fontFamily: FONTS.cinzel,
    fontSize: 9.5,
    color: COLORS.gothicGold,
    letterSpacing: 0.5,
    fontWeight: 'bold',
  },
  xpBlock: {
    marginTop: 20,
    gap: 6,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  xpLabel: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: COLORS.gray500,
  },
  xpValue: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: COLORS.gothicGold,
    fontWeight: 'bold',
  },
  xpTrack: {
    height: 8,
    backgroundColor: COLORS.gothicDark,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(46, 50, 62, 0.4)',
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: COLORS.gothicGold,
  },
  titlesRow: {
    marginTop: 16,
    gap: 6,
  },
  titlesHeading: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    color: COLORS.gray500,
  },
  titlesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  titlePill: {
    backgroundColor: COLORS.gothicDark,
    borderColor: 'rgba(46, 50, 62, 0.4)',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  titlePillActive: {
    backgroundColor: 'rgba(200, 158, 92, 0.2)',
    borderColor: COLORS.gothicGold,
  },
  titlePillText: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    color: COLORS.gray500,
  },
  hudGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(46, 50, 62, 0.2)',
    paddingTop: 16,
  },
  hudItem: {
    flex: 1,
    minWidth: 80,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderColor: COLORS.gothicBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  hudValText: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.gothicGold,
  },
  hudLblText: {
    fontFamily: FONTS.mono,
    fontSize: 7,
    color: COLORS.gray500,
    marginTop: 2,
  },
  cardHeaderRow: {
    flexDirection: 'column',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 50, 62, 0.2)',
    paddingBottom: 12,
    marginBottom: 12,
  },
  cardHeaderTitle: {
    fontFamily: FONTS.cinzel,
    fontSize: 11.5,
    fontWeight: 'bold',
    color: COLORS.gothicGold,
  },
  cardHeaderSubtitle: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    color: COLORS.gray500,
  },
  subTabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.gothicDark,
    borderRadius: 6,
    padding: 2,
    alignSelf: 'flex-start',
  },
  subTabBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  subTabActive: {
    backgroundColor: 'rgba(200, 158, 92, 0.15)',
  },
  subTabBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gray500,
  },
  filtersContainer: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderColor: 'rgba(46, 50, 62, 0.2)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 8,
    marginBottom: 12,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gothicDark,
    borderColor: COLORS.gothicBorder,
    borderWidth: 1,
    borderRadius: 8,
    height: 28,
    paddingHorizontal: 8,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    padding: 0,
  },
  filterTitleLabel: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    color: COLORS.gray500,
    fontWeight: 'bold',
    marginTop: 2,
  },
  pillsScroll: {
    flexDirection: 'row',
  },
  filterPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: COLORS.gothicDark,
    borderColor: COLORS.gothicBorder,
    borderWidth: 1,
    borderRadius: 6,
    marginRight: 6,
  },
  filterPillActive: {
    borderColor: COLORS.gothicGold,
    backgroundColor: 'rgba(200, 158, 92, 0.1)',
  },
  filterPillText: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    color: COLORS.gray500,
  },
  skillsGrid: {
    gap: 8,
  },
  skillCard: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderColor: COLORS.gothicBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  skillHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  skillDomainText: {
    fontFamily: FONTS.mono,
    fontSize: 7,
    color: COLORS.gray500,
  },
  skillNameText: {
    fontFamily: FONTS.cinzel,
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 2,
  },
  skillLvlBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: 'rgba(56, 189, 248, 0.25)',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  skillLvlBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: COLORS.gothicSky,
    fontWeight: 'bold',
  },
  skillProgressBlock: {
    marginTop: 8,
    gap: 4,
  },
  skillProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skillProgressLabel: {
    fontFamily: FONTS.mono,
    fontSize: 7,
    color: COLORS.gray500,
  },
  skillProgressVal: {
    fontFamily: FONTS.mono,
    fontSize: 7,
    color: '#fff',
    fontWeight: 'bold',
  },
  skillProgressTrack: {
    height: 4,
    backgroundColor: COLORS.gothicDark,
    borderRadius: 2,
    overflow: 'hidden',
  },
  skillProgressFill: {
    height: '100%',
    backgroundColor: COLORS.gothicSky,
  },
  skillFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(46, 50, 62, 0.2)',
    paddingTop: 8,
  },
  skillSourceText: {
    fontFamily: FONTS.mono,
    fontSize: 7,
    color: COLORS.gray500,
    flex: 1,
  },
  statusBadge: {
    borderRadius: 4,
    borderWidth: 0.5,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  statusBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 6.5,
    fontWeight: 'bold',
  },
  emptySkillsCard: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: COLORS.gothicDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(46, 50, 62, 0.2)',
    gap: 6,
  },
  emptySkillsTitle: {
    fontFamily: FONTS.cinzel,
    fontSize: 9.5,
    fontWeight: 'bold',
    color: COLORS.gray400,
  },
  emptySkillsDesc: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    color: COLORS.gray600,
    textAlign: 'center',
    maxWidth: 200,
  },
  row: {
    flexDirection: 'column',
  },
  attrsList: {
    gap: 8,
    marginTop: 10,
  },
  attrRow: {
    gap: 4,
  },
  attrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  attrLabel: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    color: COLORS.gray400,
    fontWeight: 'bold',
  },
  attrRank: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    color: COLORS.gray500,
  },
  attrTrack: {
    height: 6,
    backgroundColor: COLORS.gothicDark,
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(46, 50, 62, 0.2)',
  },
  attrFill: {
    height: '100%',
  },
  coachingDesc: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gray400,
    lineHeight: 12,
  },
  lastAuditCard: {
    backgroundColor: COLORS.gothicDark,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(46, 50, 62, 0.2)',
    padding: 8,
    marginVertical: 10,
    gap: 4,
  },
  lastAuditDate: {
    fontFamily: FONTS.mono,
    fontSize: 6,
    color: COLORS.gray500,
  },
  lastAuditText: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gothicGold,
    fontStyle: 'italic',
  },
  auditBtn: {
    backgroundColor: COLORS.gothicGold,
    borderRadius: 6,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auditBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000',
  },
  auditResultBox: {
    marginTop: 10,
    backgroundColor: COLORS.gothicDark,
    borderColor: 'rgba(200, 158, 92, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  auditResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(46, 50, 62, 0.2)',
    paddingBottom: 4,
    marginBottom: 6,
  },
  auditResultTitle: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    color: COLORS.gothicGold,
    fontWeight: 'bold',
  },
  auditResultText: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gray300,
    lineHeight: 12,
  },
  achievementsGrid: {
    gap: 8,
    marginTop: 10,
  },
  achCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    gap: 10,
  },
  achIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: COLORS.gothicDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achName: {
    fontFamily: FONTS.cinzel,
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  achRarityBadge: {
    borderWidth: 0.5,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  achRarityBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 6,
    fontWeight: 'bold',
  },
  achDesc: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: COLORS.gray500,
  },
  achTime: {
    fontFamily: FONTS.mono,
    fontSize: 6.5,
    color: COLORS.gray500,
    marginTop: 2,
  },
  purgeCard: {
    backgroundColor: COLORS.gothicCard,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'column',
    gap: 12,
    marginTop: 12,
  },
  purgeTitle: {
    fontFamily: FONTS.cinzel,
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.gothicCrimson,
  },
  purgeDesc: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gray500,
    marginTop: 4,
    lineHeight: 12,
  },
  purgeBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderColor: COLORS.gothicCrimson,
    borderWidth: 1,
    borderRadius: 6,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purgeBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.gothicCrimson,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 11, 13, 0.95)',
    zIndex: 3000,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 450,
    height: '75%',
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 50, 62, 0.3)',
    paddingBottom: 10,
  },
  modalHeaderLabel: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    color: COLORS.gothicGold,
    fontWeight: 'bold',
  },
  modalHeaderTitle: {
    fontFamily: FONTS.cinzel,
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 2,
  },
  modalCloseBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.gothicDark,
    borderColor: COLORS.gothicBorder,
    borderWidth: 1,
    borderRadius: 6,
  },
  modalCloseBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gray400,
  },
  modalStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modalStatBox: {
    flex: 1,
    backgroundColor: COLORS.gothicDark,
    borderWidth: 1,
    borderColor: COLORS.gothicBorder,
    borderRadius: 10,
    padding: 8,
  },
  modalStatLabel: {
    fontFamily: FONTS.mono,
    fontSize: 6.5,
    color: COLORS.gray500,
  },
  modalStatVal: {
    fontFamily: FONTS.cinzel,
    fontSize: 9.5,
    fontWeight: 'bold',
    color: COLORS.gothicSky,
    marginTop: 2,
  },
  modalSection: {
    marginTop: 12,
    gap: 6,
  },
  modalSectionTitle: {
    fontFamily: FONTS.cinzel,
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.gothicGold,
  },
  modalSectionBox: {
    backgroundColor: COLORS.gothicDark,
    borderColor: COLORS.gothicBorder,
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    gap: 4,
  },
  modalEvidenceText: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: '#fff',
    lineHeight: 11,
  },
  attributesListRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  modalAttrPill: {
    backgroundColor: COLORS.gothicDark,
    borderColor: COLORS.gothicBorder,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  modalAttrPillText: {
    fontFamily: FONTS.mono,
    fontSize: 7,
    color: COLORS.gray400,
  },
  modalAssessmentText: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gothicGold,
    lineHeight: 12,
  },
  modalSubmitBtn: {
    backgroundColor: 'rgba(200, 158, 92, 0.15)',
    borderColor: COLORS.gothicGold,
    borderWidth: 1,
    borderRadius: 10,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  modalSubmitBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.gothicGold,
  }
});
export default GothicProfile;
