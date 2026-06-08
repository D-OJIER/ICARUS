/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { soundEngine } from '../utils/audio';

interface BonfireProps {
  completedCount: number;
  activeCount: number;
  isResting: boolean;
  onRest: () => void;
  igniteTrigger: number; // counter to trigger flash burst
}

export const Bonfire: React.FC<BonfireProps> = ({ completedCount, activeCount, isResting, onRest, igniteTrigger }) => {
  const [hovered, setHovered] = useState(false);

  // Bonfire size scaling depends on outstanding/completed duties in perfect sync.
  // Full completion or high efforts yield a magnificent roaring golden fire of cinder.
  const total = completedCount + activeCount;
  const completionRatio = total > 0 ? (completedCount / total) : 0.5;
  const fireScale = isResting ? 1.4 : 0.85 + (completionRatio * 0.45);

  const handleInteract = () => {
    soundEngine.playClick();
    onRest();
  };

  return (
    <div 
      className="relative flex flex-col items-center justify-center w-full min-h-[300px] py-6 select-none bg-gradient-to-t from-gothic-back/40 to-transparent rounded-3xl border border-gothic-border/20"
      id="bonfire-section"
    >
      {/* Ambient Radial Fire Glow */}
      <div 
        className="absolute w-64 h-64 rounded-full blur-3xl pointer-events-none transition-all duration-1000 ease-in-out"
        style={{
          background: isResting 
            ? 'radial-gradient(circle, rgba(200,158,92,0.3) 0%, rgba(164,44,56,0.15) 50%, transparent 100%)' 
            : `radial-gradient(circle, rgba(164,44,56,${0.25 * (0.5 + completionRatio * 0.5)}) 0%, rgba(19,23,34,0) 70%)`,
          transform: `scale(${fireScale})`,
          top: '15%'
        }}
      />

      {/* Floating Ash/Embers Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: isResting ? 25 : 10 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-gothic-gold animate-ash-rise"
            style={{
              width: `${Math.random() * 4 + 1.5}px`,
              height: `${Math.random() * 4 + 1.5}px`,
              left: `${35 + Math.random() * 30}%`,
              bottom: '25%',
              animationDuration: `${3 + Math.random() * 4}s`,
              animationDelay: `${Math.random() * 4}s`,
              opacity: Math.random() * 0.7 + 0.3,
              filter: 'blur(0.5px)'
            }}
          />
        ))}
      </div>

      {/* SVG Custom Rendered Coiled Coils, Sword of Penance, and Fire */}
      <div className="relative w-72 h-64 flex items-center justify-center">
        {/* The Coiled Sword of Cinder & Penance Altar */}
        <svg 
          viewBox="0 0 200 200" 
          className="w-full h-full drop-shadow-2xl"
          style={{ transition: 'transform 0.4s' }}
        >
          {/* Custom SVG Filters for Liquid/Fire Effect */}
          <defs>
            <filter id="creepy-water">
              <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            
            {/* Glowing Sword Gradients */}
            <linearGradient id="swordGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2e323e" />
              <stop offset="50%" stopColor="#c89e5c" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>

            <linearGradient id="fireGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#dc2626" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#ea580c" stopOpacity="0.8" />
              <stop offset="75%" stopColor="#f59e0b" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#fef08a" stopOpacity="0.1" />
            </linearGradient>
            
            <filter id="glow">
              <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Ash Mound (Dark Souls) */}
          <path 
            d="M 50 170 Q 100 150 150 170 Q 170 175 180 180 Q 20 180 50 170 Z" 
            fill="#181a20" 
            stroke="#2e323e" 
            strokeWidth="2" 
          />
          <path 
            d="M 65 174 Q 100 162 135 174" 
            fill="none" 
            stroke="#c89e5c" 
            strokeWidth="1.5" 
            opacity="0.3" 
          />

          {/* Hollow Knight Stone Bench (Beneath / behind the bonfire structure) */}
          <g transform="translate(0, 10)">
            {/* Bench arch pillar supports */}
            <rect x="55" y="170" width="10" height="15" rx="2" fill="#111216" stroke="#2e323e" strokeWidth="1.5" />
            <rect x="135" y="170" width="10" height="15" rx="2" fill="#111216" stroke="#2e323e" strokeWidth="1.5" />
            {/* Bench Slab */}
            <rect x="40" y="165" width="120" height="7" rx="2.5" fill="#181a20" stroke="#2e323e" strokeWidth="1.8" />
            {/* Small ornate bugs curves on bench backrest */}
            <path d="M 65 165 C 65 155, 75 150, 85 155 C 95 150, 105 150, 115 155 C 125 150, 135 155, 135 165" fill="none" stroke="#2e323e" strokeWidth="1.5" />
          </g>

          {/* Animated Fire Flames Vector */}
          <g 
            className="animate-bonfire-fire origin-[100px_160px]"
            style={{ 
              transform: `scale(${fireScale})`,
              transformOrigin: '100px 160px'
            }}
          >
            {/* Outer flame */}
            <path 
              d="M 100 45 C 120 75, 135 110, 130 160 C 130 160, 100 175, 70 160 C 65 110, 80 75, 100 45 Z" 
              fill="url(#fireGrad)" 
            />
            {/* Inner core flame */}
            <path 
              d="M 100 70 C 112 90, 120 115, 118 160 C 118 160, 100 170, 82 160 C 80 115, 88 90, 100 70 Z" 
              fill="#fbbf24" 
              opacity="0.8" 
              filter="blur(1px)"
            />
            {/* White hot spirit core */}
            <path 
              d="M 100 95 C 107 108, 112 125, 110 160 C 110 160, 100 166, 90 160 C 88 125, 93 108, 100 95 Z" 
              fill="#ffffff" 
              opacity="0.9" 
              filter="blur(1.5px)"
            />
          </g>

          {/* Coiled Sword of Cinder piercing the bonfire (Dark Souls) */}
          <g transform="translate(0, -5)">
            {/* Blade with organic twisted coil path shape */}
            <path 
              d="M 97 50 L 103 50 L 102 80 Q 94 95 104 110 T 96 140 L 98 170 L 102 170 L 104 140 Q 106 125 96 110 T 104 80 Z" 
              fill="url(#swordGrad)" 
              stroke="#0a0b0d" 
              strokeWidth="0.8" 
              filter="url(#glow)"
            />

            {/* Thorn crown (Blasphemous) coiled around sword crossguard */}
            <path 
              d="M 85 92 Q 100 85 115 92 Q 105 100 85 92" 
              fill="none" 
              stroke="#a42c38" 
              strokeWidth="2.5" 
            />
            {/* Individual thorns */}
            <polygon points="90,88 92,83 94,88" fill="#a42c38" />
            <polygon points="108,86 111,81 112,86" fill="#a42c38" />
            <polygon points="100,94 99,99 97,94" fill="#a42c38" />

            {/* Sword Swell Guard */}
            <rect x="80" y="80" width="40" height="3" rx="1.5" fill="#181a20" stroke="#c89e5c" strokeWidth="1" />
            {/* Skull/Mask Ornament Hilt */}
            <circle cx="100" cy="74" r="5.5" fill="#181a20" stroke="#c89e5c" strokeWidth="1.2" />
            <circle cx="98" cy="74" r="1.2" fill="#000" />
            <circle cx="102" cy="74" r="1.2" fill="#000" />
            {/* Long needle-like grip (Hollow Knight Nail handle shape) */}
            <line x1="100" y1="68.5" x2="100" y2="52" stroke="#2e323e" strokeWidth="3" />
            <line x1="100" y1="68" x2="100" y2="52" stroke="#c89e5c" strokeWidth="1" />
            
            {/* Pommel tip */}
            <circle cx="100" cy="51" r="2.5" fill="#c89e5c" />
          </g>

          {/* Overlay glow on bonfire rest */}
          {isResting && (
            <circle cx="100" cy="135" r="30" fill="none" stroke="#c89e5c" strokeWidth="2" strokeDasharray="3, 3" className="animate-spin" style={{ transformOrigin: '100px 135px', animationDuration: '20s' }} />
          )}
        </svg>

        {/* Floating "REST AT BENCH" Prompts */}
        <div className="absolute bottom-6 flex flex-col items-center">
          <motion.button
            id="rest-btn"
            onClick={handleInteract}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-5 py-2 rounded-full cursor-pointer transition-all duration-300 font-cinzel font-semibold tracking-wider text-xs border ${
              isResting 
                ? 'bg-gothic-gold/20 text-gothic-gold border-gothic-gold' 
                : 'bg-gothic-dark/80 text-gray-400 hover:text-gothic-gold border-gothic-border hover:border-gothic-gold'
            }`}
          >
            {isResting ? '★ RESTING AT BENCH ★' : 'REST AT BONFIRE'}
          </motion.button>
          <p className="text-[10px] text-gray-600 mt-2 font-mono uppercase tracking-widest">
            {isResting ? 'Your penances align, soul tranquil' : 'Harken and meditate upon thy deeds'}
          </p>
        </div>
      </div>

      {/* Screen flash on Quest Completed "IGNITE" */}
      <motion.div
        key={igniteTrigger}
        initial={{ opacity: 0 }}
        animate={igniteTrigger > 0 ? { opacity: [0, 0.4, 0] } : { opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 bg-gothic-gold pointer-events-none rounded-3xl mix-blend-color-dodge"
      />
    </div>
  );
};
