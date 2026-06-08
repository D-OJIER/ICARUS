/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Skull, Feather } from 'lucide-react';
import { QuestDifficulty, QuestCategory } from '../types';
import { soundEngine } from '../utils/audio';

interface CreateQuestFormProps {
  onAddQuest: (questData: {
    title: string;
    description: string;
    difficulty: QuestDifficulty;
    category: QuestCategory;
    dueDate?: string;
  }) => void;
  prefilledDate?: string;
}

export const CreateQuestForm: React.FC<CreateQuestFormProps> = ({ onAddQuest, prefilledDate }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<QuestDifficulty>('Lesser Burden');
  const [category, setCategory] = useState<QuestCategory>('General');
  const [dueDate, setDueDate] = useState('');
  const [isOracleLoading, setIsOracleLoading] = useState(false);
  const [oracleError, setOracleError] = useState('');

  useEffect(() => {
    if (prefilledDate) {
      setDueDate(prefilledDate);
    }
  }, [prefilledDate]);

  const handleOracleSuggest = async () => {
    const inputSeed = title.trim() || description.trim();
    if (!inputSeed) {
      soundEngine.playClick();
      setOracleError('Provide key terms first (e.g. "go running" or "clean house") so standard guidance exists.');
      setTimeout(() => setOracleError(''), 7000);
      return;
    }

    setIsOracleLoading(true);
    setOracleError('');
    soundEngine.playClick();

    try {
      const res = await fetch('/api/gemini/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: inputSeed })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'The alignment of stars is imperfect. Divine link failed.');
      }

      const data = await res.json();
      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.difficulty) setDifficulty(data.difficulty as QuestDifficulty);
      if (data.category) setCategory(data.category as QuestCategory);
      
      soundEngine.playClick();
    } catch (err: any) {
      console.error(err);
      setOracleError('AI is unavailable. Please come back later.');
      setTimeout(() => setOracleError(''), 10000);
    } finally {
      setIsOracleLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    soundEngine.playClick();
    onAddQuest({
      title: title.trim(),
      description: description.trim(),
      difficulty,
      category,
      dueDate: dueDate || undefined
    });

    // Reset fields
    setTitle('');
    setDescription('');
    setDifficulty('Lesser Burden');
    setCategory('General');
    setDueDate('');
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="p-6 bg-gothic-card rounded-2xl border border-gothic-border relative overflow-hidden"
      id="create-quest-form"
    >
      {/* Background Filigree Accent */}
      <div className="absolute top-0 left-0 w-8 h-8 opacity-25 border-t border-l border-gothic-gold rounded-tl" />
      <div className="absolute top-0 right-0 w-8 h-8 opacity-25 border-t border-r border-gothic-gold rounded-tr" />
      <div className="absolute bottom-0 left-0 w-8 h-8 opacity-25 border-b border-l border-gothic-gold rounded-bl" />
      <div className="absolute bottom-0 right-0 w-8 h-8 opacity-25 border-b border-r border-gothic-gold rounded-br" />

      {/* Responsive Form Header with AI Oracle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 pb-3 border-b border-gothic-border/20">
        <h2 className="font-cinzel text-sm md:text-base font-bold text-gothic-gold tracking-wider flex items-center gap-2 uppercase">
          <Feather className="w-4 h-4 text-gothic-gold animate-pulse" />
          Inscribe New Penance Vow
        </h2>
        
        <button
          type="button"
          onClick={handleOracleSuggest}
          disabled={isOracleLoading}
          className={`relative flex items-center gap-1.5 px-3.5 py-1.5 bg-gothic-gold/10 hover:bg-gothic-gold/25 text-gothic-gold border border-gothic-gold/30 hover:border-gothic-gold rounded-xl text-[9px] font-mono uppercase tracking-widest cursor-pointer transition-all duration-300 select-none ${
            isOracleLoading ? 'animate-pulse opacity-60 cursor-wait bg-gothic-gold/5' : ''
          }`}
          title="Translates thy simple prompt into peak atmospheric gothic narratives"
        >
          {isOracleLoading ? (
            <>
              <span className="w-2.5 h-2.5 border-2 border-gothic-gold border-t-transparent rounded-full animate-spin flex-shrink-0" />
              Chanting Spell...
            </>
          ) : (
            <>
              <span className="text-[10px]">🔮</span>
              Oracle Translate (AI)
            </>
          )}
        </button>
      </div>

      {oracleError && (
        <div className="mb-4 p-2.5 bg-gothic-back border border-gothic-crimson/50 text-gothic-crimson rounded-lg text-[10px] font-mono uppercase tracking-wide leading-relaxed animate-bounce">
          ✦ Oracle Whisper: {oracleError}
        </div>
      )}

      {/* Quest Title Input */}
      <div className="mb-4">
        <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-1.5">
          Vow Declaration / Task Title *
        </label>
        <input
          id="quest-title-input"
          type="text"
          required
          maxLength={80}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="E.g., Cleanse the study altar, defeat the email hoard..."
          className="w-full bg-gothic-back/80 border border-gothic-border hover:border-gothic-gold-dim focus:border-gothic-gold rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none transition-all duration-300"
        />
      </div>

      {/* Quest Description Input */}
      <div className="mb-4">
        <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-1.5">
          Grave Narrative Details
        </label>
        <textarea
          id="quest-desc-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="E.g., Perform with high precision to earn the title of the absolved..."
          className="w-full bg-gothic-back/80 border border-gothic-border hover:border-gothic-gold-dim focus:border-gothic-gold rounded-lg px-4 py-2 text-xs text-gray-200 placeholder:text-gray-600 focus:outline-none transition-all duration-300 h-20 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {/* Difficulty */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-1.5">
            Severity / Difficulty
          </label>
          <select
            id="quest-difficulty-select"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as QuestDifficulty)}
            className="w-full bg-gothic-back/80 border border-gothic-border focus:border-gothic-gold rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none cursor-pointer"
          >
            <option value="Lesser Burden" className="bg-gothic-card text-gray-300">Lesser Burden (Easy)</option>
            <option value="Sinuous Vow" className="bg-gothic-card text-gray-300">Sinuous Vow (Medium)</option>
            <option value="Mortal Penance" className="bg-gothic-card text-gray-300">Mortal Penance (Hard)</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-1.5">
            Quest Covenant
          </label>
          <select
            id="quest-category-select"
            value={category}
            onChange={(e) => setCategory(e.target.value as QuestCategory)}
            className="w-full bg-gothic-back/80 border border-gothic-border focus:border-gothic-gold rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none cursor-pointer"
          >
            <option value="General" className="bg-gothic-card text-gray-300">🕈 General Duty</option>
            <option value="Vow" className="bg-gothic-card text-gray-300">⛧ Daily Vow</option>
            <option value="Trial" className="bg-gothic-card text-gray-300">⚔ Weekly Trial</option>
            <option value="Crusade" className="bg-gothic-card text-gray-300">♃ Epic Crusade</option>
          </select>
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-1.5">
            Hour of Judgment (Due)
          </label>
          <input
            id="quest-duedate-input"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full bg-gothic-back/80 border border-gothic-border focus:border-gothic-gold rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Submit Button */}
      <motion.button
        id="submit-quest-btn"
        type="submit"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3 rounded-lg bg-gradient-to-r from-gothic-crimson to-red-800 hover:from-gothic-gold hover:to-amber-500 text-white hover:text-black font-cinzel font-bold tracking-widest text-xs border border-gothic-border hover:border-black cursor-pointer transition-colors duration-500 flex items-center justify-center gap-2"
      >
        <Skull className="w-4 h-4 animate-pulse" />
        INSCRIBE IN BLOOD
      </motion.button>
    </form>
  );
};
