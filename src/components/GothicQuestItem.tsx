import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Trash2, CheckCircle2, Circle, ChevronDown } from 'lucide-react';
import { Quest } from '../types';
import { soundEngine } from '../utils/audio';

interface GothicQuestItemProps {
  quest: Quest;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export const GothicQuestItem: React.FC<GothicQuestItemProps> = ({ 
  quest, 
  onComplete, 
  onDelete
}) => {
  const [slashing, setSlashing] = useState(false);
  const [floatingEff, setFloatingEff] = useState<{ active: boolean; text: string; id: number }[]>([]);
  const [uniqueId, setUniqueId] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleComplete = () => {
    if (quest.completed || slashing) return;
    
    // Play sharp metallic clashing blade sounds
    soundEngine.playSlash();
    setSlashing(true);

    // Build floaters with immersive game labels
    const newId = uniqueId + 1;
    setUniqueId(newId);
    
    let floatText = `Absolved`;
    if (quest.difficulty === 'Mortal Penance') floatText = `Vow Fulfilled`;
    if (quest.difficulty === 'Sinuous Vow') floatText = `Trial Conquered`;
    
    setFloatingEff(prev => [...prev, { active: true, text: floatText, id: newId }]);

    // Complete after slash animation completes
    setTimeout(() => {
      soundEngine.playSoulsClaimed();
      onComplete(quest.id);
      setSlashing(false);
    }, 400);
  };

  const handleDelete = () => {
    soundEngine.playClick();
    onDelete(quest.id);
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Mortal Penance':
        return 'text-gothic-crimson border-gothic-crimson/40 bg-gothic-crimson/10';
      case 'Sinuous Vow':
        return 'text-gothic-gold border-gothic-gold/40 bg-gothic-gold/10';
      case 'Lesser Burden':
      default:
        return 'text-gothic-sky border-gothic-sky/40 bg-gothic-sky/10';
    }
  };

  const getCategorySymbol = (cat: string) => {
    switch (cat) {
      case 'Vow': return '⛧ Daily Vow';
      case 'Trial': return '⚔ Weekly Trial';
      case 'Crusade': return '♃ Epic Crusade';
      default: return '🕈 Duty';
    }
  };

  const isOverdue = quest.dueDate && new Date(quest.dueDate) < new Date() && !quest.completed;
  const daysLeft = quest.dueDate 
    ? Math.max(0, Math.ceil((new Date(quest.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <motion.div
      id={`quest-${quest.id}`}
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -60, transition: { duration: 0.3 } }}
      whileHover={{ y: -1 }}
      className={`relative p-3.5 rounded-xl border transition-all duration-300 overflow-hidden ${
        quest.completed 
          ? 'bg-gothic-back/40 border-gothic-border/15 text-gray-500' 
          : isOverdue 
          ? 'bg-gothic-crimson/5 border-gothic-crimson/30 hover:border-gothic-crimson/60'
          : 'bg-gothic-card border-gothic-border hover:border-gothic-gold-dim'
      }`}
    >
      {/* Absolute Slash Overlay Indicator */}
      {slashing && (
        <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
          <div className="w-full h-8 bg-white shimmer-slash animate-nail-slash" />
        </div>
      )}

      {/* Floaters effect layer */}
      <AnimatePresence>
        {floatingEff.map(eff => (
          <motion.span
            key={eff.id}
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -50, scale: 1.25 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
            onAnimationComplete={() => {
              setFloatingEff(prev => prev.filter(p => p.id !== eff.id));
            }}
            className="absolute z-30 font-cinzel text-xs font-semibold text-gothic-gold pointer-events-none tracking-widest uppercase"
            style={{ right: '15%', top: '35%' }}
          >
            {eff.text}
          </motion.span>
        ))}
      </AnimatePresence>

      <div className="flex items-start gap-3">
        {/* Ornate Thorn Checkbox/Absolution Trigger */}
        <button
          id={`complete-btn-${quest.id}`}
          onClick={handleComplete}
          disabled={quest.completed}
          className={`mt-0.5 text-left flex-shrink-0 cursor-pointer focus:outline-none transition-transform duration-200 active:scale-95 ${
            quest.completed ? 'text-gothic-gold-dim cursor-default' : 'text-gray-400 hover:text-gothic-gold'
          }`}
        >
          {quest.completed ? (
            <div className="relative p-0.5">
              <CheckCircle2 className="w-5 h-5 stroke-[1.5]" />
              <div className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-gothic-gold" />
            </div>
          ) : (
            <div className="relative p-0.5 group">
              <Circle className="w-5 h-5 stroke-[1.2] group-hover:scale-105 group-hover:stroke-gothic-gold transition-all" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-[8px] text-gothic-gold transition-opacity">
                †
              </div>
            </div>
          )}
        </button>

        {/* Quest Information */}
        <div 
          onClick={() => {
            soundEngine.playClick();
            setIsExpanded(!isExpanded);
          }}
          className="flex-grow min-w-0 cursor-pointer select-none group/info animate-fade-in"
        >
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            {/* Category */}
            <span className="font-mono text-[8.5px] uppercase tracking-widest text-gray-500">
              {getCategorySymbol(quest.category)}
            </span>

            {/* Difficulty Badge */}
            <span className={`px-1.5 py-0.2 rounded text-[7.5px] font-mono font-bold tracking-widest uppercase border ${getDifficultyColor(quest.difficulty)}`}>
              {quest.difficulty}
            </span>

            {/* Overdue Alert */}
            {isOverdue && (
              <span className="flex items-center gap-1 px-1.5 py-0.2 rounded text-[7.5px] font-mono font-bold bg-gothic-crimson/20 text-gothic-crimson border border-gothic-crimson/30 uppercase tracking-wider animate-pulse">
                <ShieldAlert className="w-2.5 h-2.5" />
                DREAD OVERDUE
              </span>
            )}

            {daysLeft !== null && daysLeft <= 2 && !quest.completed && (
              <span className="flex items-center gap-1 px-1.5 py-0.2 rounded text-[7.5px] font-mono text-gothic-gold bg-gothic-gold/10 border border-gothic-gold/20 tracking-wider">
                ⏳ {daysLeft === 0 ? 'FADES TONIGHT' : `${daysLeft} days left`}
              </span>
            )}
          </div>

          {/* Title and Expansion Indicator */}
          <div className="flex items-center justify-between gap-2.5">
            <h3 
              className={`font-cinzel tracking-wide text-sm transition-all duration-350 pr-4 ${
                quest.completed 
                  ? 'line-through text-gray-600 italic translate-x-1 decoration-gothic-border' 
                  : 'text-gray-200 group-hover/info:text-gothic-gold'
              }`}
            >
              {quest.title}
            </h3>
            {(quest.description || quest.dueDate) && (
              <ChevronDown className={`w-3.5 h-3.5 text-gray-500 group-hover/info:text-gothic-gold transition-transform duration-220 shrink-0 ${
                isExpanded ? 'rotate-180 text-gothic-gold font-bold' : ''
              }`} />
            )}
          </div>

          {/* Optional description or due date expanded area */}
          <AnimatePresence initial={false}>
            {isExpanded && (quest.description || quest.dueDate) && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: 'auto', opacity: 1, marginTop: 6 }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="overflow-hidden border-t border-gothic-border/10 pt-2"
                onClick={(e) => e.stopPropagation()} // Prevent clicking the expanded text from collapsing immediately
              >
                {quest.description && (
                  <p className={`font-sans text-xs leading-relaxed transition-colors duration-300 ${
                    quest.completed ? 'text-gray-700' : 'text-gray-400'
                  }`}>
                    {quest.description}
                  </p>
                )}

                {/* Due date if exists */}
                {quest.dueDate && !quest.completed && (
                  <div className={`text-[8.5px] font-mono text-gray-500 uppercase tracking-widest flex justify-between items-center bg-black/10 px-2 py-1 rounded-lg border border-gothic-border/10 ${quest.description ? 'mt-2.5' : ''}`}>
                    <span className="text-[7.5px] text-gray-400">📅 JUDGMENT DUE:</span>
                    <span className="text-gothic-gold font-bold">
                      {new Date(quest.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Purge / Obliterate Button */}
        <button
          id={`delete-btn-${quest.id}`}
          onClick={handleDelete}
          className="p-1 text-gray-600 hover:text-gothic-crimson hover:bg-gothic-crimson/10 rounded-lg transition-all focus:outline-none shrink-0 self-center"
          title="Purge Task From Ledger"
        >
          <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
        </button>
      </div>
    </motion.div>
  );
};
