/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Calendar, Award } from 'lucide-react';
import { DayContext } from '../utils/contextAwareEngine';

interface ProceduralRuinBannerProps {
  dayContext: DayContext;
  userLevel: number;
  streak: number;
}

export const ProceduralRuinBanner: React.FC<ProceduralRuinBannerProps> = ({
  dayContext,
  userLevel,
  streak,
}) => {
  const { season, specialOccasion, historicalSignificance, campaignProgress, streakMilestone } = dayContext;

  // Deterministic seed helper based on date string, level, and streak
  const hashString = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const seed = hashString(dayContext.dateStr + userLevel + streak);
  const ruinTypeIndex = seed % 6;

  // 1. Season & Occasion Theme Overrides for Colors and Glow
  let activeColor = '#c89e5c'; // Default Gold
  let activeGlow = 'rgba(200, 158, 92, 0.2)';

  if (season === 'Winter') {
    activeColor = '#60a5fa'; // Ice sky blue
    activeGlow = 'rgba(96, 165, 250, 0.25)';
  } else if (season === 'Spring') {
    activeColor = '#34d399'; // Emerald growth green
    activeGlow = 'rgba(52, 211, 153, 0.25)';
  } else if (season === 'Summer') {
    activeColor = '#fb923c'; // Sunshine Amber
    activeGlow = 'rgba(251, 146, 60, 0.25)';
  } else if (season === 'Autumn') {
    activeColor = '#fb7185'; // Warm Rust Rose / Bronze Crimson
    activeGlow = 'rgba(251, 113, 133, 0.25)';
  }

  // Override color entirely during highly momentous special occasions
  if (specialOccasion === "The Day of Inception") {
    activeColor = '#ecc94b'; // Celestial Gold
    activeGlow = 'rgba(236, 201, 75, 0.4)';
  } else if (specialOccasion === "The Midwinter Sanctuary") {
    activeColor = '#f97316'; // Cozy Hearth Orange
    activeGlow = 'rgba(249, 115, 22, 0.35)';
  } else if (specialOccasion === "The Festival of Lantern Embers") {
    activeColor = '#fbbf24'; // Activated Brilliant Yellow
    activeGlow = 'rgba(251, 191, 36, 0.4)';
  } else if (specialOccasion === "New Year's Ascension") {
    activeColor = '#f472b6'; // Renewal Lavender / Pink Gold
    activeGlow = 'rgba(244, 114, 182, 0.35)';
  }

  // Ruin metadata list
  type RuinMetadata = {
    title: string;
    lore: string;
  };

  const baseRuins: RuinMetadata[] = [
    {
      title: 'The Spires of Cinder',
      lore: 'An ancient obsidian tower stands tall against the ashen heavens, its peak permanently burning with the remnants of ancient vows.',
    },
    {
      title: 'The Forgotten Tree-Shrine',
      lore: 'Eldritch roots twine around a pristine white marble altar, where lost spirits once whispered penances to the quiet sky.',
    },
    {
      title: 'The Sunk Monolithic Temple',
      lore: 'A collapsed temple half-devoured by living earth. Cracked geometric steps lead straight down into glowing deep-crystal veins.',
    },
    {
      title: 'The Astral Keyhole Gate',
      lore: 'A colossal keyhole arch levitates silently over an abyss. Rotating runic rings revolve dynamically around its path, waiting for key souls.',
    },
    {
      title: 'The Shattered Monolith',
      lore: 'A colossal stone obelisk split symmetrically in two, bound together solely by anti-gravity forces and humming glowing ley-lines.',
    },
    {
      title: 'The Defunct Observatory',
      lore: 'Giant concentric metal armillary arrays rest atop stone pillars, echoing the ancient mechanical paths of dead satellites.',
    },
  ];

  const targetRuin = baseRuins[ruinTypeIndex];

  // Overlay a context message over the lore
  let contextLoreNote = targetRuin.lore;
  if (specialOccasion) {
    contextLoreNote = `[${specialOccasion.toUpperCase()}] • ${historicalSignificance || ''} The physical laws of the ruins bend to reflect the day's alignment.`;
  } else {
    // Standard seasonal lore injection
    if (season === 'Winter') {
      contextLoreNote += ` A heavy freeze grips the courtyard, challenging thine endurance.`;
    } else if (season === 'Spring') {
      contextLoreNote += ` Geometric green-life begins to sprout between the cracked basalt joints.`;
    } else if (season === 'Summer') {
      contextLoreNote += ` Radiational wave patterns hum from deep within, urging fast momentum.`;
    } else if (season === 'Autumn') {
      contextLoreNote += ` Leaves of pure carbon float silently from the canopy, demonstrating absolute balance.`;
    }
  }

  // Main SVG structures
  const renderCoreStructure = () => {
    switch (ruinTypeIndex) {
      case 0: // Ancient Cinder Tower
        return (
          <g>
            {/* Tower Base Platform */}
            <line x1="20" y1="125" x2="180" y2="125" stroke={activeColor} strokeWidth="1" strokeOpacity="0.4" />
            <path d="M40,125 L160,125 L150,130 L50,130 Z" fill="#111216" stroke={activeColor} strokeWidth="0.75" />
            
            {/* Tower Main Chasis */}
            <path d="M75,125 L85,45 L115,45 L125,125 Z" fill="#181a20" stroke={activeColor} strokeWidth="1.5" />
            
            {/* Bricks/grid marks */}
            <line x1="83" y1="65" x2="117" y2="65" stroke={activeColor} strokeWidth="0.75" strokeOpacity="0.5" />
            <line x1="80" y1="92" x2="120" y2="92" stroke={activeColor} strokeWidth="0.75" strokeOpacity="0.5" />
            <line x1="77" y1="110" x2="123" y2="110" stroke={activeColor} strokeWidth="0.75" strokeOpacity="0.5" />
            
            {/* Spiraling cosmic threads */}
            <path d="M85,50 C100,60 120,45 115,70 C100,80 80,73 83,100 C110,110 125,95 120,125" fill="none" stroke={activeColor} strokeWidth="0.75" strokeDasharray="3 3" />
            
            {/* Glowing window core */}
            <rect x="96" y="72" width="8" height="12" rx="4" fill="#0c0d10" stroke={activeColor} strokeWidth="0.75" />
            <motion.circle cx="100" cy="78" r="2.5" fill={activeColor} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} />
          </g>
        );

      case 1: // Tree Shrine
        return (
          <g>
            <line x1="20" y1="125" x2="180" y2="125" stroke={activeColor} strokeWidth="1" strokeOpacity="0.4" />
            
            {/* Elegant Root Branches */}
            <path d="M40,125 Q65,105 70,80 Q75,95 85,125" fill="none" stroke={activeColor} strokeWidth="1.5" />
            <path d="M60,125 Q100,95 130,125" fill="none" stroke={activeColor} strokeWidth="1" />
            
            {/* Slabs of marble altar */}
            <rect x="80" y="80" width="40" height="25" fill="#181a20" stroke={activeColor} strokeWidth="1.25" />
            <rect x="76" y="75" width="48" height="6" fill="#111216" stroke={activeColor} strokeWidth="0.75" />
            
            {/* Moving foliage orbits */}
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.circle
                key={i}
                cx={58 + i * 20}
                cy={55 + (i % 2) * 10}
                r={5 + (i % 3)}
                fill="none"
                stroke={activeColor}
                strokeWidth="0.75"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
          </g>
        );

      case 2: // Sunken Temple
        return (
          <g>
            {/* Earth lines */}
            <path d="M20,105 Q100,117 180,105 L180,135 L20,135 Z" fill="#0a0b0d" stroke={activeColor} strokeWidth="1.25" />
            
            {/* Crooked Sunken Pillars */}
            <motion.rect 
              x="42" y="75" width="8" height="40" 
              fill="#181a20" stroke={activeColor} strokeWidth="0.75" 
              style={{ transform: "rotate(-12deg)", transformOrigin: "42px 115px" }}
            />
            <motion.rect 
              x="148" y="65" width="8" height="50" 
              fill="#181a20" stroke={activeColor} strokeWidth="0.75" 
              style={{ transform: "rotate(8deg)", transformOrigin: "148px 115px" }}
            />
            
            {/* Sunken Arch */}
            <path d="M62,105 A38,38 0 0,1 138,105" fill="none" stroke={activeColor} strokeWidth="1.75" strokeDasharray="15 3" />
            
            {/* Emitting glowing pulse */}
            <motion.circle
              cx="100" cy="105" r="10"
              fill={activeColor} fillOpacity="0.08"
              stroke={activeColor} strokeWidth="1"
              animate={{ scale: [0.9, 1.2, 0.9], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </g>
        );

      case 3: // Keyhole Gate
        return (
          <g>
            {/* Orbiting concentric ring */}
            <motion.circle 
              cx="100" cy="75" r="28" 
              fill="none" stroke={activeColor} strokeWidth="2" 
              strokeDasharray="30 5 10 5"
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: "100px 75px" }}
            />
            
            {/* Minor inner ring */}
            <motion.circle 
              cx="100" cy="75" r="20" 
              fill="none" stroke={activeColor} strokeWidth="0.75" 
              strokeDasharray="4 4"
              animate={{ rotate: -360 }}
              transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
              style={{ transformOrigin: "100px 75px" }}
            />
            
            {/* Background structures */}
            <line x1="50" y1="125" x2="50" y2="65" stroke={activeColor} strokeWidth="1" strokeOpacity="0.25" />
            <line x1="150" y1="125" x2="150" y2="65" stroke={activeColor} strokeWidth="1" strokeOpacity="0.25" />
            
            {/* Center keyhole arch void */}
            <path d="M96,75 L104,75 L106,92 L94,92 Z" fill="#0a0b0d" stroke={activeColor} strokeWidth="1" />
            <circle cx="100" cy="71" r="5" fill="#0a0b0d" stroke={activeColor} strokeWidth="1" />
          </g>
        );

      case 4: // Split Monolith
        return (
          <g>
            <line x1="25" y1="125" x2="175" y2="125" stroke={activeColor} strokeWidth="1" strokeOpacity="0.4" />
            
            {/* Top Monolith segment hovering */}
            <motion.polygon
              points="100,20 114,58 100,65 86,58"
              fill="#181a20"
              stroke={activeColor}
              strokeWidth="1.5"
              animate={{ y: [-3, 3, -3] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: "100px 42px" }}
            />
            
            {/* Standing grounded segment */}
            <polygon
              points="100,125 112,100 100,95 88,100"
              fill="#111216"
              stroke={activeColor}
              strokeWidth="1"
            />
            
            {/* Core anti-gravity stream */}
            <motion.line
              x1="100" y1="68" x2="100" y2="95"
              stroke={activeColor}
              strokeWidth="1.5"
              strokeDasharray="4 2"
              animate={{ strokeDashoffset: [0, -8] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            />
          </g>
        );

      default: // Armillary Observatory
        return (
          <g>
            <line x1="20" y1="125" x2="180" y2="125" stroke={activeColor} strokeWidth="1" strokeOpacity="0.4" />
            
            {/* Ruined supporting pillars */}
            <path d="M42,125 C42,85 68,75 72,125" fill="none" stroke={activeColor} strokeWidth="1.25" strokeOpacity="0.5" />
            <path d="M128,125 C132,75 158,85 158,125" fill="none" stroke={activeColor} strokeWidth="1.25" strokeOpacity="0.5" />
            
            {/* Rotating Armillary scope rings */}
            <motion.circle 
              cx="100" cy="70" r="22" 
              fill="none" stroke={activeColor} strokeWidth="0.75" 
              strokeDasharray="15 3 3 3"
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "100px 70px" }}
            />
            <motion.ellipse 
              cx="100" cy="70" rx="22" ry="8" 
              fill="none" stroke={activeColor} strokeWidth="1.5"
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "100px 70px" }}
            />
            
            {/* Metallic sight tube */}
            <line x1="78" y1="88" x2="122" y2="52" stroke={activeColor} strokeWidth="2" strokeOpacity="0.85" />
          </g>
        );
    }
  };

  // 2. Render Context-Aware Geometry Additions on Top
  const renderContextOverlay = () => {
    // A. SEASONAL OVERLAYS
    if (season === 'Spring') {
      // Spring motif: Emerging spiraling pathways wrapping upward
      return (
        <g>
          <motion.path 
            d="M30,125 C30,90 45,70 70,60" 
            fill="none" stroke={activeColor} strokeWidth="0.75" strokeDasharray="3 3"
            animate={{ strokeDashoffset: [0, -12] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          />
          <motion.path 
            d="M170,125 C170,90 155,70 130,60" 
            fill="none" stroke={activeColor} strokeWidth="0.75" strokeDasharray="3 3"
            animate={{ strokeDashoffset: [0, 12] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          />
          {/* Emergence buds */}
          <circle cx="70" cy="60" r="2" fill={activeColor} />
          <circle cx="130" cy="60" r="2" fill={activeColor} />
        </g>
      );
    }

    if (season === 'Summer') {
      // Summer motif: High soaring side vertical spires indicating power & momentum
      return (
        <g>
          <polygon points="12,125 15,40 18,125" fill="#181a20" stroke={activeColor} strokeWidth="0.75" />
          <polygon points="188,125 185,40 182,125" fill="#181a20" stroke={activeColor} strokeWidth="0.75" />
          <motion.circle cx="15" cy="40" r="1.5" fill={activeColor} animate={{ scale: [1, 1.8, 1] }} transition={{ duration: 2, repeat: Infinity }} />
          <motion.circle cx="185" cy="40" r="1.5" fill={activeColor} animate={{ scale: [1, 1.8, 1] }} transition={{ duration: 2.2, repeat: Infinity }} />
        </g>
      );
    }

    if (season === 'Autumn') {
      // Autumnal balanced pillars flanking sides perfectly, representing complete formations
      return (
        <g>
          <rect x="28" y="60" width="6" height="65" fill="#111216" stroke={activeColor} strokeWidth="0.75" />
          <rect x="166" y="60" width="6" height="65" fill="#111216" stroke={activeColor} strokeWidth="0.75" />
          {/* Capital block on top */}
          <rect x="26" y="56" width="10" height="4" fill="#181a20" stroke={activeColor} strokeWidth="0.75" />
          <rect x="164" y="56" width="10" height="4" fill="#181a20" stroke={activeColor} strokeWidth="0.75" />
        </g>
      );
    }

    if (season === 'Winter') {
      // Winter motif: Dense monolithic protective heavy base grid & backing structure
      return (
        <g>
          <rect x="15" y="121" width="170" height="4" fill="#1c1e24" stroke={activeColor} strokeWidth="1" />
          <line x1="30" y1="123" x2="170" y2="123" stroke={activeColor} strokeWidth="0.5" strokeDasharray="2 4" />
          {/* Corner structural brackets */}
          <path d="M15,121 L25,111 L25,121 Z" fill={activeColor} fillOpacity="0.2" stroke={activeColor} strokeWidth="0.75" />
          <path d="M185,121 L175,111 L175,121 Z" fill={activeColor} fillOpacity="0.2" stroke={activeColor} strokeWidth="0.75" />
        </g>
      );
    }

    return null;
  };

  const renderOccasionOverlay = () => {
    // B. SPECIAL OCCASION OVERLAYS
    if (specialOccasion === "The Day of Inception") {
      // Birthday: rare orbiting double stars & levitating diamond shards
      return (
        <g>
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: "100px 75px" }}
          >
            <circle cx="100" cy="20" r="3" fill="#fff" stroke={activeColor} strokeWidth="0.75" className="animate-pulse" />
            <line x1="100" y1="75" x2="100" y2="20" stroke={activeColor} strokeWidth="0.5" strokeOpacity="0.2" />
          </motion.g>
          
          {/* Floating crystal shards */}
          <motion.polygon 
            points="35,40 40,32 45,40 40,48" 
            fill="none" stroke={activeColor} strokeWidth="0.75"
            animate={{ y: [-4, 4, -4], rotate: 45 }}
            transition={{ duration: 3.5, repeat: Infinity }}
          />
          <motion.polygon 
            points="165,40 170,32 175,40 170,48" 
            fill="none" stroke={activeColor} strokeWidth="0.75"
            animate={{ y: [4, -4, 4], rotate: -45 }}
            transition={{ duration: 3.8, repeat: Infinity }}
          />
        </g>
      );
    }

    if (specialOccasion === "New Year's Ascension") {
      // New Year: Dual reverse spinning outer rings representing gear potential
      return (
        <g>
          <motion.ellipse 
            cx="100" cy="75" rx="55" ry="55"
            fill="none" stroke={activeColor} strokeWidth="0.5" strokeDasharray="12 18"
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "100px 75px" }}
          />
          <motion.ellipse 
            cx="100" cy="75" rx="51" ry="51"
            fill="none" stroke={activeColor} strokeWidth="0.5" strokeDasharray="6 30"
            animate={{ rotate: -360 }}
            transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "100px 75px" }}
          />
        </g>
      );
    }

    if (specialOccasion === "The Midwinter Sanctuary") {
      // Christmas: Protective warm hearth dome and micro candles
      return (
        <g>
          <path d="M45,125 A55,55 0 0,1 155,125" fill="none" stroke={activeColor} strokeWidth="0.75" strokeOpacity="0.5" strokeDasharray="8 8" />
          
          {/* Floating glowing light vectors (Lantern fires) */}
          <motion.polygon 
            points="48,122 51,114 54,122" 
            fill={activeColor}
            animate={{ scaleY: [1, 1.4, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ transformOrigin: "51px 122px" }}
          />
          <motion.polygon 
            points="152,122 155,114 158,122" 
            fill={activeColor}
            animate={{ scaleY: [1, 1.4, 1] }}
            transition={{ duration: 1.7, repeat: Infinity }}
            style={{ transformOrigin: "155px 122px" }}
          />
        </g>
      );
    }

    if (specialOccasion === "The Festival of Lantern Embers") {
      // Diwali: Brilliant radial lines showing internal light pathways
      return (
        <g>
          <line x1="100" y1="75" x2="30" y2="40" stroke={activeColor} strokeWidth="0.5" strokeOpacity="0.2" />
          <line x1="100" y1="75" x2="170" y2="40" stroke={activeColor} strokeWidth="0.5" strokeOpacity="0.2" />
          <line x1="100" y1="75" x2="50" y2="110" stroke={activeColor} strokeWidth="0.5" strokeOpacity="0.2" />
          <line x1="100" y1="75" x2="150" y2="110" stroke={activeColor} strokeWidth="0.5" strokeOpacity="0.2" />
          <line x1="100" y1="75" x2="100" y2="10" stroke={activeColor} strokeWidth="0.75" strokeOpacity="0.3" strokeDasharray="4 2" />
        </g>
      );
    }

    return null;
  };

  return (
    <div 
      className="p-5 bg-gradient-to-br from-gothic-card/98 to-gothic-dark/95 rounded-2xl border border-gothic-border relative overflow-hidden flex flex-col md:flex-row items-center gap-6"
      id="journey-ruin-hero-banner"
    >
      {/* Dynamic corner markings that glow with relevant theme colors */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t border-l" style={{ borderColor: `${activeColor}80` }} />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r" style={{ borderColor: `${activeColor}80` }} />

      {/* Left section: Atmospheric narrative & stats */}
      <div className="flex-1 space-y-3 z-10 text-left">
        <div className="flex items-center gap-2" style={{ color: activeColor }}>
          <Calendar className="w-3.5 h-3.5" />
          <span className="font-mono text-[9px] uppercase tracking-widest font-bold">
            Horizon {season.toUpperCase()} • {dayContext.dateStr}
          </span>
        </div>

        <h2 className="font-cinzel text-lg md:text-xl font-bold tracking-wider uppercase" style={{ color: activeColor }}>
          {targetRuin.title}
        </h2>

        <p className="font-mono text-[10px] text-gray-400 leading-relaxed uppercase">
          {contextLoreNote}
        </p>

        {/* Level and streak milestones stats labels */}
        <div className="flex items-center gap-4 pt-2.5 border-t border-gothic-border/30 w-fit">
          <div className="flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-gothic-sky" />
            <span className="font-mono text-[8.5px] text-gray-500 uppercase">
              LEVEL <strong className="text-white">{userLevel}</strong>
            </span>
          </div>

          <div className="w-1.5 h-1.5 rounded-full bg-gothic-border" />

          <div className="flex items-center gap-1">
            <span className="text-[10px]">🔥</span>
            <span className="font-mono text-[8.5px] text-gray-500 uppercase">
              STREAK <strong style={{ color: activeColor }}>{streak} DAYS</strong>
            </span>
          </div>

          {campaignProgress !== 'None' && (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-gothic-border" />
              <div className="flex items-center gap-1">
                <span className="font-mono text-[8.5px] text-gray-500 uppercase">
                  CRUSADE <strong className="text-gothic-sky">{campaignProgress}</strong>
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right section: SVG procedural render */}
      <div className="w-40 h-36 flex items-center justify-center bg-black/40 border rounded-xl relative overflow-hidden flex-shrink-0" style={{ borderColor: `${activeColor}40` }}>
        {/* Dynamic mesh glow background */}
        <div className="absolute inset-0 bg-[radial-gradient(#2e323e_1px,transparent_1px)] [background-size:12px_12px] opacity-20" />
        
        {/* Core dynamic ambient backlight */}
        <div 
          className="absolute w-24 h-24 rounded-full filter blur-xl opacity-30 animate-pulse pointer-events-none"
          style={{ 
            backgroundColor: activeColor,
            animationDuration: '3s'
          }} 
        />
        
        <svg viewBox="0 0 200 150" className="w-full h-full">
          {/* 1. Underlying Main Monolith/Structure */}
          {renderCoreStructure()}
          
          {/* 2. Seasonal Layout Modification Overlays */}
          {renderContextOverlay()}
          
          {/* 3. Occasion-specific celestial modifiers */}
          {renderOccasionOverlay()}
        </svg>
      </div>
    </div>
  );
};
