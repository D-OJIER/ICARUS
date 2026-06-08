import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  BookOpen, 
  Check, 
  Trash2, 
  Plus, 
  Compass, 
  Shield, 
  Clock, 
  ChevronRight, 
  RefreshCw,
  Trophy,
  ArrowRight,
  Lock
} from 'lucide-react';
import { Quest, Goal, QuestDifficulty, QuestCategory } from '../types';
import { ProceduralEmblem } from './ProceduralEmblem';
import { soundEngine } from '../utils/audio';
import { getLocalDateString, getTodayLocalDateString } from '../utils/dateUtils';

interface CampaignsTabProps {
  quests: Quest[];
  onCompleteQuest: (id: string, defaultNextState?: boolean) => void;
  onDeleteQuest: (id: string) => void;
  onAddQuest: (questData: {
    title: string;
    description: string;
    difficulty: QuestDifficulty;
    category: QuestCategory;
    dueDate?: string;
  }) => void;
  onAddQuestsBatch: (questsBatch: {
    title: string;
    description: string;
    difficulty: QuestDifficulty;
    category: QuestCategory;
    dueDate?: string;
  }[]) => void;
  goals: Goal[];
  onUpdateGoals: (updater: Goal[] | ((prev: Goal[]) => Goal[])) => void;
  onAbandonCampaign: (goalId: string) => void;
}

export function CampaignsTab({
  quests,
  onCompleteQuest,
  onDeleteQuest,
  onAddQuest,
  onAddQuestsBatch,
  goals,
  onUpdateGoals,
  onAbandonCampaign
}: CampaignsTabProps) {
  // Mini Tabs state: active vs create
  const [miniTab, setMiniTab] = useState<'active' | 'create'>('active');

  // Popup modal visibility state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Track expanded task IDs for the current objectives view to show details
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({});

  // Input states inside the Create mini tab
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [aspirationInput, setAspirationInput] = useState('');
  
  // Loading and feedback states
  const [isPlanningLoading, setIsPlanningLoading] = useState(false);
  const [planError, setPlanError] = useState('');
  const [startDateStr, setStartDateStr] = useState<string>(() => getTodayLocalDateString());

  // Active campaign selection state
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  // Stage index preview override state, so users can select any stage (even locked ones)
  const [previewStageIndex, setPreviewStageIndex] = useState<number | null>(null);

  // Reset preview staging index when selecting another campaign or opening details
  useEffect(() => {
    setPreviewStageIndex(null);
  }, [selectedGoalId, isDetailModalOpen]);

  // Auto-switch tab to 'create' when there are no active campaigns, otherwise default 'active'
  useEffect(() => {
    if (goals.length === 0) {
      setMiniTab('create');
      setIsDetailModalOpen(false);
    } else if (!selectedGoalId && goals.length > 0) {
      setSelectedGoalId(goals[0].id);
    }
  }, [goals, selectedGoalId]);

  // Handle selected campaign
  const activeCampaign = goals.find(g => g.id === selectedGoalId) || (goals.length > 0 ? goals[0] : null);

  // Calculate completion metric helper
  const calculateCampaignProgress = (goal: Goal) => {
    let totalTasks = 0;
    let completedTasks = 0;

    goal.stages.forEach(stage => {
      if (stage.tasks) {
        stage.tasks.forEach(task => {
          totalTasks++;
          const matchingQuest = quests.find(q => 
            q.title.toLowerCase().includes(task.title.toLowerCase()) && q.completed
          );
          if (matchingQuest) {
            completedTasks++;
          }
        });
      }
    });

    return { 
      completed: completedTasks, 
      total: totalTasks, 
      percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0 
    };
  };

  // Determine the current phase / active stage
  const getPhaseAndWeek = (goal: Goal) => {
    let currentStageIndex = 0;
    let foundActive = false;

    for (let i = 0; i < goal.stages.length; i++) {
      const stage = goal.stages[i];
      const stageComplete = stage.tasks?.every(task => 
        quests.some(q => q.title.toLowerCase().includes(task.title.toLowerCase()) && q.completed)
      );
      if (!stageComplete && !foundActive) {
        currentStageIndex = i;
        foundActive = true;
      }
    }

    if (!foundActive && goal.stages.length > 0) {
      currentStageIndex = goal.stages.length - 1;
    }

    const currentStageName = goal.stages[currentStageIndex]?.name || `Phase ${currentStageIndex + 1}`;
    const calculatedWeek = currentStageIndex + 1;

    return {
      phaseName: currentStageName,
      weekNumber: calculatedWeek,
      index: currentStageIndex,
      stage: goal.stages[currentStageIndex]
    };
  };

  // Get days remaining from campaign creation time
  const getDaysRemaining = (goal: Goal) => {
    const created = new Date(goal.createdAt);
    const now = new Date();
    const diffTime = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const totalDuration = 30; // Standard 30 days cycle
    const remaining = totalDuration - diffDays;
    return Math.max(0, remaining);
  };

  // Generate localized gothic-like advisor words
  const generateDynamicAdvisorText = (goal: Goal) => {
    const progress = calculateCampaignProgress(goal);
    const pct = progress.percentage;
    if (pct === 0) {
      return `Thy pilgrimage of "${goal.title}" has been freshly inscribed inside the sacred Ledger of Duty. Settle thy resolve, carve thy dates onto the agenda files, and execute the starting vows to generate initial momentum.`;
    } else if (pct < 35) {
      return `Thy campaign of "${goal.title}" is progressing firmly at ${pct}% completion. Foundations are taking root but remain vulnerable to slackened resolve. Be vigilant, execute thy daily penance, and push through initial friction.`;
    } else if (pct < 75) {
      return `With ${pct}% complete, the rhythm of thy "${goal.title}" crusade has begun modifying thy spirit. Practice of these trials is transforming into clean execution. Ensure thy commitment remains unbreakable under high hours of pressure.`;
    } else if (pct < 100) {
      return `Glorious triumph is within grasp! At ${pct}% complete, thy final evolution of the "${goal.title}" blueprint is settling. Walk forward with steadfast determination in this final stretch; do not allow distractions to extinguish thy embers.`;
    } else {
      return `† Sacred Covenant Complete! Thy "${goal.title}" has undergone the ultimate forge alchemy. High attributes are unlocked on thy character ledger. Inscribe thy next major crusade when thy soul is prepared.`;
    }
  };

  // Submission handler for Campaign Generator
  const handleCreateCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const aspiration = aspirationInput.trim();
    if (!aspiration) {
      setPlanError('Please declare what thou wish to become.');
      return;
    }

    soundEngine.playClick();
    setIsPlanningLoading(true);
    setPlanError('');

    try {
      const res = await fetch('/api/ai/plan-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aspiration })
      });

      if (!res.ok) {
        throw new Error('Ethereal sages failed to compile the roadmap.');
      }

      const rawPlan = await res.json();
      
      const newGoal: Goal = {
        id: `goal-${Date.now()}`,
        title: rawPlan.title || aspiration,
        aspiration: aspiration,
        categoryName: rawPlan.categoryName || 'Mystical Growth',
        timelineExplanation: rawPlan.timelineExplanation || 'An epic progression path spaced along thy days.',
        resources: Array.isArray(rawPlan.resources) ? rawPlan.resources : [],
        stages: (rawPlan.stages || []).map((stg: any, sIdx: number) => ({
          name: stg.name || `Phase ${sIdx + 1}`,
          lore: stg.lore || 'A foundational milestone of growth and perseverance.',
          tasks: (stg.tasks || []).map((tsk: any, tIdx: number) => ({
            id: `gtask-${sIdx}-${tIdx}-${Date.now()}`,
            title: tsk.title || 'Standard Devotion',
            description: tsk.description || 'Dedicate thy spirits completely to active growth.',
            difficulty: tsk.difficulty || 'Lesser Burden',
            category: tsk.category || 'General',
            dayOffset: typeof tsk.dayOffset === 'number' ? tsk.dayOffset : (sIdx * 7 + tIdx * 2 + 1)
          }))
        })),
        status: 'In Quest',
        createdAt: new Date().toISOString(),
        linkedQuestsAdded: false
      };

      onUpdateGoals(prev => [newGoal, ...prev]);
      setSelectedGoalId(newGoal.id);
      setAspirationInput('');
      setMiniTab('active');
      soundEngine.playSoulsClaimed();

    } catch (err: any) {
      console.error(err);
      setPlanError('AI is unavailable. Please come back later.');
    } finally {
      setIsPlanningLoading(false);
    }
  };

  // High quality offline fallback campaign generator
  const getOfflineFallbackCampaign = (aspiration: string): Goal => {
    return {
      id: `goal-${Date.now()}`,
      title: aspiration,
      aspiration: aspiration,
      categoryName: 'Sacred Covenant',
      timelineExplanation: `An immersive, structured, five-stage gothic curriculum roadmap detailing thy path to: ${aspiration}.`,
      resources: ['Scroll of Constant Devotion', 'Ledger of Sovereign Execution'],
      stages: [
        {
          name: 'Phase 1 — Foundation',
          lore: 'Establish basic, unwavering routines. Build initial friction thresholds.',
          tasks: [
            { id: `fb1-${Date.now()}`, title: `Inscribe basic rituals for ${aspiration}`, description: 'Familiarize thyself with simple daily elements.', difficulty: 'Lesser Burden', category: 'General', dayOffset: 1 },
            { id: `fb2-${Date.now()}`, title: 'Review structural roadblocks', description: 'Eliminate negative triggers and clear thy calendar.', difficulty: 'Lesser Burden', category: 'General', dayOffset: 3 },
            { id: `fb3-${Date.now()}`, title: 'The first major study block', description: 'Maintain complete focus for an extended period.', difficulty: 'Sinuous Vow', category: 'General', dayOffset: 6 }
          ]
        },
        {
          name: 'Phase 2 — Development',
          lore: 'Formulate structural rhythm as routines solidify into heavy steel habits.',
          tasks: [
            { id: `fb4-${Date.now()}`, title: `Execute intermediate trials for ${aspiration}`, description: 'Increase frequency and depth of thy daily devotions.', difficulty: 'Sinuous Vow', category: 'General', dayOffset: 8 },
            { id: `fb5-${Date.now()}`, title: 'Discipline durability test', description: 'Overcome immediate fatigue and deliver quality.', difficulty: 'Sinuous Vow', category: 'General', dayOffset: 11 },
            { id: `fb6-${Date.now()}`, title: 'Extended twilight focus', description: 'Engage in highly demanding practices.', difficulty: 'Mortal Penance', category: 'General', dayOffset: 14 }
          ]
        },
        {
          name: 'Phase 3 — Application',
          lore: 'Unleash thy growing power under real-world practical stress.',
          tasks: [
            { id: `fb7-${Date.now()}`, title: `A practical draft project of ${aspiration}`, description: 'Create a localized proof of thy learning.', difficulty: 'Sinuous Vow', category: 'General', dayOffset: 15 },
            { id: `fb8-${Date.now()}`, title: 'Optimize velocity bounds', description: 'Tear down internal limits, practice at faster speed.', difficulty: 'Lesser Burden', category: 'General', dayOffset: 18 },
            { id: `fb9-${Date.now()}`, title: 'Immersion of sweat and ink', description: 'Lock in for a heavy 2-hour distraction-free block.', difficulty: 'Mortal Penance', category: 'General', dayOffset: 21 }
          ]
        },
        {
          name: 'Phase 4 — Mastery',
          lore: 'Refinement enters. The craft is executed with grace, precision, and authority.',
          tasks: [
            { id: `fb10-${Date.now()}`, title: 'Advanced methodologies exploration', description: 'Investigate elite frameworks of execution.', difficulty: 'Mortal Penance', category: 'General', dayOffset: 22 },
            { id: `fb11-${Date.now()}`, title: 'Immaculate output delivery', description: 'Achieve absolute precision on difficult elements.', difficulty: 'Sinuous Vow', category: 'General', dayOffset: 25 },
            { id: `fb12-${Date.now()}`, title: 'Rigorous internal error review', description: 'Rectify subtle weaknesses in thy style.', difficulty: 'Sinuous Vow', category: 'General', dayOffset: 28 }
          ]
        },
        {
          name: 'Phase 5 — Evolution',
          lore: 'The covenant is fulfilled. Your hard work has transformed into automatic nature.',
          tasks: [
            { id: `fb13-${Date.now()}`, title: 'Grand culmination presentation', description: 'Conduct the ultimate demonstration of thy growth.', difficulty: 'Mortal Penance', category: 'General', dayOffset: 29 },
            { id: `fb14-${Date.now()}`, title: 'Seal the Covenant forever', description: 'Review the historic ledger of triumphs with satisfaction.', difficulty: 'Lesser Burden', category: 'General', dayOffset: 30 }
          ]
        }
      ],
      status: 'In Quest',
      createdAt: new Date().toISOString(),
      linkedQuestsAdded: false
    };
  };

  // Add standard quick tasks
  const handleAddQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    const title = quickTaskTitle.trim();
    if (!title) return;

    soundEngine.playClick();
    onAddQuest({
      title,
      description: 'Fleeting penance. Pure one-time task, contains no phases.',
      difficulty: 'Lesser Burden',
      category: 'General',
      dueDate: getTodayLocalDateString()
    });

    setQuickTaskTitle('');
  };

  // Carve Stage tasks to active day calendar
  const handleCarveToCalendar = (goal: Goal) => {
    if (!goal || goal.linkedQuestsAdded) return;
    soundEngine.playClick();

    const currentBaseDate = new Date(startDateStr + 'T12:00:00');
    const newQuestsBatch: {
      title: string;
      description: string;
      difficulty: QuestDifficulty;
      category: QuestCategory;
      dueDate?: string;
    }[] = [];

    goal.stages.forEach((stage) => {
      stage.tasks?.forEach((task) => {
        const itemDate = new Date(currentBaseDate);
        itemDate.setDate(currentBaseDate.getDate() + task.dayOffset - 1);
        const dateString = getLocalDateString(itemDate);

        newQuestsBatch.push({
          title: `⚔️ [${goal.title}] ${task.title}`,
          description: `${task.description} (${stage.name} - DayOffset ${task.dayOffset}).`,
          difficulty: task.difficulty,
          category: task.category,
          dueDate: dateString
        });
      });
    });

    onAddQuestsBatch(newQuestsBatch);

    onUpdateGoals(prev => prev.map(g => g.id === goal.id ? { ...g, linkedQuestsAdded: true } : g));
    soundEngine.playSlash();
  };

  // Toggle tasks check
  const handleToggleTaskCheckbox = (goal: Goal, taskTitle: string) => {
    const fullTitle = `⚔️ [${goal.title}] ${taskTitle}`;
    const matchedQuest = quests.find(q => q.title.toLowerCase().includes(taskTitle.toLowerCase()));

    if (matchedQuest) {
      onCompleteQuest(matchedQuest.id);
    } else {
      soundEngine.playSlash();
      onAddQuest({
        title: fullTitle,
        description: `Custom goal trial: ${taskTitle}. From Campaign: ${goal.title}.`,
        difficulty: 'Sinuous Vow',
        category: 'Vow',
        dueDate: getTodayLocalDateString()
      });
    }
  };

  // Filter Quick Tasks (ones not prefixed with the campaign marker)
  const quickTasksPool = quests.filter(q => {
    const isCampaignQuests = q.title.startsWith('⚔️ [') || q.title.includes('] ');
    return !isCampaignQuests;
  });

  return (
    <div className="space-y-6 text-left animate-fade-in" id="campaigns-tab-viewport">
      
      {/* 1. Header Information */}
      <div className="border-b border-gothic-border/30 pb-4 flex justify-between items-center sm:items-center">
        <div>
          <h2 className="font-cinzel text-md md:text-lg font-bold tracking-widest text-gothic-gold uppercase flex items-center gap-2">
            🛡️ Campaigns
          </h2>
          <p className="font-mono text-[9px] text-gray-500 uppercase tracking-widest mt-0.5">
            Sovereign Ledger of thy Growth & One-Time Devotions
          </p>
        </div>
      </div>

      {/* 2. Top-Level Segmented Mini Tabs */}
      <div className="flex justify-center">
        <div className="bg-gothic-card/95 border-2 border-gothic-border/60 p-1.5 rounded-2xl flex gap-1.5 w-full max-w-sm">
          <button
            onClick={() => {
              soundEngine.playClick();
              if (goals.length > 0) {
                setMiniTab('active');
              } else {
                soundEngine.playYouDied();
              }
            }}
            disabled={goals.length === 0}
            className={`flex-1 py-2 text-[10px] font-mono uppercase tracking-widest rounded-xl transition-all cursor-pointer ${
              miniTab === 'active'
                ? 'bg-gothic-gold/20 text-gothic-gold border border-gothic-gold/40 font-bold shadow-[inset_0_1px_5px_rgba(0,0,0,0.5)]'
                : 'text-gray-500 hover:text-gray-300 border border-transparent disabled:opacity-30'
            }`}
          >
            🛡️ Active Campaigns
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              setMiniTab('create');
            }}
            className={`flex-1 py-2 text-[10px] font-mono uppercase tracking-widest rounded-xl transition-all cursor-pointer ${
              miniTab === 'create'
                ? 'bg-gothic-gold/20 text-gothic-gold border border-gothic-gold/40 font-bold shadow-[inset_0_1px_5px_rgba(0,0,0,0.5)]'
                : 'text-gray-500 hover:text-gray-300 border border-transparent'
            }`}
          >
            🖋️ Create
          </button>
        </div>
      </div>

      <div className="border-b border-gothic-border/10 my-4" />

      {/* 3. View Switcher Portals */}
      <AnimatePresence mode="wait">
        {miniTab === 'active' && activeCampaign && (
          <motion.div
            key="active-tab-panel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* GRID OF MAIN CARDS */}
            <div className="lg:col-span-12 space-y-4">
              <h3 className="font-cinzel text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Active Safekeeping Ledger ({goals.length})
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.map((goal) => {
                  const progress = calculateCampaignProgress(goal);

                  return (
                    <div
                      key={goal.id}
                      onClick={() => {
                        soundEngine.playClick();
                        setSelectedGoalId(goal.id);
                        setIsDetailModalOpen(true);
                      }}
                      className="p-5 rounded-xl border bg-gothic-card/40 border-gothic-border/70 hover:border-gothic-gold hover:bg-gothic-card/90 cursor-pointer shadow-lg transition-all relative overflow-hidden flex flex-col justify-between min-h-[145px] group hover:scale-[1.01]"
                    >
                      <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-gothic-gold/25 group-hover:border-gothic-gold/60" />
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-gothic-gold/25 group-hover:border-gothic-gold/60" />

                      <div className="space-y-3">
                        <div className="flex items-start gap-4">
                          <ProceduralEmblem name={goal.title} id={goal.id} createdAt={goal.createdAt} difficulty="Sinuous Vow" size={28} />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-cinzel text-xs font-black text-gothic-gold tracking-wider uppercase truncate group-hover:text-yellow-400">
                              {goal.title}
                            </h4>
                            <span className="inline-block font-mono text-[7px] text-gray-400 uppercase tracking-widest mt-1">
                              ⚔️ {goal.categoryName}
                            </span>
                          </div>
                        </div>

                        {/* Miniature status and progress bar */}
                        <div className="space-y-1.5 pt-1">
                          <div className="w-full h-1 bg-black rounded-lg overflow-hidden border border-gothic-border/20">
                            <div 
                              className="h-full bg-gothic-gold transition-all duration-300"
                              style={{ width: `${progress.percentage}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center text-[7.5px] font-mono text-gray-500 uppercase tracking-widest">
                            <span>{progress.percentage}% COMPLETE</span>
                            <span>{getDaysRemaining(goal)} DAYS LEFT</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-2 border-t border-gothic-border/10 flex justify-end">
                        <span className="font-mono text-[8.5px] text-gothic-gold uppercase tracking-widest group-hover:translate-x-1 duration-150 transition-all inline-flex items-center gap-1.5 font-bold">
                          OPEN LEDGER <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT SIDE (MODAL COMPATIBLE POP-UP PORTAL) */}
            {isDetailModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* BACKDROP OVERLAY */}
                <div 
                  className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
                  onClick={() => {
                    soundEngine.playClick();
                    setIsDetailModalOpen(false);
                  }}
                />

                {/* THE POP-UP CARD DETAILS BLOCK */}
                <div className="relative w-full max-w-2xl bg-gothic-card p-6 md:p-8 rounded-2xl border-2 border-gothic-gold/70 relative text-left space-y-6 shadow-[0_0_50px_rgba(0,0,0,0.92)] max-h-[85vh] overflow-y-auto z-10">
                  
                  {/* Visual frame accents for true dark fantasy setting */}
                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-gothic-gold/25" />
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-gothic-gold/25" />
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-gothic-gold/25" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-gothic-gold/25" />

                  {/* Close Header banner */}
                  <div className="flex justify-between items-center border-b border-gothic-border/30 pb-4">
                    <div className="flex items-center gap-2">
                      <ProceduralEmblem name={activeCampaign.title} id={activeCampaign.id} createdAt={activeCampaign.createdAt} difficulty="Mortal Penance" size={32} />
                      <div>
                        <span className="block font-mono text-[8px] text-gray-500 uppercase tracking-widest">Active Campaign Title</span>
                        <h3 className="font-cinzel text-sm font-black text-gothic-gold tracking-widest uppercase">
                          {activeCampaign.title}
                        </h3>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        soundEngine.playClick();
                        setIsDetailModalOpen(false);
                      }}
                      className="px-3 py-1 bg-gothic-gold/10 hover:bg-gothic-gold text-gothic-gold hover:text-black border border-gothic-gold/40 font-mono text-[8px] uppercase tracking-widest font-black transition-all cursor-pointer rounded"
                    >
                      † CLOSE LEDGER
                    </button>
                  </div>

                  {/* Campaign Status Box */}
                  <div className="bg-black/40 border border-gothic-border/60 px-4 py-2.5 rounded-xl flex items-center justify-between gap-3">
                    <div>
                      <span className="font-mono text-[7px] text-gray-500 uppercase tracking-widest block">Campaign Status</span>
                      <span className="font-mono text-[9px] font-bold text-gothic-gold uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                        <Shield className="w-3 h-3 text-gothic-gold animate-pulse" />
                        {activeCampaign.status === 'In Quest' ? 'In Quest (Active)' : activeCampaign.status}
                      </span>
                    </div>

                    <span className="font-mono text-[8px] text-emerald-500 uppercase font-black bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                      ★ Focus Active
                    </span>
                  </div>

                  {/* HUD Panel containing: Completion %, Days Remaining, Current Phase */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-gothic-back/75 border border-gothic-border/60 p-4 rounded-xl">
                    {/* Completion % */}
                    <div className="space-y-1 text-center sm:text-left">
                      <span className="block font-mono text-[8px] text-gray-500 uppercase tracking-widest">Completion %</span>
                      <span className="block font-cinzel text-md font-black text-gothic-gold text-sm">
                        {calculateCampaignProgress(activeCampaign).percentage}% Complete
                      </span>
                      <div className="w-full h-1 bg-black rounded-lg overflow-hidden mt-1.5 border border-gothic-border/20">
                        <div 
                          className="h-full bg-gothic-gold"
                          style={{ width: `${calculateCampaignProgress(activeCampaign).percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Days Remaining */}
                    <div className="space-y-1 text-center sm:text-left border-t sm:border-t-0 sm:border-l border-gothic-border/40 sm:pl-4 pt-2.5 sm:pt-0">
                      <span className="block font-mono text-[8px] text-gray-500 uppercase tracking-widest">Days Remaining</span>
                      <span className="block font-cinzel text-md font-black text-gray-200 text-sm">
                        📅 {getDaysRemaining(activeCampaign)} Days Left
                      </span>
                      <span className="block font-mono text-[7px] text-gray-500 uppercase mt-0.5">30-DAY TEMPLE PERIOD</span>
                    </div>

                    {/* Current Phase */}
                    <div className="space-y-1 text-center sm:text-left border-t sm:border-t-0 sm:border-l border-gothic-border/40 sm:pl-4 pt-2.5 sm:pt-0">
                      <span className="block font-mono text-[8px] text-gray-500 uppercase tracking-widest">Current Phase</span>
                      <span className="block font-cinzel text-md font-black text-gothic-gold-dim uppercase truncate text-sm">
                        🛡️ {getPhaseAndWeek(activeCampaign).phaseName}
                      </span>
                      <span className="block font-mono text-[7px] text-emerald-500 uppercase font-black tracking-widest mt-1">
                        Active Focus Tier
                      </span>
                    </div>
                  </div>

                  {/* Strategic Roadmap Progress (Visualization of Phases) */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-cinzel text-[10px] font-bold text-gothic-gold uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-gothic-gold" />
                        Campaign Progress Roadmap & Milestones
                      </h4>
                      {previewStageIndex !== null && (
                        <button
                          onClick={() => {
                            soundEngine.playClick();
                            setPreviewStageIndex(null);
                          }}
                          className="font-mono text-[7.5px] text-gothic-gold/80 hover:text-gothic-gold uppercase tracking-widest border border-gothic-gold/30 hover:border-gothic-gold px-1.5 py-0.5 rounded transition-all bg-black/40"
                        >
                          Show Current active
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {activeCampaign.stages.map((stage, idx) => {
                        const activePhaseInfo = getPhaseAndWeek(activeCampaign);
                        const activeStageIndex = activePhaseInfo.index;
                        const isCurrent = activeStageIndex === idx;
                        const hasCompletedAll = stage.tasks?.every(task => 
                          quests.some(q => q.title.toLowerCase().includes(task.title.toLowerCase()) && q.completed)
                        );
                        const currentViewStageIndex = previewStageIndex !== null ? previewStageIndex : activeStageIndex;
                        const isSelectedForPreview = currentViewStageIndex === idx;

                        return (
                          <div 
                            key={idx} 
                            onClick={() => {
                              soundEngine.playClick();
                              setPreviewStageIndex(idx);
                            }}
                            className={`p-2.5 rounded-lg border text-center flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] ${
                              isSelectedForPreview 
                                ? 'bg-gothic-gold/20 border-gothic-gold text-gothic-gold ring-1 ring-gothic-gold/40 shadow-[0_0_10px_rgba(200,158,92,0.15)] font-bold' 
                                : isCurrent 
                                  ? 'bg-gothic-gold/5 border-gothic-gold/60 text-gothic-gold/90' 
                                  : hasCompletedAll 
                                    ? 'bg-black/35 border-emerald-950/40 text-gray-500' 
                                    : 'bg-black/20 border-gothic-border/40 text-gray-600 hover:text-gray-400'
                            }`}
                          >
                            <span className="block font-cinzel text-[8.5px] font-semibold uppercase leading-none truncate mb-1">
                              {stage.name.replace('Phase ', 'Ph. ')}
                            </span>
                            <span className={`block font-mono text-[7px] uppercase font-black tracking-widest ${
                              isSelectedForPreview 
                                ? 'text-gothic-gold' 
                                : isCurrent 
                                  ? 'text-gothic-gold' 
                                  : hasCompletedAll 
                                    ? 'text-emerald-500' 
                                    : 'text-gray-600'
                            }`}>
                              {hasCompletedAll ? '✔ SECURED' : isCurrent ? '★ FOCUS' : '🔒 LOCKED'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Target Current Objectives View (Direct checkable targets for active development phase) */}
                  <div className="space-y-3 border-t border-gothic-border/30 pt-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-cinzel text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        {(() => {
                          const activePhaseInfo = getPhaseAndWeek(activeCampaign);
                          const activeStageIndex = activePhaseInfo.index;
                          const currentViewStageIndex = previewStageIndex !== null ? previewStageIndex : activeStageIndex;
                          if (currentViewStageIndex === activeStageIndex) {
                            return <>🕯️ Current Objectives (Check off to advance)</>;
                          } else if (currentViewStageIndex > activeStageIndex) {
                            return <>🔒 Previewing Locked Objectives</>;
                          } else {
                            return <>✔ Previewing Completed Objectives</>;
                          }
                        })()}
                      </h4>
                      <span className="font-mono text-[8px] text-gothic-gold uppercase tracking-widest">
                        {(() => {
                          const activePhaseInfo = getPhaseAndWeek(activeCampaign);
                          const activeStageIndex = activePhaseInfo.index;
                          const currentViewStageIndex = previewStageIndex !== null ? previewStageIndex : activeStageIndex;
                          const currentViewStage = activeCampaign.stages[currentViewStageIndex];
                          return currentViewStage?.name || `Phase ${currentViewStageIndex + 1}`;
                        })()}
                      </span>
                    </div>

                    {/* Distribution action bar if not carved yet */}
                    {!activeCampaign.linkedQuestsAdded && (
                      <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div>
                          <span className="block font-cinzel text-[8.5px] text-gothic-gold uppercase font-bold tracking-wider">Uncarved Campaign Blueprint</span>
                          <p className="font-mono text-[7.5px] text-gray-400 uppercase tracking-wide mt-0.5">Tasks have not been carved onto thy calendar. Click to distribute evenly.</p>
                        </div>
                        <div className="flex items-center gap-1.5 self-end sm:self-center">
                          <input 
                            type="date" 
                            value={startDateStr}
                            onChange={(e) => setStartDateStr(e.target.value)}
                            className="bg-black border border-gothic-border/80 font-mono text-[8px] uppercase px-2 py-1 text-gray-300 rounded focus:border-gothic-gold"
                          />
                          <button
                            onClick={() => handleCarveToCalendar(activeCampaign)}
                            className="px-2.5 py-1 bg-gothic-gold/25 hover:bg-gothic-gold text-gothic-gold hover:text-black border border-gothic-gold/40 hover:border-transparent font-mono text-[8px] uppercase tracking-widest font-black transition-all cursor-pointer rounded"
                          >
                            Carve To Calendar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* List of objectives in the current phase */}
                    <div className="space-y-2">
                      {(() => {
                        const activePhaseInfo = getPhaseAndWeek(activeCampaign);
                        const activeStageIndex = activePhaseInfo.index;
                        const currentViewStageIndex = previewStageIndex !== null ? previewStageIndex : activeStageIndex;
                        const currentViewStage = activeCampaign.stages[currentViewStageIndex];
                        const isStageLocked = currentViewStageIndex > activeStageIndex;

                        return currentViewStage?.tasks?.map((task) => {
                          const matchingQuest = quests.find(q => 
                            q.title.toLowerCase().includes(task.title.toLowerCase())
                          );
                          const isCompleted = !!(matchingQuest && matchingQuest.completed);
                          const isExpanded = !!expandedTaskIds[task.id];

                          return (
                            <div 
                              key={task.id}
                              onClick={() => {
                                soundEngine.playClick();
                                setExpandedTaskIds(prev => ({
                                  ...prev,
                                  [task.id]: !prev[task.id]
                                }));
                              }}
                              className={`p-3 rounded-xl border transition-all duration-200 flex flex-col gap-2.5 cursor-pointer text-left select-none ${
                                isExpanded 
                                  ? 'bg-gothic-card border-gothic-gold/60 shadow-[inset_0_0_10px_rgba(200,158,92,0.08)]' 
                                  : 'bg-black/40 border-gothic-border/30 hover:border-gothic-gold/50'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-2.5">
                                {/* Left details trigger */}
                                <div className="min-w-0 flex-1 flex items-start gap-2">
                                  <ChevronRight className={`w-3.5 h-3.5 mt-0.5 text-gothic-gold transition-transform duration-200 shrink-0 ${
                                    isExpanded ? 'rotate-90' : ''
                                  }`} />
                                  <div className="min-w-0 flex-1">
                                    <span className={`block font-cinzel text-[10px] uppercase font-bold tracking-wider ${
                                      isCompleted ? 'line-through text-gray-500' : 'text-gray-200'
                                    } ${isExpanded ? '' : 'truncate'}`}>
                                      {task.title}
                                    </span>
                                    <span className={`block font-mono text-[8.5px] text-gray-500 uppercase mt-0.5 ${
                                      isExpanded ? 'whitespace-normal text-gray-400 font-medium' : 'truncate'
                                    }`}>
                                      {task.description}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Right interactive items */}
                                <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <span className="font-mono text-[6.5px] text-gray-500 uppercase border border-gothic-border/40 px-1 py-0.5 rounded leading-none">
                                    {task.difficulty}
                                  </span>
                                  {isStageLocked ? (
                                    <div 
                                      className="w-4 h-4 rounded border border-gothic-border/20 bg-black/40 text-gray-600 flex items-center justify-center cursor-not-allowed opacity-60"
                                      title="This phase is locked. Resolve current objectives first."
                                    >
                                      <Lock className="w-2.5 h-2.5" />
                                    </div>
                                  ) : (
                                    <div 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleTaskCheckbox(activeCampaign, task.title);
                                      }}
                                      className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-all ${
                                        isCompleted 
                                          ? 'border-gothic-gold bg-gothic-gold/15 text-gothic-gold' 
                                          : 'border-gothic-border bg-gothic-back/40 text-transparent hover:border-gothic-gold/40'
                                      }`}
                                    >
                                      {isCompleted && <Check className="w-3 h-3" />}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Expanded interactive block */}
                              {isExpanded && (
                                <div className="pt-2 border-t border-gothic-border/10 flex flex-col gap-2 bg-gothic-back/30 p-2.5 rounded-lg text-[8.5px] font-mono text-gray-400 uppercase tracking-wider">
                                  <div className="flex justify-between items-center text-[7.5px] text-gray-500">
                                    <span>Objective Type: Daily Vow</span>
                                    <span>Task Master: Penitent's Oath</span>
                                  </div>
                                  <div className="text-gray-300 normal-case font-sans">
                                    <span className="font-bold text-[8.5px] font-mono text-gothic-gold uppercase tracking-widest block mb-1">Details:</span>
                                    {task.description || "No ancient scriptures recorded for this objective."}
                                  </div>
                                  <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-gothic-border/5">
                                    <span className="text-[7.5px] text-yellow-500/80 font-bold">★ XP value: {task.difficulty === 'Sinuous Vow' ? 150 : task.difficulty === 'Mortal Penance' ? 300 : 75} XP</span>
                                    {isStageLocked ? (
                                      <span className="text-[7.5px] text-gothic-crimson uppercase tracking-widest font-black flex items-center gap-1.5 bg-gothic-crimson/10 border border-gothic-crimson/20 px-2.5 py-1 rounded">
                                        🔒 Locked • Resolve active focus tier first
                                      </span>
                                    ) : (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleTaskCheckbox(activeCampaign, task.title);
                                        }}
                                        className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold border transition-all ${
                                          isCompleted 
                                            ? 'bg-gothic-gold/10 border-gothic-gold/30 text-gothic-gold' 
                                            : 'bg-gothic-gold/20 border-gothic-gold text-black hover:bg-gothic-gold/30 hover:text-gothic-gold'
                                        }`}
                                      >
                                        {isCompleted ? '† MARK UNFINISHED' : '† CLEANSE & COMPLETE'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* AI Assessment (Encouraging feedback/appraisal details) */}
                  <div className="p-4 rounded-xl bg-gothic-gold/5 border border-gothic-border/60 text-left space-y-2 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-5">
                      <Sparkles className="w-12 h-12 text-gothic-gold" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-gothic-gold animate-pulse" />
                      <span className="font-cinzel text-[9.5px] text-[#c89e5c] uppercase font-bold tracking-widest">
                        Strategist AI Assessment
                      </span>
                    </div>
                    <p className="font-mono text-[9px] text-[#a0aab8] uppercase leading-relaxed font-semibold">
                      {generateDynamicAdvisorText(activeCampaign)}
                    </p>
                  </div>

                  {/* Bottom Attribute Catalyst logs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                    <div className="p-3.5 bg-gothic-back rounded-xl border border-gothic-border/30">
                      <span className="block font-mono text-[7px] text-gray-500 uppercase tracking-widest">Mastery Catalysts</span>
                      <span className="font-cinzel text-[10.5px] font-black text-gothic-gold uppercase tracking-widest mt-1 block leading-tight">
                        ⚔️ Attribute Mastery Unlocks
                      </span>
                    </div>
                    <div className="p-3.5 bg-gothic-back rounded-xl border border-gothic-border/30">
                      <span className="block font-mono text-[7px] text-gray-500 uppercase tracking-widest">Avatar Evolution Influence</span>
                      <span className="font-cinzel text-[10.5px] font-black text-[#5fc6f0] uppercase tracking-widest mt-1 block leading-tight">
                        💎 Promotes Level-Up XP
                      </span>
                    </div>
                  </div>

                  {/* Abandon Command Trigger */}
                  <div className="pt-4 border-t border-gothic-border/25 text-right">
                    <button
                      onClick={() => {
                        if (confirm(`Penitent, are you sure you want to abandon "${activeCampaign.title}" campaign? This will delete all its calendar steps forever.`)) {
                          onAbandonCampaign(activeCampaign.id);
                          setIsDetailModalOpen(false);
                          setSelectedGoalId(null);
                        }
                      }}
                      className="p-2.5 bg-gothic-back hover:bg-gothic-crimson/15 border border-gothic-crimson/25 hover:border-gothic-crimson rounded text-gothic-crimson text-[8.5px] font-mono uppercase tracking-widest cursor-pointer transition-all inline-flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Abandon Crusade Campaign
                    </button>
                  </div>

                </div>
              </div>
            )}
          </motion.div>
        )}

        {miniTab === 'create' && (
          <motion.div
            key="create-tab-panel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-8 text-left"
          >
            {/* LEFT COLUMN/TOP PORTION (SECTION 1): QUICK TASKS */}
            <div className="md:col-span-5 space-y-5">
              <div className="p-6 bg-gothic-card rounded-2xl border-2 border-gothic-border relative overflow-hidden text-left space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-gothic-gold/20" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-gothic-gold/20" />

                <div className="border-b border-gothic-border/20 pb-3">
                  <h3 className="font-cinzel text-xs font-black text-gothic-gold uppercase tracking-widest">
                    Quick Tasks
                  </h3>
                  <p className="font-mono text-[8px] text-gray-500 uppercase tracking-widest mt-0.5">
                    What needs to be done?
                  </p>
                </div>

                <form onSubmit={handleAddQuickTask} className="space-y-3">
                  <input
                    type="text"
                    required
                    maxLength={100}
                    placeholder="Enter quick task title..."
                    value={quickTaskTitle}
                    onChange={(e) => setQuickTaskTitle(e.target.value)}
                    className="w-full bg-gothic-back border border-gothic-border/80 focus:border-gothic-gold rounded-lg px-3.5 py-2.5 text-xs text-white font-mono placeholder:text-gray-600 focus:outline-none transition-all"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gothic-gold text-black hover:bg-amber-500 font-mono text-[9px] uppercase tracking-widest font-black rounded-lg transition-all cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
                  >
                    [ Create Task ]
                  </button>
                </form>

                <div className="space-y-1.5 pt-1">
                  <span className="block text-[7.5px] font-mono text-gray-500 uppercase tracking-widest font-semibold">Examples of Quick Devotions:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['Buy groceries', 'Submit assignment', 'Call friend', 'Pay electricity bill'].map((exTask) => (
                      <button
                        key={exTask}
                        type="button"
                        onClick={() => {
                          soundEngine.playClick();
                          setQuickTaskTitle(exTask);
                        }}
                        className="px-2 py-1 bg-gothic-back hover:bg-gothic-gold/10 text-gray-400 hover:text-white border border-gothic-border/65 rounded font-mono text-[7.5px] uppercase transition-all cursor-pointer"
                      >
                        {exTask}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-gray-500 font-mono text-[7.5px] uppercase tracking-wider leading-relaxed border-t border-gothic-border/10 pt-3">
                  Quick Tasks are: <br />
                  • One-time objectives <br />
                  • No phases & no progression <br />
                  • No AI roadmaps & no skill rewards <br />
                  Complete → Archive
                </div>
              </div>

              {/* QUICK TASKS LIVE CHECKBOX PANEL (FOR IMMEDIATE ACTION WITHIN THIS TAB) */}
              <div className="p-4 bg-gothic-card/50 rounded-xl border border-gothic-border/40 text-left space-y-3">
                <span className="font-cinzel text-[8.5px] font-bold text-gray-500 uppercase tracking-widest block border-b border-gothic-border/10 pb-1.5">
                  🛡️ Pure Active Tasks List ({quickTasksPool.length})
                </span>
                
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {quickTasksPool.length === 0 ? (
                    <div className="text-center py-4 text-gray-600 font-mono text-[7.5px] uppercase">
                      No active quick tasks inside ledger.
                    </div>
                  ) : (
                    quickTasksPool.map((task) => (
                      <div 
                        key={task.id}
                        className="p-2 rounded bg-gothic-back/40 border border-gothic-border/30 flex justify-between items-center"
                      >
                        <div className="flex items-center gap-2 max-w-[80%]">
                          <button
                            onClick={() => onCompleteQuest(task.id)}
                            className={`w-4 h-4 border flex items-center justify-center rounded transition-all flex-shrink-0 ${
                              task.completed 
                                ? 'border-gothic-gold bg-gothic-gold/20 text-gothic-gold' 
                                : 'border-gothic-border bg-gothic-back text-transparent hover:border-gothic-gold'
                            }`}
                          >
                            {task.completed && <Check className="w-3 h-3" />}
                          </button>
                          <span className={`font-cinzel text-[9px] uppercase truncate ${
                            task.completed ? 'line-through text-gray-600' : 'text-gray-300 font-semibold'
                          }`}>
                            {task.title}
                          </span>
                        </div>
                        <button
                          onClick={() => onDeleteQuest(task.id)}
                          className="text-gray-600 hover:text-gothic-crimson p-0.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN/BOTTOM PORTION (SECTION 2): CAMPAIGN CREATION */}
            <div className="md:col-span-7">
              <div className="p-6 bg-gothic-card rounded-2xl border-2 border-gothic-border relative overflow-hidden text-left space-y-5 shadow-[0_4px_24px_rgba(0,0,0,0.7)] flex flex-col justify-between min-h-[380px]">
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-gothic-gold/20" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-gothic-gold/20" />

                <div className="space-y-4">
                  <div className="border-b border-gothic-border/20 pb-3">
                    <h3 className="font-cinzel text-xs font-black text-gothic-gold uppercase tracking-widest">
                      Campaign Creation
                    </h3>
                    <p className="font-mono text-[8px] text-gray-500 uppercase tracking-widest mt-0.5">
                      What do you want to become?
                    </p>
                  </div>

                  <form onSubmit={handleCreateCampaignSubmit} className="space-y-3.5">
                    <div className="space-y-2">
                      <label className="block text-[8px] font-mono text-gray-400 uppercase tracking-widest font-semibold">
                        Divine Aspiration Seed / Master Objective
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="E.g., Learn Guitar, Build Muscle, Learn React, Improve Sleep..."
                        value={aspirationInput}
                        onChange={(e) => setAspirationInput(e.target.value)}
                        className="w-full bg-gothic-back border border-gothic-border/70 hover:border-gothic-gold focus:border-gothic-gold px-3.5 py-2.5 text-xs text-white rounded-lg focus:outline-none focus:ring-0 placeholder:text-gray-700 font-mono"
                      />
                    </div>

                    {planError && (
                      <div className="p-2 bg-gothic-crimson/5 border border-gothic-crimson/25 text-gothic-crimson text-[8px] font-mono uppercase rounded">
                        ⚠️ Oracle Failure: {planError}
                      </div>
                    )}

                    <div className="space-y-1">
                      <span className="block text-[7.5px] font-mono text-gray-500 uppercase tracking-widest font-semibold">Ready Aspiration Blueprints:</span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {['Learn Guitar', 'Build Muscle', 'Learn React', 'Improve Sleep', 'Become Disciplined'].map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              soundEngine.playClick();
                              setAspirationInput(tag);
                            }}
                            className="px-2.5 py-1 bg-gothic-back hover:bg-gothic-gold/15 text-gray-400 hover:text-white border border-gothic-border/60 hover:border-gothic-gold rounded font-mono text-[8px] uppercase transition-all cursor-pointer"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isPlanningLoading}
                      className="w-full py-3 bg-gradient-to-r from-gothic-crimson to-red-800 text-white font-cinzel font-black tracking-widest text-[9.5px] uppercase rounded-lg border border-gothic-gold/25 cursor-pointer disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                    >
                      {isPlanningLoading ? (
                        <>
                          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          COMMUNING WITH ANCIENT SAGES (AI)...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 text-gothic-gold animate-spin-slow animate-pulse" />
                          [ Generate Campaign ]
                        </>
                      )}
                    </button>
                  </form>
                </div>

                <div className="border-t border-gothic-border/10 pt-3 text-gray-500 font-mono text-[7.5px] uppercase tracking-wider leading-relaxed">
                  The AI analyzes thy goal and generates: <br />
                  • Immersive 5-phase structured RPG roadmap <br />
                  • Weekly focused objectives & task blueprints <br />
                  • Personalized Strategist AI milestones & appraisals <br />
                  • Skill progression indicators & attribute catalysts
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
