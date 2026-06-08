/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  PlusCircle, 
  Moon, 
  ShieldAlert, 
  BookOpen, 
  Trash2,
  CheckCircle2,
  HelpCircle,
  Eye,
  ActivityIcon,
  FlameKindling,
  CalendarDays,
  PenSquare,
  Award,
  Sparkles,
  ArrowRightLeft
} from 'lucide-react';
import { Quest } from '../types';
import { soundEngine } from '../utils/audio';
import { getLocalDateString } from '../utils/dateUtils';

type CalendarView = 'Month' | 'Week' | 'Day';

interface GothicCalendarProps {
  quests: Quest[];
  onToggleQuest: (id: string) => void;
  onDeleteQuest: (id: string) => void;
  onSelectDate: (dateString: string) => void;
  onUpdateQuest?: (updatedQuest: Quest) => void;
}

export const GothicCalendar: React.FC<GothicCalendarProps> = ({
  quests,
  onToggleQuest,
  onDeleteQuest,
  onSelectDate,
  onUpdateQuest
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [view, setView] = useState<CalendarView>('Month');
  
  // Modal State triggers
  const [activeModalDate, setActiveModalDate] = useState<Date | null>(null);
  
  // Inside Modal: currently inspected specific quest ID
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

  // Helper: filter quests for specific day string "YYYY-MM-DD"
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

  // Generate Month Days
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

  // Generate Week Days centered around current date's week
  const getDaysInWeek = (): Date[] => {
    const dayOfWeek = currentDate.getDay();
    const tempDate = new Date(currentDate);
    // Find preceding Sunday
    tempDate.setDate(currentDate.getDate() - dayOfWeek);
    
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(tempDate));
      tempDate.setDate(tempDate.getDate() + 1);
    }
    return week;
  };

  const weekDays = getDaysInWeek();

  // When a day cell is clicked, open the glorious modal popup!
  const handleDaySelect = (date: Date) => {
    soundEngine.playClick();
    setActiveModalDate(date);
    onSelectDate(getLocalDateString(date));
    
    // Clear sub-inspected state initializers
    setActiveInspectedQuestId(null);
  };

  // Internal trigger: View a specific quest details inside modal popover
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

  // Perform Notes/Lore update inside Modal without leaving calendar
  const handleSaveNotes = (quest: Quest) => {
    soundEngine.playClick();
    if (onUpdateQuest) {
      onUpdateQuest({
        ...quest,
        description: editNotesText,
      });
    }
  };

  // Perform Schedule/Date update inside Modal
  const handleSaveSchedule = (quest: Quest) => {
    soundEngine.playSlash();
    if (onUpdateQuest && editScheduleDate) {
      onUpdateQuest({
        ...quest,
        dueDate: editScheduleDate,
      });
      // If the quest was rescheduled to another date, we'll keep the modal open, 
      // but re-evaluate standard data list. Let us prompt a success sound feedback
      setTimeout(() => {
        soundEngine.playSoulsClaimed();
      }, 200);
    }
  };

  return (
    <div 
      className="p-4 md:p-6 bg-gothic-card rounded-2xl border border-gothic-border relative overflow-hidden"
      id="gothic-calendar-container"
    >
      {/* Decorative absolute lines */}
      <div className="absolute top-0 right-10 w-24 h-px bg-gradient-to-r from-transparent via-gothic-gold/25 to-transparent" />
      <div className="absolute bottom-0 left-10 w-24 h-px bg-gradient-to-r from-transparent via-gothic-gold/25 to-transparent" />

      {/* Header section with Switcher */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6 pb-4 border-b border-gothic-border/30">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-lg bg-gothic-back/80 border border-gothic-border text-gothic-gold">
            <CalendarIcon className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="font-cinzel text-md md:text-lg font-bold tracking-wider text-gothic-gold uppercase flex items-center gap-2">
              Liturgy Calendar of Hours
            </h2>
            <p className="font-mono text-[9px] text-gray-500 uppercase tracking-widest mt-0.5">
              Reflect upon thy scheduled, completed and missed covenants in sacred views
            </p>
          </div>
        </div>

        {/* View Switcher Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-between xl:justify-end">
          
          <div className="flex items-center bg-gothic-back/80 border border-gothic-border rounded-lg p-0.5 overflow-hidden">
            <button
              onClick={handleToday}
              className="px-3 py-1.5 text-[9px] font-mono uppercase tracking-widest text-gray-400 hover:text-gothic-gold transition-colors hover:bg-gothic-card rounded cursor-pointer"
            >
              Today
            </button>
            <div className="w-px h-4 bg-gothic-border/40 mx-1" />
            <button
              onClick={handlePrev}
              className="p-1 px-2 text-gray-400 hover:text-gothic-gold transition-colors hover:bg-gothic-card rounded cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-1 px-2 text-gray-400 hover:text-gothic-gold transition-colors hover:bg-gothic-card rounded cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="font-cinzel text-xs md:text-sm font-semibold tracking-widest text-gothic-gold min-w-[130px] text-center uppercase">
            {monthNames[month]} {year}
          </span>

          {/* Quick Switcher Switch Container */}
          <div className="flex items-center bg-gothic-back/90 border border-gothic-border p-1 rounded-xl shadow-inner shadow-black/80 w-full sm:w-auto justify-around">
            {(['Month', 'Week', 'Day'] as CalendarView[]).map(v => {
              const active = view === v;
              return (
                <button
                  key={v}
                  onClick={() => {
                    soundEngine.playClick();
                    setView(v);
                  }}
                  className={`relative px-4 py-1.5 text-[9px] font-mono uppercase tracking-widest transition-all duration-300 rounded-lg font-bold min-w-[76px] text-center cursor-pointer ${
                    active 
                      ? 'bg-gothic-gold/15 text-gothic-gold border border-gothic-gold/20 shadow-[0_0_8px_rgba(200,158,92,0.15)]' 
                      : 'text-gray-500 hover:text-gray-300 hover:bg-gothic-card/20'
                  }`}
                  id={`calendar-view-btn-${v.toLowerCase()}`}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ==================== MONTH VIEW ==================== */}
      {view === 'Month' && (
        <div className="grid grid-cols-7 gap-1 md:gap-1.5" id="calendar-month-grid">
          {/* Weekday Labels Header */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div 
              key={d} 
              className="text-center py-2 border-b border-gothic-border/20 text-[9px] font-mono tracking-widest uppercase text-gray-400"
            >
              {d}
            </div>
          ))}

          {/* Cells rendering loop */}
          {monthDays.map(({ date, isCurrentMonth }, idx) => {
            const dateQuests = getQuestsForDate(date);
            const isToday = new Date().toDateString() === date.toDateString();
            const formattedStrValue = getLocalDateString(date);

            return (
              <div
                key={idx}
                onClick={() => handleDaySelect(date)}
                className={`min-h-[70px] sm:min-h-[86px] md:min-h-[105px] p-2 rounded-lg border transition-all relative flex flex-col justify-between cursor-pointer overflow-hidden group ${
                  isCurrentMonth 
                    ? 'bg-gothic-back/30 border-gothic-border/25 hover:border-gothic-gold/50' 
                    : 'bg-transparent border-gothic-border/5 text-gray-700 hover:border-gothic-border/15'
                } ${
                  isToday ? 'border-gothic-gold/40 shadow-[0_0_12px_rgba(200,158,92,0.1)]' : ''
                }`}
                id={`calendar-cell-${formattedStrValue}`}
              >
                {/* Cell title banner */}
                <div className="flex items-center justify-between">
                  <span 
                    className={`font-mono text-[9px] sm:text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold transition-all ${
                      isToday 
                        ? 'bg-gothic-gold text-black shadow-lg font-black scale-105' 
                        : isCurrentMonth ? 'text-gray-400 hover:text-gray-200' : 'text-gray-700'
                    }`}
                  >
                    {date.getDate()}
                  </span>

                  {dateQuests.length > 0 && (
                    <span className="text-[8px] font-mono text-gray-500 opacity-80 tracking-tighter">
                      ⚔ {dateQuests.filter(q => q.completed).length}/{dateQuests.length}
                    </span>
                  )}
                </div>

                {/* Day quests lists indicators */}
                <div className="hidden md:block flex-grow space-y-1 mt-1.5 select-none overflow-hidden text-left">
                  {dateQuests.slice(0, 2).map(q => (
                    <div
                      key={q.id}
                      className={`text-[8.5px] px-1.5 py-0.5 rounded flex items-center gap-1 transition-all truncate border font-sans ${
                        q.completed
                          ? 'bg-gothic-gold/5 border-gothic-gold/10 text-gothic-gold/40 line-through'
                          : q.difficulty === 'Mortal Penance'
                          ? 'bg-gothic-crimson/10 border-gothic-crimson/20 text-gothic-crimson'
                          : q.difficulty === 'Sinuous Vow'
                          ? 'bg-gothic-gold/10 border-gothic-gold/20 text-gothic-gold'
                          : 'bg-gothic-sky/10 border-gothic-sky/20 text-gothic-sky'
                      }`}
                    >
                      <span className="flex-shrink-0 text-[8px]">
                        {q.completed ? '✓' : '†'}
                      </span>
                      <span className="truncate tracking-wide font-cinzel">{q.title}</span>
                    </div>
                  ))}

                  {dateQuests.length > 2 && (
                    <div className="w-full text-center text-[7px] font-mono tracking-widest uppercase text-gothic-gold/60 py-0.5 bg-gothic-gold/[0.02] rounded">
                      + {dateQuests.length - 2} more
                    </div>
                  )}
                </div>

                {/* Mobile indicators dots */}
                <div className="flex md:hidden gap-0.5 mt-1 justify-center flex-wrap max-w-full">
                  {dateQuests.slice(0, 4).map(q => (
                    <span 
                      key={q.id}
                      className={`w-1.5 h-1.5 rounded-full ${
                        q.completed 
                          ? 'bg-gothic-gold/50 shadow-[0_0_2pxs_rgba(200,158,92,0.4)]' 
                          : q.difficulty === 'Mortal Penance'
                          ? 'bg-gothic-crimson'
                          : q.difficulty === 'Sinuous Vow'
                          ? 'bg-gothic-gold'
                          : 'bg-gothic-sky'
                      }`}
                      title={q.title}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================== WEEK VIEW ==================== */}
      {view === 'Week' && (
        <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gothic-border/60" id="calendar-week-grid">
          <div className="grid grid-cols-7 gap-3 min-w-[700px] md:min-w-0">
            {weekDays.map((date, idx) => {
              const dateQuests = getQuestsForDate(date);
              const isToday = new Date().toDateString() === date.toDateString();
              
              return (
                <div
                  key={idx}
                  onClick={() => handleDaySelect(date)}
                  className={`p-3.5 rounded-xl border flex flex-col min-h-[220px] transition-all cursor-pointer relative text-left ${
                    isToday 
                      ? 'bg-gothic-gold/[0.04] border-gothic-gold/40 shadow-lg shadow-black/80' 
                      : 'bg-gothic-back/40 border-gothic-border/20 hover:border-gothic-border/55'
                  }`}
                >
                  <div className="flex flex-col items-center mb-4 pb-2 border-b border-gothic-border/20 text-center select-none">
                    <span className="text-[9px] font-mono tracking-widest text-gray-500 uppercase">
                      {date.toLocaleDateString(undefined, { weekday: 'short' })}
                    </span>
                    <span className={`text-xs md:text-sm font-mono mt-1 font-bold rounded-full w-7 h-7 flex items-center justify-center transition-transform ${
                      isToday ? 'bg-gothic-gold text-black shadow-lg font-black scale-105' : 'text-gray-300'
                    }`}>
                      {date.getDate()}
                    </span>
                  </div>

                  <div className="flex-grow space-y-1.5 overflow-y-auto max-h-[150px] pr-0.5 scrollbar-thin">
                    {dateQuests.length > 0 ? (
                      dateQuests.map(q => (
                        <div
                          key={q.id}
                          className={`p-1.5 rounded border text-[9px] leading-relaxed transition-all relative flex flex-col gap-0.5 pointer-events-none ${
                            q.completed
                              ? 'bg-gothic-back/60 border-gothic-border/10 text-gray-600 line-through'
                              : q.difficulty === 'Mortal Penance'
                              ? 'bg-gothic-crimson/10 border-gothic-crimson/25 text-gothic-crimson'
                              : q.difficulty === 'Sinuous Vow'
                              ? 'bg-gothic-gold/10 border-gothic-gold/25 text-gothic-gold'
                              : 'bg-gothic-sky/10 border-gothic-sky/25 text-gothic-sky'
                          }`}
                        >
                          <span className="font-cinzel text-[9.5px] font-semibold tracking-wide truncate">
                            {q.title}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex items-center justify-center py-8 opacity-40 select-none">
                        <p className="text-[8px] font-mono tracking-widest text-gray-600 uppercase text-center">
                          Quiet Hour
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 text-[7px] font-mono tracking-widest text-center text-gray-600 uppercase select-none">
                    Select Day
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== DAY VIEW (Hour dial rendering) ==================== */}
      {view === 'Day' && (
        <div className="space-y-4 text-left" id="calendar-day-grid">
          <div className="flex justify-between items-center bg-gothic-back/30 p-4 border border-gothic-border/40 rounded-xl">
            <div className="flex items-center gap-3">
              <CalendarDays className="w-5 h-5 text-gothic-gold" />
              <div>
                <h4 className="font-cinzel text-sm font-bold tracking-wider text-gothic-gold uppercase">
                  Daily Hours: {currentDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </h4>
                <p className="font-mono text-[9px] text-gray-500 uppercase tracking-widest mt-0.5">
                  Daily covenant agenda chronometer for {getLocalDateString(currentDate)}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDaySelect(currentDate)}
              className="px-4 py-1.5 bg-gothic-gold/15 hover:bg-gothic-gold hover:text-black border border-gothic-gold/30 text-[9px] font-mono uppercase tracking-widest rounded cursor-pointer transition-colors"
            >
              Open Daily Liturgy Ledger
            </button>
          </div>

          <div className="border border-gothic-border/20 rounded-xl overflow-hidden divide-y divide-gothic-border/10">
            {/* Displaying simple hourly slots representing Day layout */}
            {['06:00 Vigils', '09:00 Matins', '12:00 Sext', '15:00 None', '18:00 Vespers', '21:00 Compline'].map((hourString, idx) => {
              // Distribute quests of this day to different slots for graphical depth
              const dayQuests = getQuestsForDate(currentDate);
              const indexedQuests = dayQuests.filter((_, qIdx) => qIdx % 6 === idx);

              return (
                <div key={idx} className="flex flex-col sm:flex-row items-stretch min-h-[50px]">
                  {/* hour column */}
                  <div className="w-28 bg-gothic-back/40 p-3 flex flex-row sm:flex-col justify-between sm:justify-start items-center sm:items-end border-b sm:border-b-0 sm:border-r border-gothic-border/25">
                    <span className="font-mono text-[10px] text-gothic-gold font-bold uppercase tracking-wider">
                      {hourString.split(' ')[0]}
                    </span>
                    <span className="font-mono text-[8px] text-gray-500 uppercase tracking-widest mt-0.5">
                      {hourString.split(' ').slice(1).join(' ')}
                    </span>
                  </div>

                  {/* tasks row */}
                  <div className="flex-1 p-3 flex flex-wrap gap-2.5 items-center">
                    {indexedQuests.length > 0 ? (
                      indexedQuests.map(q => (
                        <div
                          key={q.id}
                          onClick={() => handleDaySelect(currentDate)}
                          className={`px-3 py-1.5 rounded-lg border text-[10px] flex items-center gap-2 cursor-pointer transition-transform hover:scale-[1.01] ${
                            q.completed
                              ? 'bg-gothic-gold/5 border-gothic-gold/15 text-gothic-gold/40 line-through'
                              : q.difficulty === 'Mortal Penance'
                              ? 'bg-gothic-crimson/15 border-gothic-crimson/25 text-gothic-crimson font-serif'
                              : q.difficulty === 'Sinuous Vow'
                              ? 'bg-gothic-gold/10 border-gothic-gold/25 text-gothic-gold'
                              : 'bg-gothic-sky/10 border-gothic-sky/25 text-gothic-sky'
                          }`}
                        >
                          <span>{q.completed ? '✓' : '†'}</span>
                          <span className="font-cinzel tracking-wider font-semibold">{q.title}</span>
                        </div>
                      ))
                    ) : (
                      <span className="font-mono text-[8px] text-gray-600 uppercase tracking-widest">
                        Perfect Stillness
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ============ REQUIREMENT 3: DETAILED INTERACTIVE POPUP MODAL ============ */}
      {/* ======================================================== */}
      <AnimatePresence>
        {activeModalDate && (() => {
          const dateStr = getLocalDateString(activeModalDate);
          const allQuestsForDate = quests.filter(q => q.dueDate === dateStr);
          const todayStrValue = getLocalDateString(new Date());

          // Subdivide lists: Completed, Pending, Missed
          const completedList = allQuestsForDate.filter(q => q.completed);
          
          // Pending is incomplete, due today or in future
          const pendingList = allQuestsForDate.filter(q => !q.completed && dateStr >= todayStrValue);
          
          // Missed is incomplete, due strictly in yesterday or past days
          const missedList = allQuestsForDate.filter(q => !q.completed && dateStr < todayStrValue);

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/92 backdrop-blur-md select-none overflow-y-auto"
              onClick={() => setActiveModalDate(null)}
              id="calendar-liturgy-modal"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 15 }}
                transition={{ type: "spring", stiffness: 220, damping: 26 }}
                className="w-full max-w-2xl bg-gothic-card border border-gothic-gold/25 shadow-[0_20px_50px_rgba(0,0,0,0.95)] rounded-2xl p-5 md:p-6 text-left relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Visual gothic aesthetics corners */}
                <div className="absolute top-0 left-0 w-8 h-8 opacity-40 border-t-2 border-l-2 border-gothic-gold rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 opacity-40 border-t-2 border-r-2 border-gothic-gold rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 opacity-40 border-b-2 border-l-2 border-gothic-gold rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 opacity-40 border-b-2 border-r-2 border-gothic-gold rounded-br-xl" />

                {/* Header */}
                <div className="flex justify-between items-start border-b border-gothic-border/30 pb-4 mb-4" id="modal-date-header">
                  <div>
                    <h3 className="font-cinzel text-sm sm:text-base font-bold tracking-widest text-gothic-gold uppercase flex items-center gap-2">
                      ⚔ LITURGY LEDGER OF DEEDS
                    </h3>
                    <p className="font-mono text-gray-300 text-xs mt-1 uppercase font-bold tracking-wider">
                      {activeModalDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveModalDate(null)}
                    className="text-gray-400 hover:text-white font-mono text-xs uppercase hover:bg-gothic-back/40 px-2.5 py-1.5 rounded border border-gothic-border/30 cursor-pointer"
                  >
                    Esc
                  </button>
                </div>

                {/* Main scroll container inside Modal */}
                <div className="max-h-[380px] overflow-y-auto pr-1 space-y-5 scrollbar-thin">

                  {/* 1. COMPLETED COVENANTS LIST */}
                  <div id="modal-completed-list">
                    <div className="flex items-center gap-2 mb-2 select-none">
                      <div className="w-1.5 h-1.5 rounded-full bg-gothic-gold" />
                      <span className="font-cinzel text-[10px] font-bold tracking-widest uppercase text-gothic-gold-dim">
                        In Communion Absolved ({completedList.length})
                      </span>
                    </div>

                    <div className="space-y-2">
                      {completedList.length > 0 ? (
                        completedList.map(q => (
                          <div 
                            key={q.id}
                            className="bg-black/30 border border-gothic-border/10 p-2.5 rounded-lg flex flex-col gap-2 relative"
                          >
                            <div className="flex items-center justify-between gap-2.5">
                              <button 
                                onClick={() => {
                                  soundEngine.playClick();
                                  onToggleQuest(q.id);
                                }}
                                className="flex items-center gap-2.5 text-left text-gothic-gold/50 hover:text-gothic-gold select-none cursor-pointer"
                              >
                                <CheckCircle2 className="w-4 h-4 text-gothic-gold" />
                                <span className="font-cinzel text-xs font-semibold tracking-wider line-through">
                                  {q.title}
                                </span>
                              </button>

                              <div className="flex items-center gap-1.5">
                                <span className="text-[8.5px] font-mono text-gray-500 uppercase px-1.5 border border-gothic-border/10 bg-gothic-back/50 rounded">
                                  {q.category}
                                </span>
                                <button
                                  onClick={() => handleToggleInspectQuest(q)}
                                  className="p-1 hover:bg-gothic-back/80 rounded border border-gothic-border/20 text-gray-400 hover:text-white cursor-pointer"
                                  title="Expand covenant parameters"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Inspected panel */}
                            {activeInspectedQuestId === q.id && (
                              <div className="p-3 bg-gothic-back/50 rounded-lg border border-gothic-border/40 space-y-3 mt-1.5">
                                <div>
                                  <span className="block text-[8px] font-mono text-gothic-gold uppercase tracking-widest mb-1 select-none">
                                    📜 COVENANT INSCRIBED LORE & NOTES
                                  </span>
                                  <textarea
                                    className="w-full h-16 bg-[#0a0b0d] border border-gothic-border rounded-md text-xs text-gray-300 p-2 focus:outline-none focus:border-gothic-gold/60 leading-relaxed font-light"
                                    value={editNotesText}
                                    onChange={(e) => setEditNotesText(e.target.value)}
                                  />
                                  <button
                                    onClick={() => handleSaveNotes(q)}
                                    className="mt-1.5 px-3 py-1 bg-gothic-gold/15 hover:bg-gothic-gold hover:text-black rounded text-[9px] font-mono uppercase tracking-widest cursor-pointer transition-colors"
                                  >
                                    Save Note Inscription
                                  </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gothic-border/10">
                                  <div>
                                    <span className="block text-[8px] font-mono text-gray-500 uppercase tracking-widest mb-0.5 select-none">
                                      CHRONICLE SCHEDULE
                                    </span>
                                    <div className="flex gap-1.5">
                                      <input 
                                        type="date"
                                        className="bg-[#0a0b0d] border border-gothic-border text-[10px] font-mono text-gray-300 rounded px-1.5 py-0.5"
                                        value={editScheduleDate}
                                        onChange={(e) => setEditScheduleDate(e.target.value)}
                                      />
                                      <button
                                        onClick={() => handleSaveSchedule(q)}
                                        className="p-1 bg-gothic-gold/10 hover:bg-gothic-gold hover:text-black rounded text-[9px] font-mono uppercase tracking-widest cursor-pointer"
                                        title="Shift schedule date"
                                      >
                                        Shift
                                      </button>
                                    </div>
                                  </div>

                                  <div>
                                    <span className="block text-[8px] font-mono text-gray-500 uppercase tracking-widest mb-0.5 select-none">
                                      COVENANT LIFETIME
                                    </span>
                                    <span className="text-[10px] uppercase font-mono text-gray-400 font-bold block mt-1">
                                      {q.category === 'Habit' ? '🛡 40-Day Continuous Cycle' : '⚓ Single-Stage Quest'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                          </div>
                        ))
                      ) : (
                        <p className="font-mono text-[9px] text-gray-600 uppercase italic py-2 pl-2 border-l border-gothic-border/15">
                          No covenants absolved today.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 2. PENDING COVENANTS LIST */}
                  <div id="modal-pending-list">
                    <div className="flex items-center gap-2 mb-2 select-none">
                      <div className="w-1.5 h-1.5 rounded-full bg-gothic-sky" />
                      <span className="font-cinzel text-[10px] font-bold tracking-widest uppercase text-gothic-sky/80">
                        Solemn Trials Pending ({pendingList.length})
                      </span>
                    </div>

                    <div className="space-y-2">
                      {pendingList.length > 0 ? (
                        pendingList.map(q => (
                          <div 
                            key={q.id}
                            className="bg-black/30 border border-gothic-border/15 p-2.5 rounded-lg flex flex-col gap-2 relative"
                          >
                            <div className="flex items-center justify-between gap-2.5">
                              <button 
                                onClick={() => {
                                  soundEngine.playSlash();
                                  onToggleQuest(q.id);
                                }}
                                className="flex items-center gap-2.5 text-left text-gray-400 hover:text-gothic-gold select-none cursor-pointer"
                              >
                                <div className="w-4 h-4 rounded border border-gothic-border flex-shrink-0 flex items-center justify-center hover:border-gothic-gold" />
                                <span className="font-cinzel text-xs font-semibold tracking-wider text-gray-200">
                                  {q.title}
                                </span>
                              </button>

                              <div className="flex items-center gap-1.5">
                                <span className={`text-[8.5px] font-mono uppercase px-1.5 border rounded ${
                                  q.difficulty === 'Mortal Penance'
                                    ? 'text-gothic-crimson border-gothic-crimson/25 bg-gothic-crimson/5'
                                    : 'text-gothic-gold border-gothic-gold/25 bg-gothic-gold/5'
                                }`}>
                                  {q.difficulty}
                                </span>
                                <button
                                  onClick={() => handleToggleInspectQuest(q)}
                                  className="p-1 hover:bg-gothic-back/80 rounded border border-gothic-border/20 text-gray-400 hover:text-white cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Inspected panel */}
                            {activeInspectedQuestId === q.id && (
                              <div className="p-3 bg-gothic-back/50 rounded-lg border border-gothic-border/40 space-y-3 mt-1.5">
                                <div>
                                  <span className="block text-[8px] font-mono text-gothic-gold uppercase tracking-widest mb-1 select-none">
                                    📜 COVENANT INSCRIBED LORE & NOTES
                                  </span>
                                  <textarea
                                    className="w-full h-16 bg-[#0a0b0d] border border-gothic-border rounded-md text-xs text-gray-300 p-2 focus:outline-none focus:border-gothic-gold/60 leading-relaxed font-light"
                                    value={editNotesText}
                                    onChange={(e) => setEditNotesText(e.target.value)}
                                  />
                                  <button
                                    onClick={() => handleSaveNotes(q)}
                                    className="mt-1.5 px-3 py-1 bg-gothic-gold/15 hover:bg-gothic-gold hover:text-black rounded text-[9px] font-mono uppercase tracking-widest cursor-pointer transition-colors"
                                  >
                                    Save Note Inscription
                                  </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gothic-border/10">
                                  <div>
                                    <span className="block text-[8px] font-mono text-gray-500 uppercase tracking-widest mb-0.5 select-none">
                                      CHRONICLE SCHEDULE
                                    </span>
                                    <div className="flex gap-1.5 animate-pulse">
                                      <input 
                                        type="date"
                                        className="bg-[#0a0b0d] border border-gothic-border text-[10px] font-mono text-gray-300 rounded px-1.5 py-0.5 focus:outline-none"
                                        value={editScheduleDate}
                                        onChange={(e) => setEditScheduleDate(e.target.value)}
                                      />
                                      <button
                                        onClick={() => handleSaveSchedule(q)}
                                        className="p-1 bg-gothic-gold/10 hover:bg-gothic-gold hover:text-black rounded text-[9px] font-mono uppercase tracking-widest cursor-pointer"
                                        title="Shift schedule date"
                                      >
                                        Shift
                                      </button>
                                    </div>
                                  </div>

                                  <div>
                                    <span className="block text-[8px] font-mono text-gray-500 uppercase tracking-widest mb-0.5 select-none">
                                      COVENANT LIFETIME
                                    </span>
                                    <span className="text-[10px] uppercase font-mono text-gray-400 font-bold block mt-1">
                                      {q.category === 'Habit' ? '🛡 40-Day Continuous Cycle' : '⚓ Single-Stage Quest'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                          </div>
                        ))
                      ) : (
                        <p className="font-mono text-[9px] text-gray-600 uppercase italic py-2 pl-2 border-l border-gothic-border/15">
                          No pending solemn requirements mapped for today.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 3. MISSED COVENANTS LIST */}
                  <div id="modal-missed-list">
                    <div className="flex items-center gap-2 mb-2 select-none">
                      <div className="w-1.5 h-1.5 rounded-full bg-gothic-crimson" />
                      <span className="font-cinzel text-[10px] font-bold tracking-widest uppercase text-gothic-crimson">
                        Corrupted / Missed Covenants ({missedList.length})
                      </span>
                    </div>

                    <div className="space-y-2">
                      {missedList.length > 0 ? (
                        missedList.map(q => (
                          <div 
                            key={q.id}
                            className="bg-black/30 border border-gothic-crimson/15 p-2.5 rounded-lg flex flex-col gap-2 relative"
                          >
                            <div className="flex items-center justify-between gap-2.5">
                              <button 
                                onClick={() => {
                                  soundEngine.playSlash();
                                  onToggleQuest(q.id);
                                }}
                                className="flex items-center gap-2.5 text-left text-gothic-crimson hover:text-gothic-gold select-none cursor-pointer"
                              >
                                <ShieldAlert className="w-4 h-4 text-gothic-crimson flex-shrink-0 animate-pulse" />
                                <span className="font-cinzel text-xs font-semibold tracking-wider text-gothic-crimson">
                                  {q.title}
                                </span>
                              </button>

                              <div className="flex items-center gap-1.5">
                                <span className="text-[8.5px] font-mono uppercase px-1.5 border border-gothic-crimson/20 bg-gothic-crimson/5 text-gothic-crimson rounded">
                                  OVERDUE
                                </span>
                                <button
                                  onClick={() => handleToggleInspectQuest(q)}
                                  className="p-1 hover:bg-gothic-back/80 rounded border border-gothic-border/20 text-gray-400 hover:text-white cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Inspected panel */}
                            {activeInspectedQuestId === q.id && (
                              <div className="p-3 bg-gothic-back/50 rounded-lg border border-gothic-border/40 space-y-3 mt-1.5">
                                <div>
                                  <span className="block text-[8px] font-mono text-gothic-gold uppercase tracking-widest mb-1 select-none">
                                    📜 COVENANT INSCRIBED LORE & NOTES
                                  </span>
                                  <textarea
                                    className="w-full h-16 bg-[#0a0b0d] border border-gothic-border rounded-md text-xs text-gray-300 p-2 focus:outline-none focus:border-gothic-gold/60 leading-relaxed font-light"
                                    value={editNotesText}
                                    onChange={(e) => setEditNotesText(e.target.value)}
                                  />
                                  <button
                                    onClick={() => handleSaveNotes(q)}
                                    className="mt-1.5 px-3 py-1 bg-gothic-gold/15 hover:bg-gothic-gold hover:text-black rounded text-[9px] font-mono uppercase tracking-widest cursor-pointer transition-colors"
                                  >
                                    Save Note Inscription
                                  </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gothic-border/10">
                                  <div>
                                    <span className="block text-[8px] font-mono text-gray-500 uppercase tracking-widest mb-0.5 select-none">
                                      CHRONICLE SCHEDULE
                                    </span>
                                    <div className="flex gap-1.5">
                                      <input 
                                        type="date"
                                        className="bg-[#0a0b0d] border border-gothic-border text-[10px] font-mono text-gray-300 rounded px-1.5 py-0.5"
                                        value={editScheduleDate}
                                        onChange={(e) => setEditScheduleDate(e.target.value)}
                                      />
                                      <button
                                        onClick={() => handleSaveSchedule(q)}
                                        className="p-1 bg-gothic-gold/10 hover:bg-gothic-gold hover:text-black rounded text-[9px] font-mono uppercase tracking-widest cursor-pointer"
                                        title="Shift schedule date"
                                      >
                                        Shift
                                      </button>
                                    </div>
                                  </div>

                                  <div>
                                    <span className="block text-[8px] font-mono text-gray-500 uppercase tracking-widest mb-0.5 select-none">
                                      COVENANT LIFETIME
                                    </span>
                                    <span className="text-[10px] uppercase font-mono text-gray-400 font-bold block mt-1">
                                      {q.category === 'Habit' ? '🛡 40-Day Continuous Cycle' : '⚓ Single-Stage Quest'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}

                          </div>
                        ))
                      ) : (
                        <p className="font-mono text-[9px] text-gray-600 uppercase italic py-2 pl-2 border-l border-gothic-crimson/15">
                          Clean record for today. Thy soul is free of broken bounds.
                        </p>
                      )}
                    </div>
                  </div>

                </div>

                {/* Footer Controls line */}
                <div className="flex justify-between items-center mt-5 pt-4 border-t border-gothic-border/20">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        soundEngine.playClick();
                        // Prompt parent to initiate quest creation
                        onSelectDate(dateStr);
                        setActiveModalDate(null);
                        // Force change view to 'Forge' Tab via trigger or simply notify parent
                        const forgeTabBtn = document.getElementById('tab-btn-forge');
                        if (forgeTabBtn) {
                          forgeTabBtn.click();
                        }
                      }}
                      className="px-3.5 py-1.5 bg-gothic-gold/10 hover:bg-gothic-gold hover:text-black hover:border-black rounded border border-gothic-gold/20 text-[9px] font-mono uppercase tracking-widest cursor-pointer text-gothic-gold transition-colors"
                    >
                      Inscribe New Vow For Date
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      setActiveModalDate(null);
                    }}
                    className="px-5 py-1.5 bg-gothic-gold hover:bg-amber-500 border border-gothic-gold text-black rounded text-[9px] font-mono uppercase tracking-widest transition-transform font-bold cursor-pointer"
                  >
                    Close Liturgical Ledger
                  </button>
                </div>

              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
};
