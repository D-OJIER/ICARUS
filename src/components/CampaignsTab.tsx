import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  StyleSheet, 
  Alert,
  Dimensions,
  Platform,
  Modal
} from 'react-native';
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
  Lock,
  Swords,
  Tag
} from 'lucide-react-native';
import { Quest, Goal, QuestDifficulty, QuestCategory } from '../types';
import { ProceduralEmblem } from './ProceduralEmblem';
import { soundEngine } from '../utils/audio';
import { getLocalDateString, getTodayLocalDateString } from '../utils/dateUtils';
import { generateGoalPlan, getApiKey } from '../utils/aiEngine';
import { COLORS, FONTS } from '../theme';

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
  const [miniTab, setMiniTab] = useState<'active' | 'create'>('active');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({});
  
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [aspirationInput, setAspirationInput] = useState('');
  
  const [isPlanningLoading, setIsPlanningLoading] = useState(false);
  const [planError, setPlanError] = useState('');
  const [startDateStr, setStartDateStr] = useState<string>(() => getTodayLocalDateString());
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [previewStageIndex, setPreviewStageIndex] = useState<number | null>(null);

  useEffect(() => {
    setPreviewStageIndex(null);
  }, [selectedGoalId, isDetailModalOpen]);

  useEffect(() => {
    if (goals.length === 0) {
      setMiniTab('create');
      setIsDetailModalOpen(false);
    } else if (!selectedGoalId && goals.length > 0) {
      setSelectedGoalId(goals[0].id);
    }
  }, [goals, selectedGoalId]);

  const activeCampaign = goals.find(g => g.id === selectedGoalId) || (goals.length > 0 ? goals[0] : null);

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

  const getDaysRemaining = (goal: Goal): number => {
    // Try multiple strategies to parse createdAt
    let createdMs = NaN;
    if (goal.createdAt) {
      createdMs = Date.parse(goal.createdAt);
      // Fallback: numeric timestamp stored as string
      if (isNaN(createdMs)) {
        const asNum = Number(goal.createdAt);
        if (!isNaN(asNum)) createdMs = asNum;
      }
    }
    const totalDuration = Math.max(30, (goal.stages?.length ?? 4) * 7);
    if (isNaN(createdMs)) {
      // Can't determine start date — assume just started
      return totalDuration;
    }
    const diffDays = Math.floor((Date.now() - createdMs) / (1000 * 60 * 60 * 24));
    return Math.max(0, totalDuration - diffDays);
  };

  const generateDynamicAdvisorText = (goal: Goal) => {
    const progress = calculateCampaignProgress(goal);
    const pct = progress.percentage;
    if (pct === 0) {
      return `Thy pilgrimage of "${goal.title}" has been freshly inscribed inside the sacred Ledger. Settle thy resolve, carve thy dates, and execute the starting vows to generate momentum.`;
    } else if (pct < 35) {
      return `Thy campaign of "${goal.title}" is progressing firmly at ${pct}% completion. Foundations are taking root but remain vulnerable to slackened resolve. Execute thy daily penance.`;
    } else if (pct < 75) {
      return `With ${pct}% complete, the rhythm of thy "${goal.title}" crusade has begun modifying thy spirit. Transform trials into clean execution. Commit under pressure.`;
    } else if (pct < 100) {
      return `Glorious triumph is within grasp! At ${pct}% complete, thy final evolution of the "${goal.title}" blueprint is settling. Walk forward with steadfast determination.`;
    } else {
      return `† Sacred Covenant Complete! Thy "${goal.title}" has undergone the ultimate forge alchemy. High attributes are unlocked on thy character ledger.`;
    }
  };

  const handleCreateCampaignSubmit = async () => {
    const aspiration = aspirationInput.trim();
    if (!aspiration) {
      setPlanError('Please declare what thou wish to become.');
      return;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      setPlanError('AI is unavailable. Please come back later.');
      return;
    }

    soundEngine.playClick();
    setIsPlanningLoading(true);
    setPlanError('');

    try {
      const rawPlan = await generateGoalPlan(aspiration);
      
      if (!rawPlan || (rawPlan as any).error) {
        throw new Error('AI is unavailable. Please come back later.');
      }

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
      setPlanError('AI is unavailable. Please come back later.');
    } finally {
      setIsPlanningLoading(false);
    }
  };

  const handleAddQuickTask = () => {
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

  const handleAbandonCampaignClick = (goal: Goal) => {
    Alert.alert(
      "Abandon Crusade",
      `Penitent, are you sure you want to abandon "${goal.title}" campaign? This will delete all its calendar steps forever.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Abandon", 
          style: "destructive",
          onPress: () => {
            onAbandonCampaign(goal.id);
            setIsDetailModalOpen(false);
            setSelectedGoalId(null);
          }
        }
      ]
    );
  };

  const quickTasksPool = quests.filter(q => {
    const isCampaignQuests = q.title.startsWith('⚔️ [') || q.title.includes('] ');
    return !isCampaignQuests;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
      
      {/* Header */}
      <View style={styles.header}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Shield size={14} color={COLORS.gothicGold} />
                <Text style={styles.headerTitle}>CAMPAIGNS</Text>
              </View>
        <Text style={styles.headerSubtitle}>Sovereign Ledger of thy Growth & One-Time Devotions</Text>
      </View>

      {/* Segment Selector */}
      <View style={styles.tabContainer}>
        <View style={styles.tabsWrapper}>
          <TouchableOpacity
            onPress={() => {
              soundEngine.playClick();
              if (goals.length > 0) setMiniTab('active');
            }}
            disabled={goals.length === 0}
            style={[styles.tabButton, miniTab === 'active' && styles.tabActive]}
          >
            <Text style={[styles.tabText, miniTab === 'active' ? styles.tabTextActive : { color: COLORS.gray500 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Shield size={11} color={COLORS.gothicGold} />
                <Text style={{ fontFamily: FONTS.mono, fontSize: 9, fontWeight: 'bold', color: COLORS.gothicGold }}>ACTIVE CAMPAIGNS</Text>
              </View>
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              soundEngine.playClick();
              setMiniTab('create');
            }}
            style={[styles.tabButton, miniTab === 'create' && styles.tabActive]}
          >
            <Text style={[styles.tabText, miniTab === 'create' ? styles.tabTextActive : { color: COLORS.gray500 }]}>
              🖋️ CREATE NEW
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Tab Panel */}
      {miniTab === 'active' && activeCampaign && (
        <View style={styles.activePanel}>
          <Text style={styles.subHeading}>Active Safekeeping Ledger ({goals.length})</Text>
          
          <View style={styles.goalsGrid}>
            {goals.map((goal) => {
              const progress = calculateCampaignProgress(goal);
              return (
                <TouchableOpacity
                  key={goal.id}
                  onPress={() => {
                    soundEngine.playClick();
                    setSelectedGoalId(goal.id);
                    setIsDetailModalOpen(true);
                  }}
                  style={styles.goalCard}
                >
                  <View style={[styles.cardCorner, { top: 0, left: 0, borderTopWidth: 1, borderLeftWidth: 1 }]} />
                  <View style={[styles.cardCorner, { bottom: 0, right: 0, borderBottomWidth: 1, borderRightWidth: 1 }]} />

                  <View style={styles.goalCardHeader}>
                    <ProceduralEmblem name={goal.title} id={goal.id} createdAt={goal.createdAt} difficulty="Sinuous Vow" size={26} />
                    <View style={styles.goalCardHeaderText}>
                      <Text style={styles.goalCardTitle} numberOfLines={1}>{goal.title}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Tag size={10} color={COLORS.gothicGold} />
                        <Text style={styles.goalCardCategory}>{goal.categoryName}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.progressBarWrapper}>
                    <View style={styles.progressBarBackground}>
                      <View style={[styles.progressBarFill, { width: `${progress.percentage}%` }]} />
                    </View>
                    <View style={styles.progressBarLabelRow}>
                      <Text style={styles.progressLabel}>{progress.percentage}% COMPLETE</Text>
                      <Text style={styles.progressLabel}>{getDaysRemaining(goal)} DAYS LEFT</Text>
                    </View>
                  </View>

                  <View style={styles.goalCardFooter}>
                    <Text style={styles.footerLinkText}>OPEN LEDGER  →</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Create Tab Panel */}
      {miniTab === 'create' && (
        <View style={styles.createPanel}>
          
          {/* Quick Tasks Section */}
          <View style={styles.sectionCard}>
            <View style={[styles.cardCorner, { top: 0, left: 0, borderTopWidth: 1, borderLeftWidth: 1 }]} />
            <View style={[styles.cardCorner, { bottom: 0, right: 0, borderBottomWidth: 1, borderRightWidth: 1 }]} />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quick Tasks</Text>
              <Text style={styles.sectionSubtitle}>What needs to be done?</Text>
            </View>

            <TextInput
              maxLength={100}
              placeholder="Enter quick task title..."
              placeholderTextColor={COLORS.gray700}
              value={quickTaskTitle}
              onChangeText={setQuickTaskTitle}
              style={styles.textInput}
            />

            <TouchableOpacity style={styles.quickTaskSubmitBtn} onPress={handleAddQuickTask}>
              <Text style={styles.quickTaskSubmitBtnText}>[ Create Task ]</Text>
            </TouchableOpacity>

            <View style={styles.examplesRow}>
              {['Buy groceries', 'Submit homework', 'Call client'].map((exTask) => (
                <TouchableOpacity
                  key={exTask}
                  onPress={() => {
                    soundEngine.playClick();
                    setQuickTaskTitle(exTask);
                  }}
                  style={styles.exampleBadge}
                >
                  <Text style={styles.exampleBadgeText}>{exTask.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Quick Tasks List */}
          <View style={styles.sectionCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Swords size={13} color={COLORS.gothicGold} />
              <Text style={styles.sectionTitle}>Active Tasks List ({quickTasksPool.length})</Text>
            </View>
            <View style={styles.quickTasksList}>
              {quickTasksPool.length === 0 ? (
                <Text style={styles.noTasksText}>No active quick tasks inside ledger.</Text>
              ) : (
                quickTasksPool.map((task) => (
                  <View key={task.id} style={styles.quickTaskItem}>
                    <TouchableOpacity 
                      onPress={() => onCompleteQuest(task.id)}
                      style={[styles.smallCheckbox, task.completed && { borderColor: COLORS.gothicGold, backgroundColor: 'rgba(200, 158, 92, 0.2)' }]}
                    >
                      {task.completed && <Check size={10} color={COLORS.gothicGold} />}
                    </TouchableOpacity>
                    <Text style={[styles.quickTaskTitleText, task.completed && { textDecorationLine: 'line-through', color: COLORS.gray600 }]} numberOfLines={1}>
                      {task.title}
                    </Text>
                    <TouchableOpacity onPress={() => onDeleteQuest(task.id)}>
                      <Trash2 size={12} color={COLORS.gray600} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </View>

          {/* Campaign Creation Section */}
          <View style={styles.sectionCard}>
            <View style={[styles.cardCorner, { top: 0, right: 0, borderTopWidth: 1, borderRightWidth: 1 }]} />
            <View style={[styles.cardCorner, { bottom: 0, left: 0, borderBottomWidth: 1, borderLeftWidth: 1 }]} />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Campaign Creation</Text>
              <Text style={styles.sectionSubtitle}>What do you want to become?</Text>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>DIVINE ASPIRATION SEED / MASTER OBJECTIVE</Text>
              <TextInput
                placeholder="E.g., Learn Guitar, Build Muscle, Learn React..."
                placeholderTextColor={COLORS.gray700}
                value={aspirationInput}
                onChangeText={setAspirationInput}
                style={styles.textInput}
              />
            </View>

            {planError ? (
              <View style={styles.planErrorBox}>
                <Text style={styles.planErrorText}>⚠️ Oracle Failure: {planError}</Text>
              </View>
            ) : null}

            <View style={styles.examplesRow}>
              {['Learn Guitar', 'Build Muscle', 'Learn React', 'Improve Sleep'].map((tag) => (
                <TouchableOpacity
                  key={tag}
                  onPress={() => {
                    soundEngine.playClick();
                    setAspirationInput(tag);
                  }}
                  style={styles.exampleBadge}
                >
                  <Text style={styles.exampleBadgeText}>{tag.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.campaignSubmitBtn, isPlanningLoading && { opacity: 0.5 }]} 
              onPress={handleCreateCampaignSubmit}
              disabled={isPlanningLoading}
            >
              {isPlanningLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <View style={styles.campaignSubmitContent}>
                  <RefreshCw size={12} color={COLORS.gothicGold} />
                  <Text style={styles.campaignSubmitBtnText}>[ GENERATE CAMPAIGN ]</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

        </View>
      )}

      {/* DETAIL MODAL OVERLAY */}
      <Modal visible={isDetailModalOpen && !!activeCampaign} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.modalCorner, { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 }]} />
            <View style={[styles.modalCorner, { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 }]} />
            <View style={[styles.modalCorner, { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 }]} />
            <View style={[styles.modalCorner, { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 }]} />
            
            {activeCampaign && (
              <ScrollView style={styles.modalContent} contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
                
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <ProceduralEmblem name={activeCampaign.title} id={activeCampaign.id} createdAt={activeCampaign.createdAt} difficulty="Mortal Penance" size={30} />
                    <View>
                      <Text style={styles.modalHeaderCategory}>ACTIVE CAMPAIGN TITLE</Text>
                      <Text style={styles.modalHeaderTitle} numberOfLines={1}>{activeCampaign.title}</Text>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={styles.modalCloseBtn}
                    onPress={() => { soundEngine.playClick(); setIsDetailModalOpen(false); }}
                  >
                    <Text style={styles.modalCloseBtnText}>† CLOSE LEDGER</Text>
                  </TouchableOpacity>
                </View>

                {/* Campaign Status Box */}
                <View style={styles.statusBox}>
                  <View>
                    <Text style={styles.statusBoxSubText}>Campaign Status</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <Shield size={12} color={COLORS.gothicGold} />
                      <Text style={styles.statusBoxText}>
                        {activeCampaign.status === 'In Quest' ? 'In Quest (Active)' : activeCampaign.status}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusBadgeText}>★ Focus Active</Text>
                  </View>
                </View>

                {/* HUD Panel Metrics */}
                <View style={styles.hudPanel}>
                  <View style={styles.hudPanelCol}>
                    <Text style={styles.hudLabel}>COMPLETION %</Text>
                    <Text style={styles.hudValue}>{calculateCampaignProgress(activeCampaign).percentage}% Complete</Text>
                    <View style={[styles.hudProgressBarBg, { marginTop: 4 }]}>
                      <View style={[styles.hudProgressBarFill, { width: `${calculateCampaignProgress(activeCampaign).percentage}%` }]} />
                    </View>
                  </View>
                  <View style={[styles.hudPanelCol, styles.hudBorderCol]}>
                    <Text style={styles.hudLabel}>DAYS REMAINING</Text>
                    <Text style={styles.hudValue}>{getDaysRemaining(activeCampaign)} Days Left</Text>
                    <Text style={styles.hudSubLabel}>
                      {Math.max(30, (activeCampaign.stages?.length ?? 4) * 7)}-DAY TEMPLE PERIOD
                    </Text>
                  </View>
                  <View style={[styles.hudPanelCol, styles.hudBorderCol]}>
                    <Text style={styles.hudLabel}>CURRENT PHASE</Text>
                    <Text style={[styles.hudValue, { color: COLORS.gothicGold }]} numberOfLines={1}>
                      🛡️ {getPhaseAndWeek(activeCampaign).phaseName}
                    </Text>
                    <Text style={styles.hudSubLabel}>ACTIVE FOCUS TIER</Text>
                  </View>
                </View>

                {/* Milestones / Stage Selector */}
                <View style={styles.milestoneSection}>
                  <View style={styles.milestoneHeader}>
                    <BookOpen size={14} color={COLORS.gothicGold} />
                    <Text style={styles.milestoneHeaderTitle}>Campaign Progress Roadmap</Text>
                  </View>

                  <View style={styles.stageGrid}>
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
                        <TouchableOpacity
                          key={idx}
                          onPress={() => {
                            soundEngine.playClick();
                            setPreviewStageIndex(idx);
                          }}
                          style={[
                            styles.stageGridBtn,
                            isSelectedForPreview && { borderColor: COLORS.gothicGold, backgroundColor: 'rgba(200, 158, 92, 0.2)' },
                            isCurrent && !isSelectedForPreview && { borderColor: 'rgba(200, 158, 92, 0.4)', backgroundColor: 'rgba(200, 158, 92, 0.05)' },
                            hasCompletedAll && !isCurrent && !isSelectedForPreview && { borderColor: 'rgba(16, 185, 129, 0.2)', backgroundColor: 'rgba(16, 185, 129, 0.05)' }
                          ]}
                        >
                          <Text style={[styles.stageGridName, isSelectedForPreview && { color: COLORS.gothicGold }]} numberOfLines={1}>
                            {stage.name.replace('Phase ', 'Ph. ')}
                          </Text>
                          <Text style={[styles.stageGridStatus, hasCompletedAll ? { color: '#10b981' } : isCurrent ? { color: COLORS.gothicGold } : { color: COLORS.gray600 }]}>
                            {hasCompletedAll ? '✔ SECURED' : isCurrent ? '★ FOCUS' : '🔒 LOCK'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Uncarved Blueprint Alert */}
                {!activeCampaign.linkedQuestsAdded && (
                  <View style={styles.blueprintAlertCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.blueprintAlertTitle}>Uncarved Campaign Blueprint</Text>
                      <Text style={styles.blueprintAlertSubtitle}>Tasks have not been carved onto thy calendar. Click to distribute evenly.</Text>
                    </View>
                    <View style={styles.blueprintAlertActions}>
                      <TextInput
                        value={startDateStr}
                        onChangeText={setStartDateStr}
                        style={styles.startDateInput}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={COLORS.gray700}
                      />
                      <TouchableOpacity style={styles.carveBtn} onPress={() => handleCarveToCalendar(activeCampaign)}>
                        <Text style={styles.carveBtnText}>Carve To Calendar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Current Objectives List */}
                <View style={styles.objectivesSection}>
                  <Text style={styles.objectivesHeaderTitle}>
                    {(() => {
                      const activePhaseInfo = getPhaseAndWeek(activeCampaign);
                      const activeStageIndex = activePhaseInfo.index;
                      const currentViewStageIndex = previewStageIndex !== null ? previewStageIndex : activeStageIndex;
                      if (currentViewStageIndex === activeStageIndex) return '🕯️ Current Objectives';
                      if (currentViewStageIndex > activeStageIndex) return '🔒 Previewing Locked Stage';
                      return '✔ Previewing Completed Stage';
                    })()}
                  </Text>

                  <View style={{ gap: 8 }}>
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
                          <TouchableOpacity
                            key={task.id}
                            activeOpacity={0.9}
                            onPress={() => {
                              soundEngine.playClick();
                              setExpandedTaskIds(prev => ({ ...prev, [task.id]: !prev[task.id] }));
                            }}
                            style={[styles.objectiveCard, isExpanded && { borderColor: COLORS.gothicGold, backgroundColor: COLORS.gothicCard }]}
                          >
                            <View style={styles.objectiveHeaderRow}>
                              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <ChevronRight size={12} color={COLORS.gothicGold} style={isExpanded && { transform: [{ rotate: '90deg' }] }} />
                                <View style={{ flex: 1 }}>
                                  <Text style={[styles.objectiveTitle, isCompleted && { textDecorationLine: 'line-through', color: COLORS.gray600 }]} numberOfLines={1}>
                                    {task.title}
                                  </Text>
                                </View>
                              </View>
                              
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={styles.objectiveDiffBadge}>{task.difficulty.toUpperCase()}</Text>
                                {isStageLocked ? (
                                  <View style={styles.lockBadge}>
                                    <Lock size={8} color={COLORS.gray600} />
                                  </View>
                                ) : (
                                  <TouchableOpacity
                                    onPress={() => handleToggleTaskCheckbox(activeCampaign, task.title)}
                                    style={[styles.objectiveCheckbox, isCompleted && { borderColor: COLORS.gothicGold, backgroundColor: 'rgba(200, 158, 92, 0.2)' }]}
                                  >
                                    {isCompleted && <Check size={10} color={COLORS.gothicGold} />}
                                  </TouchableOpacity>
                                )}
                              </View>
                            </View>

                            {isExpanded && (
                              <View style={styles.objectiveExpanded}>
                                <Text style={styles.expandedLabel}>DETAILS:</Text>
                                <Text style={styles.expandedDesc}>
                                  {task.description || "No ancient scriptures recorded for this objective."}
                                </Text>
                                <View style={styles.expandedFooter}>
                                  <Text style={styles.xpText}>
                                    ★ XP value: {task.difficulty === 'Sinuous Vow' ? 150 : task.difficulty === 'Mortal Penance' ? 300 : 75} XP
                                  </Text>
                                  {!isStageLocked && (
                                    <TouchableOpacity 
                                      style={styles.cleanseBtn}
                                      onPress={() => handleToggleTaskCheckbox(activeCampaign, task.title)}
                                    >
                                      <Text style={styles.cleanseBtnText}>
                                        {isCompleted ? '† MARK UNFINISHED' : '† CLEANSE & COMPLETE'}
                                      </Text>
                                    </TouchableOpacity>
                                  )}
                                </View>
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      });
                    })()}
                  </View>
                </View>

                {/* AI Advisor Assessment */}
                <View style={styles.advisorCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Sparkles size={12} color={COLORS.gothicGold} />
                    <Text style={styles.advisorHeaderTitle}>Strategist AI Assessment</Text>
                  </View>
                  <Text style={styles.advisorText}>
                    {generateDynamicAdvisorText(activeCampaign)}
                  </Text>
                </View>

                {/* Unlocks Panel */}
                <View style={styles.unlocksRow}>
                  <View style={styles.unlocksBadge}>
                    <Text style={styles.unlocksSubLabel}>MASTERY CATALYSTS</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Trophy size={11} color={COLORS.gothicGold} />
                        <Text style={styles.unlocksLabel}>Attribute Masteries</Text>
                      </View>
                  </View>
                  <View style={styles.unlocksBadge}>
                    <Text style={styles.unlocksSubLabel}>EVOLUTION INFLUENCE</Text>
                    <Text style={[styles.unlocksLabel, { color: COLORS.gothicSky }]}>💎 Level-Up XP Boost</Text>
                  </View>
                </View>

                {/* Abandon Campaign Button */}
                <View style={styles.abandonWrapper}>
                  <TouchableOpacity 
                    style={styles.abandonBtn}
                    onPress={() => handleAbandonCampaignClick(activeCampaign)}
                  >
                    <Trash2 size={12} color={COLORS.gothicCrimson} />
                    <Text style={styles.abandonBtnText}>ABANDON CRUSADE CAMPAIGN</Text>
                  </TouchableOpacity>
                </View>

              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Footer info */}
      <View style={styles.footer}>
        <Text style={styles.footerTitle}>† SORROWFUL BE THE HEART, PENITENT ASHEN KNIGHT †</Text>
        <Text style={styles.footerText}>
          ICARUS • STANDALONE MOBILE PROGRESSION ENGINE
        </Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
  },
  header: {
    marginVertical: 12,
  },
  headerTitle: {
    fontFamily: FONTS.cinzel,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gothicGold,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gray500,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  tabContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  tabsWrapper: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10, 11, 13, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(46, 50, 62, 0.6)',
    borderRadius: 12,
    padding: 4,
    width: '100%',
    maxWidth: 320,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: 'rgba(200, 158, 92, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(200, 158, 92, 0.4)',
  },
  tabText: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: COLORS.gothicGold,
  },
  activePanel: {
    marginVertical: 8,
  },
  subHeading: {
    fontFamily: FONTS.cinzel,
    fontSize: 10,
    color: COLORS.gray500,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  goalsGrid: {
    gap: 12,
  },
  goalCard: {
    backgroundColor: 'rgba(24, 26, 32, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(46, 50, 62, 0.7)',
    borderRadius: 12,
    padding: 16,
    position: 'relative',
  },
  cardCorner: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderColor: COLORS.gothicGold,
    opacity: 0.3,
  },
  goalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  goalCardHeaderText: {
    flex: 1,
  },
  goalCardTitle: {
    fontFamily: FONTS.cinzel,
    fontSize: 12.5,
    fontWeight: 'bold',
    color: COLORS.gothicGold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  goalCardCategory: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    color: COLORS.gray400,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  progressBarWrapper: {
    marginTop: 14,
  },
  progressBarBackground: {
    width: '100%',
    height: 4,
    backgroundColor: '#000',
    borderRadius: 2,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(46, 50, 62, 0.2)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.gothicGold,
  },
  progressBarLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressLabel: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    color: COLORS.gray500,
  },
  goalCardFooter: {
    marginTop: 12,
    alignItems: 'flex-end',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(46, 50, 62, 0.2)',
    paddingTop: 8,
  },
  footerLinkText: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gothicGold,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  createPanel: {
    gap: 16,
  },
  sectionCard: {
    backgroundColor: COLORS.gothicCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gothicBorder,
    padding: 16,
    position: 'relative',
  },
  sectionHeader: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 50, 62, 0.2)',
    paddingBottom: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: FONTS.cinzel,
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.gothicGold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionSubtitle: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: COLORS.gray500,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  textInput: {
    width: '100%',
    height: 38,
    backgroundColor: COLORS.gothicDark,
    borderWidth: 1,
    borderColor: COLORS.gothicBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#fff',
    fontSize: 12.5,
    fontFamily: FONTS.mono,
  },
  quickTaskSubmitBtn: {
    width: '100%',
    height: 36,
    backgroundColor: COLORS.gothicGold,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  quickTaskSubmitBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 9.5,
    color: '#000',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  examplesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  exampleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.gothicBorder,
    backgroundColor: COLORS.gothicDark,
  },
  exampleBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    color: COLORS.gray500,
  },
  noTasksText: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: COLORS.gray600,
    textAlign: 'center',
    paddingVertical: 12,
    textTransform: 'uppercase',
  },
  quickTasksList: {
    gap: 6,
  },
  quickTaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 0.5,
    borderColor: COLORS.gothicBorder,
    borderRadius: 8,
    padding: 8,
    justifyContent: 'space-between',
    gap: 8,
  },
  smallCheckbox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: COLORS.gray600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTaskTitleText: {
    fontFamily: FONTS.cinzel,
    fontSize: 9.5,
    color: COLORS.gray300,
    flex: 1,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    gap: 6,
  },
  inputLabel: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: COLORS.gray400,
    letterSpacing: 0.5,
  },
  planErrorBox: {
    backgroundColor: 'rgba(164, 44, 56, 0.1)',
    borderColor: 'rgba(164, 44, 56, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginVertical: 4,
  },
  planErrorText: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gothicCrimson,
    textTransform: 'uppercase',
  },
  campaignSubmitBtn: {
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.gothicCrimson,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  campaignSubmitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  campaignSubmitBtnText: {
    fontFamily: FONTS.cinzel,
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 11, 13, 0.85)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 550,
    height: '85%',
    backgroundColor: COLORS.gothicCard,
    borderWidth: 1,
    borderColor: 'rgba(200, 158, 92, 0.3)',
    borderRadius: 16,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  modalContent: {
    flex: 1,
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
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 50, 62, 0.3)',
    paddingBottom: 12,
    marginBottom: 16,
    marginTop: 0,
  },
  modalHeaderCategory: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    color: COLORS.gray500,
    textTransform: 'uppercase',
  },
  modalHeaderTitle: {
    fontFamily: FONTS.cinzel,
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.gothicGold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    maxWidth: 180,
  },
  modalCloseBtn: {
    backgroundColor: 'rgba(200, 158, 92, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(200, 158, 92, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  modalCloseBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: COLORS.gothicGold,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  statusBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: COLORS.gothicBorder,
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBoxSubText: {
    fontFamily: FONTS.mono,
    fontSize: 7,
    color: COLORS.gray500,
    textTransform: 'uppercase',
  },
  statusBoxText: {
    fontFamily: FONTS.mono,
    fontSize: 9.5,
    color: COLORS.gothicGold,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  statusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: '#10b981',
    fontWeight: 'bold',
  },
  hudPanel: {
    backgroundColor: 'rgba(10, 11, 13, 0.7)',
    borderWidth: 1,
    borderColor: COLORS.gothicBorder,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  hudPanelCol: {
    flex: 1,
  },
  hudBorderCol: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(46, 50, 62, 0.3)',
    paddingLeft: 8,
  },
  hudLabel: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    color: COLORS.gray500,
    textTransform: 'uppercase',
  },
  hudValue: {
    fontFamily: FONTS.cinzel,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 2,
  },
  hudSubLabel: {
    fontFamily: FONTS.mono,
    fontSize: 7,
    color: COLORS.gray600,
    marginTop: 2,
  },
  hudProgressBarBg: {
    width: '100%',
    height: 3,
    backgroundColor: '#000',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  hudProgressBarFill: {
    height: '100%',
    backgroundColor: COLORS.gothicGold,
  },
  milestoneSection: {
    marginBottom: 16,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  milestoneHeaderTitle: {
    fontFamily: FONTS.cinzel,
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.gothicGold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  stageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  stageGridBtn: {
    width: '18%',
    flexGrow: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: COLORS.gothicBorder,
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
  },
  stageGridName: {
    fontFamily: FONTS.cinzel,
    fontSize: 8.5,
    fontWeight: 'bold',
    color: COLORS.gray400,
    textTransform: 'uppercase',
  },
  stageGridStatus: {
    fontFamily: FONTS.mono,
    fontSize: 7,
    fontWeight: 'bold',
    marginTop: 4,
  },
  blueprintAlertCard: {
    backgroundColor: 'rgba(251, 146, 60, 0.05)',
    borderColor: 'rgba(251, 146, 60, 0.2)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  blueprintAlertTitle: {
    fontFamily: FONTS.cinzel,
    fontSize: 9.5,
    color: COLORS.gothicGold,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  blueprintAlertSubtitle: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    color: COLORS.gray400,
    textTransform: 'uppercase',
    lineHeight: 11,
  },
  blueprintAlertActions: {
    flexDirection: 'row',
    gap: 8,
  },
  startDateInput: {
    flex: 1,
    height: 30,
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: COLORS.gothicBorder,
    borderRadius: 4,
    paddingHorizontal: 8,
    color: '#fff',
    fontSize: 11,
    fontFamily: FONTS.mono,
  },
  carveBtn: {
    backgroundColor: 'rgba(200, 158, 92, 0.2)',
    borderColor: 'rgba(200, 158, 92, 0.4)',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  carveBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: COLORS.gothicGold,
    fontWeight: 'bold',
  },
  objectivesSection: {
    marginBottom: 16,
  },
  objectivesHeaderTitle: {
    fontFamily: FONTS.cinzel,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  objectiveCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(46, 50, 62, 0.3)',
    borderRadius: 10,
    padding: 10,
  },
  objectiveHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  objectiveTitle: {
    fontFamily: FONTS.cinzel,
    fontSize: 9.5,
    fontWeight: 'bold',
    color: COLORS.gray300,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  objectiveDiffBadge: {
    fontFamily: FONTS.mono,
    fontSize: 6.5,
    color: COLORS.gray500,
    borderWidth: 0.5,
    borderColor: 'rgba(46, 50, 62, 0.3)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  lockBadge: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  objectiveCheckbox: {
    width: 15,
    height: 15,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.gray600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  objectiveExpanded: {
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(46, 50, 62, 0.2)',
    marginTop: 8,
    paddingTop: 8,
    gap: 4,
  },
  expandedLabel: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: COLORS.gothicGold,
    fontWeight: 'bold',
  },
  expandedDesc: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.gray400,
    lineHeight: 14,
  },
  expandedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  xpText: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    color: COLORS.gothicGold,
    fontWeight: 'bold',
  },
  cleanseBtn: {
    backgroundColor: 'rgba(200, 158, 92, 0.15)',
    borderColor: 'rgba(200, 158, 92, 0.3)',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  cleanseBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 7.5,
    color: COLORS.gothicGold,
    fontWeight: 'bold',
  },
  advisorCard: {
    backgroundColor: 'rgba(200, 158, 92, 0.05)',
    borderColor: COLORS.gothicBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  advisorHeaderTitle: {
    fontFamily: FONTS.cinzel,
    fontSize: 9,
    color: COLORS.gothicGold,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  advisorText: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gray400,
    lineHeight: 13,
    textTransform: 'uppercase',
  },
  unlocksRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  unlocksBadge: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 0.5,
    borderColor: 'rgba(46, 50, 62, 0.3)',
    borderRadius: 10,
    padding: 8,
  },
  unlocksSubLabel: {
    fontFamily: FONTS.mono,
    fontSize: 6.5,
    color: COLORS.gray600,
  },
  unlocksLabel: {
    fontFamily: FONTS.cinzel,
    fontSize: 9.5,
    fontWeight: 'bold',
    color: COLORS.gothicGold,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  abandonWrapper: {
    alignItems: 'flex-end',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(46, 50, 62, 0.3)',
    paddingTop: 12,
  },
  abandonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(164, 44, 56, 0.08)',
    borderColor: 'rgba(164, 44, 56, 0.3)',
    borderWidth: 1,
    borderRadius: 4,
  },
  abandonBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: COLORS.gothicCrimson,
    fontWeight: 'bold',
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
