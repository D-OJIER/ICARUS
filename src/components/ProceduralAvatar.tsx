import React from 'react';
import { motion } from 'motion/react';
import { CharacterProfile } from '../utils/progressionUtils';

interface ProceduralAvatarProps {
  profile: CharacterProfile;
  size?: number;
}

export const ProceduralAvatar: React.FC<ProceduralAvatarProps> = ({ profile, size = 180 }) => {
  // Simple seed parser
  const getSeedFromString = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const seed = getSeedFromString(profile.id + profile.accountCreated);
  const userLevel = Math.floor(profile.xp / 1000) + 1;

  // Evaluate dynamic achievements & milestones
  const hasCompletedHabit = profile.stats.consistency > 40 || profile.xp > 500;
  const hasTitleEarned = profile.earnedTitles.length > 4 || profile.title !== 'The Forgotten Wanderer';

  // Level thresholds as per spec
  // New User: Level < 15
  // Level 15-29: Partial Temple
  // Level 30-44: Floating Architecture
  // Level >= 45: Massive ancient citadel
  
  // Custom theme colors extracted from user profile stats or seed
  const primaryStatsWeight = (profile.stats.discipline as number || 10) + (profile.stats.focus as number || 10);
  const glowPulseDuration = 2.5 + (seed % 3);
  
  // Decide core accent color
  const accentColor = '#c89e5c'; // gold
  const alertColor = '#dc2626'; // blood red
  
  return (
    <div 
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
      id={`avatar-level-${userLevel}`}
    >
      <svg 
        viewBox="0 0 120 120" 
        className="w-full h-full overflow-visible drop-shadow-[0_0_20px_rgba(200,158,92,0.15)]"
      >
        <defs>
          {/* Glowing linear gradient filters */}
          <linearGradient id="portalGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c89e5c" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#dc2626" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0a0b0d" stopOpacity="0.9" />
          </linearGradient>
          <filter id="gothicBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer orbital rings (All classes have these, density grows with level) */}
        <motion.circle 
          cx="60" 
          cy="60" 
          r="54" 
          fill="none" 
          stroke={accentColor} 
          strokeWidth="0.5" 
          strokeOpacity="0.1" 
          strokeDasharray="4 8"
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "60px 60px" }}
        />

        {userLevel >= 15 && (
          <motion.circle 
            cx="60" 
            cy="60" 
            r="48" 
            fill="none" 
            stroke={accentColor} 
            strokeWidth="0.75" 
            strokeOpacity="0.15" 
            strokeDasharray="18 4"
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "60px 60px" }}
          />
        )}

        {/* Dynamic Habit Completion Element: Rotating geometric alignment with outer nodes */}
        {hasCompletedHabit && (
          <g>
            <motion.circle 
              cx="60" 
              cy="60" 
              r="44" 
              fill="none" 
              stroke="#c89e5c" 
              strokeWidth="0.5" 
              strokeOpacity="0.25" 
              strokeDasharray="2 12"
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "60px 60px" }}
            />
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "60px 60px" }}
            >
              {/* Three Orbiting Scribe Nodes representing completed vows */}
              <circle cx="60" cy="16" r="2.5" fill="#dc2626" stroke="#c89e5c" strokeWidth="0.5" className="animate-pulse" />
              <circle cx="22" cy="82" r="2.5" fill="#dc2626" stroke="#c89e5c" strokeWidth="0.5" />
              <circle cx="98" cy="82" r="2.5" fill="#dc2626" stroke="#c89e5c" strokeWidth="0.5" />
              <line x1="60" y1="16" x2="22" y2="82" stroke="#dc2626" strokeWidth="0.25" strokeOpacity="0.25" />
              <line x1="22" y1="82" x2="98" y2="82" stroke="#dc2626" strokeWidth="0.25" strokeOpacity="0.25" />
              <line x1="98" y1="82" x2="60" y2="16" stroke="#dc2626" strokeWidth="0.25" strokeOpacity="0.25" />
            </motion.g>
          </g>
        )}

        {/* Dynamic Title Bestowed Indicator: Secondary float system of shard matrices */}
        {hasTitleEarned && (
          <motion.g
            animate={{ rotate: -360 }}
            transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "60px 60px" }}
          >
            {/* 4 Floating Runestones Shards */}
            <motion.rect x="35" y="32" width="3" height="3" transform="rotate(45 36.5 33.5)" fill="#c89e5c" opacity="0.6" animate={{ y: [0, -3, 0] }} transition={{ duration: 2.2, repeat: Infinity }} />
            <motion.rect x="82" y="32" width="3" height="3" transform="rotate(45 83.5 33.5)" fill="#c89e5c" opacity="0.6" animate={{ y: [0, 3, 0] }} transition={{ duration: 2.5, repeat: Infinity }} />
            <motion.rect x="35" y="85" width="3" height="3" transform="rotate(45 36.5 86.5)" fill="#c89e5c" opacity="0.6" animate={{ y: [0, 2, 0] }} transition={{ duration: 1.8, repeat: Infinity }} />
            <motion.rect x="82" y="85" width="3" height="3" transform="rotate(45 83.5 86.5)" fill="#c89e5c" opacity="0.6" animate={{ y: [0, -2, 0] }} transition={{ duration: 2, repeat: Infinity }} />
          </motion.g>
        )}

        {/* Core render branches depending on level tier */}
        {userLevel < 15 ? (
          // ================= Tier 1: Small Ruin Fragment (Level < 15) =================
          <g>
            {/* Ambient Background Glow */}
            <motion.circle 
              cx="60" 
              cy="60" 
              r="14" 
              fill={accentColor} 
              opacity="0.15" 
              filter="url(#gothicBlur)" 
              animate={{ opacity: [0.1, 0.25, 0.1] }}
              transition={{ duration: glowPulseDuration, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Unstable floating base stone fragment */}
            <motion.path 
              d="M35,75 L85,75 L75,82 L45,82 Z" 
              fill="#2e323e" 
              stroke="#42495b" 
              strokeWidth="1" 
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Left broken column remnant */}
            <motion.rect 
              x="42" 
              y="52" 
              width="8" 
              height="23" 
              fill="#181a20" 
              stroke="#2e323e" 
              strokeWidth="1" 
              animate={{ y: [0, -1.5, 0] }}
              transition={{ duration: 4.3, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Truncated cap */}
            <motion.path 
              d="M40,52 L52,52 L48,49 L44,49 Z" 
              fill="#2e323e" 
              stroke="#42495b" 
              strokeWidth="0.75" 
              animate={{ y: [0, -1.5, 0] }}
              transition={{ duration: 4.3, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* Tiny floating geometric rubble block */}
            <motion.polygon 
              points="76,46 82,43 79,51 73,49" 
              fill="#2e323e" 
              stroke="#42495b" 
              strokeWidth="0.75" 
              animate={{ 
                y: [0, -4, 0],
                rotate: [0, 8, 0]
              }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: "78px 47px" }}
            />
            
            {/* Center glowing core stone ember */}
            <motion.circle 
              cx="60" 
              cy="62" 
              r="4" 
              fill={accentColor} 
              animate={{ scale: [0.9, 1.2, 0.9], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </g>
        ) : userLevel < 30 ? (
          // ================= Tier 2: Partial Temple with Arches & Energetic Portals (Level 15-29) =================
          <g>
            {/* Central energy gateway sphere */}
            <motion.ellipse 
              cx="60" 
              cy="53" 
              rx="16" 
              ry="24" 
              fill="url(#portalGlow)" 
              opacity="0.35" 
              filter="url(#gothicBlur)"
              animate={{ scale: [0.96, 1.05, 0.96], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Temple Pediment Foundation Base */}
            <path d="M25,82 L95,82 L90,88 L30,88 Z" fill="#111216" stroke="#2e323e" strokeWidth="1.25" />
            <path d="M28,78 L92,78 L90,82 L30,82 Z" fill="#181a20" stroke="#42495b" strokeWidth="0.75" />

            {/* Left and Right Columns */}
            <rect x="34" y="44" width="6" height="34" fill="#181a20" stroke="#2e323e" strokeWidth="1" />
            <rect x="80" y="44" width="6" height="34" fill="#181a20" stroke="#2e323e" strokeWidth="1" />

            {/* Capital joints */}
            <rect x="32" y="40" width="10" height="4" fill="#2d313c" stroke="#42495b" strokeWidth="0.75" />
            <rect x="78" y="40" width="10" height="4" fill="#2d313c" stroke="#42495b" strokeWidth="0.75" />

            {/* Sacred Gate Arch Roof */}
            <path d="M30,40 Q60,18 90,40 L90,36 Q60,14 30,36 Z" fill="#2a2e39" stroke="#c89e5c" strokeWidth="1" />

            {/* Central Levitating Portal Core */}
            <motion.polygon
              points="60,38 68,53 60,68 52,53"
              fill="none"
              stroke={accentColor}
              strokeWidth="1.5"
              animate={{ scale: [0.93, 1.07, 0.93] }}
              transition={{ duration: glowPulseDuration, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: "60px 53px" }}
            />
          </g>
        ) : userLevel < 45 ? (
          // ================= Tier 3: Floating Architecture (Level 30-44) =================
          <g>
            {/* Behind Mechanical Spinning Runes */}
            <motion.path
              d="M60,15 A45,45 0 0,1 105,60 A45,45 0 0,1 60,105 A45,45 0 0,1 15,60 A45,45 0 0,1 60,15 Z"
              fill="none"
              stroke="#2e323e"
              strokeWidth="0.75"
              strokeDasharray="40 10 5 10"
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "60px 60px" }}
            />

            {/* Layered floating shrines and vector bridges */}
            {/* Bottom floating tier */}
            <motion.path 
              d="M32,74 L88,74 L82,80 L38,80 Z" 
              fill="#111216" 
              stroke="#2e323e" 
              strokeWidth="1" 
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Mid tier left block */}
            <motion.polygon 
              points="28,45 42,45 38,62 24,62" 
              fill="#181a20" 
              stroke="#42495b" 
              strokeWidth="1" 
              animate={{ y: [-1, -4, -1] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: "31px 53px" }}
            />

            {/* Mid tier right block */}
            <motion.polygon 
              points="78,45 92,45 96,62 82,62" 
              fill="#181a20" 
              stroke="#42495b" 
              strokeWidth="1" 
              animate={{ y: [1, -2, 1] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: "87px 53px" }}
            />

            {/* Top levitating Monolith structure */}
            <motion.polygon 
              points="60,20 74,38 60,46 46,38" 
              fill="#181a20" 
              stroke={accentColor} 
              strokeWidth="1.5" 
              animate={{ y: [-3, 3, -3] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: "60px 33px" }}
            />

            {/* Concentric connections */}
            <motion.circle 
              cx="60" 
              cy="60" 
              r="22" 
              fill="none" 
              stroke={accentColor} 
              strokeWidth="0.5" 
              strokeDasharray="4 4"
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 2.8, repeat: Infinity }}
              style={{ transformOrigin: "60px 60px" }}
            />

            {/* Central radiant laser beam effect */}
            <motion.line 
              x1="60" 
              y1="32" 
              x2="60" 
              y2="76" 
              stroke={accentColor} 
              strokeWidth="2" 
              strokeDasharray="6 2" 
              opacity="0.75" 
              animate={{ strokeDashoffset: [0, -20] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </g>
        ) : (
          // ================= Tier 4: Massive Celestial Citadel Fortress (Level >= 45) =================
          <g>
            {/* Large spinning astronomical background grids */}
            <motion.circle
              cx="60"
              cy="60"
              r="40"
              fill="none"
              stroke={alertColor}
              strokeWidth="0.5"
              strokeOpacity="0.25"
              strokeDasharray="5 15 2 2"
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "60px 60px" }}
            />
            <motion.polygon
              points="60,11 102,53 60,95 18,53"
              fill="none"
              stroke="#2e323e"
              strokeWidth="0.5"
              strokeOpacity="0.5"
              animate={{ rotate: -360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "60px 60px" }}
            />

            {/* Imposing multi-layered fortress base */}
            <path d="M15,85 L105,85 L100,92 L20,92 Z" fill="#0a0b0d" stroke="#2e323e" strokeWidth="1.5" />
            <path d="M22,78 L98,78 L94,85 L26,85 Z" fill="#111216" stroke="#42495b" strokeWidth="1" />
            
            {/* Outer towers */}
            <rect x="25" y="44" width="10" height="34" fill="#181a20" stroke="#2e323e" strokeWidth="1" />
            <rect x="85" y="44" width="10" height="34" fill="#181a20" stroke="#2e323e" strokeWidth="1" />
            {/* Tower battlements */}
            <path d="M23,40 L37,40 L35,44 L25,44 Z" fill="#2d313c" stroke="#42495b" strokeWidth="1" />
            <path d="M83,40 L97,40 L95,44 L85,44 Z" fill="#2d313c" stroke="#42495b" strokeWidth="1" />

            {/* Inner primary obsidian citadel spire */}
            <path d="M48,78 L72,78 L68,26 L52,26 Z" fill="#181a20" stroke={accentColor} strokeWidth="1.5" />
            {/* High sanctuary arch inside spire */}
            <path d="M54,58 C54,52 66,52 66,58 L66,78 L54,78 Z" fill="#111216" stroke="#42495b" strokeWidth="1" />

            {/* Hovering celestial golden crown over the pinnacle */}
            <motion.polygon
              points="60,14 66,22 60,20 54,22"
              fill={accentColor}
              stroke={accentColor}
              strokeWidth="0.5"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: "60px 17px" }}
            />

            {/* Infinite high-voltage energy loops centered on target */}
            <motion.circle
              cx="60"
              cy="58"
              r="14"
              fill="none"
              stroke={accentColor}
              strokeWidth="1"
              strokeOpacity="0.8"
              animate={{ 
                scale: [0.8, 1.4, 0.8],
                opacity: [0.8, 0, 0.8]
              }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: "60px 58px" }}
            />

            {/* Celestial stars floating around */}
            {Array.from({ length: 4 }).map((_, idx) => {
              const dx = idx % 2 === 0 ? 1 : -1;
              const dy = idx >= 2 ? 1 : -1;
              return (
                <motion.circle
                  key={idx}
                  cx={60 + dx * 28}
                  cy={50 + dy * 22}
                  r="1.5"
                  fill="#fff"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1.5 + idx * 0.5, repeat: Infinity }}
                />
              );
            })}
          </g>
        )}
      </svg>
    </div>
  );
};
