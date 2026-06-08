import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Skull, 
  Flame, 
  Compass, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle, 
  Eye, 
  Inbox,
  BookOpen,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Quest, QuestDifficulty, QuestCategory } from '../types';
import { ProceduralRuinBanner } from './ProceduralRuinBanner';
import { GothicQuestItem } from './GothicQuestItem';
import { soundEngine } from '../utils/audio';
import { getTodayLocalDateString } from '../utils/dateUtils';
import { DayContext } from '../utils/contextAwareEngine';

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

  // Filters Today's agenda: only overdue tasks AND tasks that are strictly due today
  // No future tasks are shown here!
  const overdueQuests = quests.filter(q => !q.completed && q.dueDate && q.dueDate < todayStr);
  const todayQuests = quests.filter(q => q.dueDate === todayStr);
  const perpetualQuests = quests.filter(q => !q.dueDate && !q.completed);
  const completedTodayQuests = quests.filter(
    q => q.completed && (q.dueDate === todayStr || (!q.dueDate && q.createdAt?.startsWith(todayStr)))
  );

  // Pool all matching items going onto Today's schedule
  const activeTodayPool = [...overdueQuests, ...todayQuests, ...perpetualQuests];

  // Group agenda as per Priority Specification:
  // - High Priority: Overdue penance-level quests, PLUS any 'Mortal Penance' (Hard) or Habit-type quests due today
  // - Medium Priority: Standard difficulty 'Sinuous Vow' (Medium) quests due today
  // - Optional: 'Lesser Burden' (Easy) quests due today or loose perpetual vows
  
  const highPriority = activeTodayPool.filter(q => 
    (q.dueDate && q.dueDate < todayStr) || // Overdue is always High Priority
    q.difficulty === 'Mortal Penance'
  );

  const mediumPriority = activeTodayPool.filter(q => 
    q.dueDate === todayStr && 
    q.difficulty === 'Sinuous Vow'
  );

  const optionalPriority = activeTodayPool.filter(q => 
    (q.dueDate === todayStr && q.difficulty === 'Lesser Burden') ||
    (!q.dueDate) // Perpetual/loose devotions are Optional
  );

  const completedTodayList = completedTodayQuests;

  return (
    <div className="space-y-8" id="journey-tab-viewport">
      
      {/* 1. Daily Procedural Ancient Ruin Hero Banner */}
      <ProceduralRuinBanner 
        dayContext={dayContext}
        userLevel={userLevel}
        streak={streak}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMN 1: Ambient Liturgical Quote (Left Column) */}
        <div className="lg:col-span-1 flex flex-col gap-6">

          {/* Liturgical quote of the hour card */}
          <div className="p-5 bg-gothic-card rounded-2xl border border-gothic-border relative overflow-hidden flex flex-col justify-between min-h-[160px] text-left">
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-gothic-gold/30" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-gothic-gold/30" />
            
            <div className="flex items-start gap-1.5 text-gothic-gold-dim">
              <BookOpen className="w-3.5 h-3.5 mt-0.5" />
              <span className="font-cinzel text-[9.5px] uppercase tracking-widest font-bold">Liturgy of Penance</span>
            </div>
            
            <blockquote className="font-cinzel text-xs text-gray-400 italic mt-3 line-clamp-3 leading-relaxed">
              "{randomQuote.text}"
            </blockquote>
            
            <cite className="block text-right font-mono text-[8px] text-gothic-gold uppercase mt-2">
              — {randomQuote.author}
            </cite>
          </div>
        </div>

        {/* COLUMN 2 & 3: Today's Agenda Grouped Lists */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="p-6 bg-gothic-card rounded-2xl border border-gothic-border relative overflow-hidden min-h-[420px]" id="journey-agenda-panel">
            {/* Header */}
            <div className="border-b border-gothic-border/40 pb-4 mb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-left">
              <div>
                <h3 className="font-cinzel text-sm sm:text-base font-bold tracking-widest text-gothic-gold uppercase flex items-center gap-2">
                  ⚔ TODAY'S SACRED AGENDA
                </h3>
                <p className="font-mono text-gray-500 text-[9px] uppercase tracking-widest mt-1.5">
                  Secure thy daily absolution, Ashen Knight. No future shadows are shown here.
                </p>
              </div>

              <div className="font-mono text-[9.5px] text-gray-400 bg-gothic-back/50 px-2.5 py-0.5 rounded border border-gothic-border/20 uppercase tracking-widest">
                {activeTodayPool.length} Active Bounds
              </div>
            </div>

            {/* Agenda groups list */}
            <div className="space-y-6 text-left">
              
              {/* 1. HIGH PRIORITY */}
              {highPriority.length > 0 && (
                <div id="agenda-high-priority">
                  <div className="flex justify-between items-center border-b border-red-500/10 pb-1.5 mb-3 select-none">
                    <span className="font-cinzel text-[10px] font-bold tracking-widest text-gothic-crimson uppercase flex items-center gap-1">
                      💀 HIGH PRIORITY BOUNDS
                    </span>
                    <span className="font-mono text-[8px] text-gray-500 uppercase bg-gothic-back/40 px-1.5 py-0.2 rounded border border-gothic-border/10">
                      {highPriority.length} Duty
                    </span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {highPriority.map(q => (
                      <GothicQuestItem 
                        key={q.id}
                        quest={q}
                        onComplete={onCompleteQuest}
                        onDelete={onDeleteQuest}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 2. MEDIUM PRIORITY */}
              {mediumPriority.length > 0 && (
                <div id="agenda-medium-priority">
                  <div className="flex justify-between items-center border-b border-gothic-gold/15 pb-1.5 mb-3 select-none">
                    <span className="font-cinzel text-[10px] font-bold tracking-widest text-gothic-gold uppercase flex items-center gap-1">
                      🔥 MEDIUM PRIORITY COVENANTS
                    </span>
                    <span className="font-mono text-[8px] text-gray-500 uppercase bg-gothic-back/40 px-1.5 py-0.2 rounded border border-gothic-border/10">
                      {mediumPriority.length} Duty
                    </span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {mediumPriority.map(q => (
                      <GothicQuestItem 
                        key={q.id}
                        quest={q}
                        onComplete={onCompleteQuest}
                        onDelete={onDeleteQuest}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 3. OPTIONAL */}
              {optionalPriority.length > 0 && (
                <div id="agenda-optional">
                  <div className="flex justify-between items-center border-b border-gothic-border/30 pb-1.5 mb-3 select-none">
                    <span className="font-cinzel text-[10px] font-bold tracking-widest text-gothic-sky uppercase flex items-center gap-1">
                      ⏳ OPTIONAL & PERPETUAL DEVOTIONS
                    </span>
                    <span className="font-mono text-[8px] text-gray-500 uppercase bg-gothic-back/40 px-1.5 py-0.2 rounded border border-gothic-border/10">
                      {optionalPriority.length} Duty
                    </span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {optionalPriority.map(q => (
                      <GothicQuestItem 
                        key={q.id}
                        quest={q}
                        onComplete={onCompleteQuest}
                        onDelete={onDeleteQuest}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 4. COMPLETED TODAY */}
              {completedTodayList.length > 0 && (
                <div id="agenda-completed-today">
                  <div className="flex justify-between items-center border-b border-gothic-border/30 pb-1.5 mb-3 select-none opacity-60">
                    <span className="font-cinzel text-[10px] font-bold tracking-widest text-gothic-gold-dim uppercase flex items-center gap-1">
                      ✦ ABSOLVED TODAY
                    </span>
                    <span className="font-mono text-[8px] text-gray-500 uppercase bg-gothic-back/40 px-1.5 py-0.2 rounded border border-gothic-border/10">
                      {completedTodayList.length} Absolved
                    </span>
                  </div>

                  <div className="flex flex-col gap-2.5 opacity-60">
                    {completedTodayList.map(q => (
                      <GothicQuestItem 
                        key={q.id}
                        quest={q}
                        onComplete={onCompleteQuest}
                        onDelete={onDeleteQuest}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* EMPTY STATE */}
              {activeTodayPool.length === 0 && completedTodayList.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20 flex flex-col items-center justify-center border-2 border-dashed border-gothic-border/40 rounded-xl"
                  id="agenda-empty-state"
                >
                  <Skull className="w-8 h-8 text-gray-600 mb-3 animate-bounce" />
                  <p className="font-cinzel text-xs font-semibold uppercase tracking-wider text-gray-500">
                    The altar finds absolute rest
                  </p>
                  <p className="font-mono text-[9px] text-gray-600 uppercase mt-1 tracking-widest max-w-sm mx-auto leading-normal">
                    You have no active covenants, vows or overdue trials allocated for this hour-day of assessment. Return to the Forge to create a new crusade!
                  </p>
                </motion.div>
              )}

            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
