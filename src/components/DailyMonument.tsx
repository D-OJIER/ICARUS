import React, { useMemo } from 'react';
import { motion } from 'motion/react';

interface DailyMonumentProps {
  date: Date;
  activeCampaignsCou: number;
  completedCampaignsCou: number;
  skillsCount: number;
  titlesCount: number;
  level: number;
  streak: number;
  season: 'Spring' | 'Summer' | 'Autumn' | 'Winter';
  specialOccasion: string | null;
  hasFailedCampaign: boolean;
  activeViewTab: string;
  activeViewLabel: string;
}

export const DailyMonument: React.FC<DailyMonumentProps> = ({
  date,
  activeCampaignsCou,
  completedCampaignsCou,
  skillsCount,
  titlesCount,
  level,
  streak,
  season,
  specialOccasion,
  hasFailedCampaign,
  activeViewTab,
  activeViewLabel,
}) => {
  // Deterministic seed generation based on parameters to make the structure daily-unique
  const seedVal = useMemo(() => {
    const dateStr = date.toDateString();
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash + level * 10 + streak + skillsCount);
  }, [date, level, streak, skillsCount]);

  // Determine user tier based on level
  const tier = useMemo(() => {
    if (level < 3) return 'new';
    if (level < 6) return 'experienced';
    return 'high';
  }, [level]);

  // Determine colors based on season & special occasion
  const colors = useMemo(() => {
    let primary = '#e5c185'; // Radiant Gold instead of dark gold
    let glowColor = 'rgba(229, 193, 133, 0.6)';
    let secondary = '#38bdf8'; // Electric blue
    
    if (specialOccasion) {
      if (specialOccasion.includes('Inception')) {
        primary = '#facc15'; // Vibrant Yellow Gold
        glowColor = 'rgba(250, 204, 21, 0.7)';
      } else if (specialOccasion.includes('Midwinter')) {
        primary = '#fb923c'; // Bright Hearth Orange
        glowColor = 'rgba(251, 146, 60, 0.7)';
        secondary = '#38bdf8';
      } else if (specialOccasion.includes('Lantern')) {
        primary = '#fde047'; // Bright Yellow Lantern
        glowColor = 'rgba(253, 224, 71, 0.7)';
      } else if (specialOccasion.includes('New Year')) {
        primary = '#f472b6'; // Vibrant Pinkish-gold
        glowColor = 'rgba(244, 114, 182, 0.7)';
      }
    } else {
      switch (season) {
        case 'Spring':
          primary = '#4ade80'; // Bright Emerald Green
          glowColor = 'rgba(74, 222, 128, 0.6)';
          break;
        case 'Summer':
          primary = '#f97316'; // Vivid Orange
          glowColor = 'rgba(249, 115, 22, 0.6)';
          secondary = '#fb7185';
          break;
        case 'Autumn':
          primary = '#f43f5e'; // High-contrast Rose Crimson
          glowColor = 'rgba(244, 63, 94, 0.6)';
          break;
        case 'Winter':
          primary = '#38bdf8'; // Crystal Ice Blue
          glowColor = 'rgba(56, 189, 248, 0.6)';
          secondary = '#c084fc';
          break;
      }
    }
    return { primary, glowColor, secondary };
  }, [season, specialOccasion]);

  // Angle offset based on seed value
  const angleOffset = (seedVal % 180) - 90;

  // Center coordinate of the monument inside the integrated viewBox
  const cx = 675;
  const cy = 90;

  // Render nodes based on skill count
  const renderSkillNodes = () => {
    const nodes = [];
    const count = Math.min(skillsCount, 12); // Cap at 12 for clean rendering
    for (let i = 0; i < count; i++) {
      const angle = (360 / Math.max(count, 1)) * i + angleOffset;
      const radius = 36 + (i * 2.5); // Spiral outward slightly further to match scaled geometry
      const x = cx + radius * Math.cos((angle * Math.PI) / 180);
      const y = cy + radius * Math.sin((angle * Math.PI) / 180);

      nodes.push(
        <motion.circle
          key={`skill-node-${i}`}
          cx={x}
          cy={y}
          r="3"
          fill={colors.primary}
          stroke={colors.secondary}
          strokeWidth="1"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.75, 1, 0.75],
          }}
          transition={{
            duration: 2 + (i % 3),
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      );
    }
    return nodes;
  };

  // Render complete campaign rings
  const renderCampaignRings = () => {
    const rings = [];
    const ringCount = Math.min(completedCampaignsCou, 4);
    for (let i = 0; i < ringCount; i++) {
      const r = 46 + i * 8.5;
      rings.push(
        <motion.circle
          key={`campaign-ring-${i}`}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={colors.primary}
          strokeWidth="1"
          strokeOpacity="0.6"
          strokeDasharray="3 6"
          animate={{ rotate: 360 }}
          transition={{
            duration: 12 + i * 4,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />
      );
    }
    return rings;
  };

  return (
    <div 
      className="relative w-full bg-gradient-to-br from-gothic-card/98 to-gothic-dark/95 border border-gothic-border rounded-2xl overflow-hidden p-1 select-none hover:border-gothic-gold/20 transition-colors duration-300"
      id="daily-monument-root"
    >
      {/* Corner indicator markings */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l" style={{ borderColor: `${colors.primary}40` }} />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r" style={{ borderColor: `${colors.primary}40` }} />

      {/* Embedded Ambient Radial Halo glow backplate behind the core monument */}
      <div 
        className="absolute rounded-full filter blur-3xl opacity-20 pointer-events-none animate-pulse"
        style={{ 
          backgroundColor: colors.primary,
          width: '180px',
          height: '180px',
          right: '50px',
          top: '-10px',
          animationDuration: '5s'
        }} 
      />

      {/* Main responsive SVG housing embedded text and geometrical linkages */}
      <svg 
        viewBox="0 0 800 180" 
        className="w-full h-auto block"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ================= BACKGROUND SYSTEM GRID ================= */}
        <g stroke={colors.primary} strokeOpacity="0.25" strokeWidth="0.75">
          {/* Diagnostic Cartesian grids */}
          <line x1="30" y1="25" x2="770" y2="25" />
          <line x1="30" y1="60" x2="770" y2="60" />
          <line x1="30" y1="120" x2="770" y2="120" />
          <line x1="30" y1="155" x2="770" y2="155" />

          {/* Vertical bounds */}
          <line x1="30" y1="25" x2="30" y2="155" />
          <line x1="180" y1="25" x2="180" y2="155" />
          <line x1="380" y1="25" x2="380" y2="155" />
          <line x1="560" y1="25" x2="560" y2="155" />
          <line x1="770" y1="25" x2="770" y2="155" />
        </g>

        {/* ================= GEOMETRICAL CONNECTIVE PATHWAYS ================= */}
        {/* Dynamic lasers and nodes running from the integrated labels straight to the centerpiece */}
        <g>
          {/* Main system ground alignment conduit */}
          <line 
            x1="30" y1="155" x2="560" y2="155" 
            stroke={colors.primary} 
            strokeWidth="1.5" 
            strokeOpacity="0.75" 
          />
          <line 
            x1="560" y1="155" x2="620" y2="115" 
            stroke={colors.primary} 
            strokeWidth="1.5" 
            strokeOpacity="0.75" 
          />

          {/* Top category alignment label connector */}
          <line 
            x1="30" y1="25" x2="560" y2="25" 
            stroke={colors.primary} 
            strokeWidth="1.5" 
            strokeOpacity="0.75" 
          />
          <line 
            x1="560" y1="25" x2="620" y2="65" 
            stroke={colors.primary} 
            strokeWidth="1.5" 
            strokeOpacity="0.75" 
          />

          {/* Elegant system tick marks along the path */}
          <line x1="180" y1="150" x2="180" y2="160" stroke={colors.primary} strokeWidth="1.5" strokeOpacity="1" />
          <line x1="380" y1="150" x2="380" y2="160" stroke={colors.primary} strokeWidth="1.5" strokeOpacity="1" />
          <line x1="560" y1="150" x2="560" y2="160" stroke={colors.primary} strokeWidth="1.5" strokeOpacity="1" />

          {/* Dynamic glowing pulses traveling down the vector pathways */}
          <motion.circle
            cx="30"
            cy="155"
            r="2.5"
            fill="#ffffff"
            animate={{ cx: [30, 560] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />

          {/* Mathematical spatial label points in light grey */}
          <text x="35" y="19" fill="#ffffff" fillOpacity="0.95" fontStyle="normal" fontWeight="bold" fontFamily="monospace, UI-monospace" fontSize="10.5" letterSpacing="1">
            [ COORDINATE.SYS_ACTIVE ]
          </text>
          <text x="185" y="19" fill="#ffffff" fillOpacity="0.95" fontStyle="normal" fontWeight="bold" fontFamily="monospace, UI-monospace" fontSize="10.5" letterSpacing="1">
            [ ELEV_LVL {level} ]
          </text>
          <text x="385" y="19" fill="#ffffff" fillOpacity="0.95" fontStyle="normal" fontWeight="bold" fontFamily="monospace, UI-monospace" fontSize="10.5" letterSpacing="1">
            [ LINKED_SKILLS {skillsCount} ]
          </text>
        </g>

        {/* ================= EMBEDDED TEXT LABELS ================= */}
        {/* Integrating all text labels directly blockwise into the vector layer */}
        <g id="monument-text-group">
          {/* 1. Celestial / Seasonal Event Label */}
          <text 
            x="40" 
            y="52" 
            fill={colors.primary} 
            fontFamily="monospace, UI-monospace"
            fontWeight="900"
            fontSize="14" 
            letterSpacing="2.5"
          >
            {specialOccasion 
              ? `★ CELESTIAL ALIGNMENT • ${specialOccasion.toUpperCase()}`
              : `⎔ ${season.toUpperCase()} HORIZON • CALENDAR CYCLE`
            }
          </text>

          {/* 2. Main Large View Active Tab Header */}
          <text 
            x="40" 
            y="108" 
            fill="#ffffff" 
            fontFamily="'Cinzel', 'Georgia', 'Times New Roman', serif"
            fontWeight="bold"
            fontSize="46" 
            letterSpacing="4"
          >
            {activeViewTab}
          </text>

          {/* Minor bounding framing bracket around the title to denote alignment */}
          <path 
            d="M 35 34 L 35 125" 
            fill="none" 
            stroke={colors.primary} 
            strokeWidth="2" 
            strokeOpacity="1" 
          />
          <path 
            d="M 35 34 L 48 34" 
            fill="none" 
            stroke={colors.primary} 
            strokeWidth="2" 
            strokeOpacity="1" 
          />
          <path 
            d="M 35 125 L 48 125" 
            fill="none" 
            stroke={colors.primary} 
            strokeWidth="2" 
            strokeOpacity="1" 
          />

          {/* 3. Metrics Active Detail Line */}
          <text 
            x="40" 
            y="144" 
            fill="#ffffff" 
            fontFamily="monospace, UI-monospace"
            fontWeight="900"
            fontSize="13.5" 
            letterSpacing="1"
          >
            {activeViewLabel.toUpperCase()}
          </text>
        </g>

        {/* ================= THE GEOMETRIC DAILY MONUMENT PORTAL ================= */}
        <g id="monument-geometry-group">
          {/* Spatial central alignment circles */}
          <circle cx={cx} cy={cy} r="78" fill="#0b0d12" fillOpacity="0.9" stroke={colors.primary} strokeWidth="1" strokeOpacity="0.55" />
          <circle cx={cx} cy={cy} r="3.5" fill="#ffffff" stroke={colors.primary} strokeWidth="1" />

          {/* Minor orbit indicators */}
          {titlesCount > 0 && (
            <motion.circle
              cx={cx}
              cy={cy}
              r={68 + Math.min(titlesCount, 5) * 2}
              fill="none"
              stroke={colors.primary}
              strokeWidth="0.75"
              strokeOpacity="0.45"
              strokeDasharray="3 10"
              animate={{ rotate: -360 }}
              transition={{
                duration: 22,
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            />
          )}

          {/* Main Level Rings */}
          <circle 
            cx={cx}
            cy={cy}
            r={54 + Math.min(level, 10) * 1.5}
            fill="none"
            stroke={colors.primary}
            strokeWidth="0.75"
            strokeOpacity="0.35"
          />

          {/* Completed Campaign Rings */}
          {renderCampaignRings()}

          {/* Orbiting Skill Nodes */}
          {renderSkillNodes()}

          {/* Tier-Specific Core Structure */}
          {tier === 'new' && (
            <g>
              {/* Single geometric pillar */}
              <line x1={cx} y1={cy + 30} x2={cx} y2={cy - 30} stroke={colors.primary} strokeWidth="2.5" />
              <polygon points={`${cx},${cy - 40} ${cx + 6},${cy - 26} ${cx},${cy - 22} ${cx - 6},${cy - 26}`} fill="#181a20" stroke={colors.primary} strokeWidth="1" />
              {/* Base pedestal */}
              <rect x={cx - 15} y={cy + 30} width="30" height="5" fill="#111216" stroke={colors.primary} strokeWidth="1" />
              {/* Core miniature star */}
              <circle cx={cx} cy={cy} r="10" fill="none" stroke={colors.primary} strokeWidth="0.75" strokeDasharray="2 2" />
            </g>
          )}

          {tier === 'experienced' && (
            <g>
              {/* Layered Hexagonal system */}
              <line x1={cx - 25} y1={cy + 36} x2={cx + 25} y2={cy + 36} stroke={colors.primary} strokeWidth="1" strokeOpacity="0.6" />
              
              <motion.polygon
                points={`${cx},${cy - 54} ${cx + 47},${cy - 26} ${cx + 47},${cy + 26} ${cx},${cy + 54} ${cx - 47},${cy + 26} ${cx - 47},${cy - 26}`}
                fill="none"
                stroke={colors.primary}
                strokeWidth="1.25"
                strokeDasharray="8 3"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                style={{ transformOrigin: `${cx}px ${cy}px` }}
              />

              {/* Central Diamond Core */}
              <motion.polygon
                points={`${cx},${cy - 22} ${cx + 17},${cy} ${cx},${cy + 22} ${cx - 17},${cy}`}
                fill="#181a20"
                stroke={colors.primary}
                strokeWidth="1.5"
                animate={{
                  y: [-2, 2, -2],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{ transformOrigin: `${cx}px ${cy}px` }}
              />

              <line x1={cx} y1={cy - 30} x2={cx} y2={cy + 30} stroke={colors.primary} strokeWidth="0.75" strokeOpacity="0.45" />
              <line x1={cx - 30} y1={cy} x2={cx + 30} y2={cy} stroke={colors.primary} strokeWidth="0.75" strokeOpacity="0.45" />
            </g>
          )}

          {tier === 'high' && (
            <g>
              {/* Citadel Complex star */}
              <line x1={cx - 42} y1={cy + 42} x2={cx + 42} y2={cy + 42} stroke={colors.primary} strokeWidth="1.5" />
              <line x1={cx - 30} y1={cy + 47} x2={cx + 30} y2={cy + 47} stroke={colors.primary} strokeWidth="1" />

              <motion.circle
                cx={cx}
                cy={cy}
                r="34"
                fill="none"
                stroke={colors.primary}
                strokeWidth="0.75"
                strokeOpacity="0.45"
                strokeDasharray="2 3 4 3"
                animate={{ rotate: -360 }}
                transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                style={{ transformOrigin: `${cx}px ${cy}px` }}
              />

              <motion.g
                animate={{ rotate: 360 }}
                transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
                style={{ transformOrigin: `${cx}px ${cy}px` }}
              >
                <polygon points={`${cx},${cy - 52} ${cx + 26},${cy - 26} ${cx + 52},${cy} ${cx + 26},${cy + 26} ${cx},${cy + 52} ${cx - 26},${cy + 26} ${cx - 52},${cy} ${cx - 26},${cy - 26}`} fill="none" stroke={colors.primary} strokeWidth="1" strokeOpacity="0.6" />
                <polygon points={`${cx},${cy - 36} ${cx + 18},${cy - 18} ${cx + 36},${cy} ${cx + 18},${cy + 18} ${cx},${cy + 36} ${cx - 18},${cy + 18} ${cx - 36},${cy} ${cx - 18},${cy - 18}`} fill="none" stroke={colors.primary} strokeWidth="0.75" strokeOpacity="0.55" />
              </motion.g>

              {/* Elevated floating shield citadel core */}
              <motion.polygon
                points={`${cx},${cy - 34} ${cx + 15},${cy} ${cx},${cy + 34} ${cx - 15},${cy}`}
                fill="#111216"
                stroke={colors.primary}
                strokeWidth="1.75"
                animate={{
                  scale: [1, 1.04, 1],
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{ transformOrigin: `${cx}px ${cy}px` }}
              />

              {/* Mini secondary cosmic core star sphere */}
              <motion.circle
                cx={cx}
                cy={cy}
                r="6.5"
                fill={colors.secondary}
                animate={{
                  scale: [0.85, 1.25, 0.85],
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{ duration: 1.8, repeat: Infinity }}
              />
            </g>
          )}

          {/* Active Campaign connection portals */}
          {activeCampaignsCou > 0 && (
            <g opacity="0.6">
              {Array.from({ length: Math.min(activeCampaignsCou, 4) }).map((_, idx) => {
                const angle = 45 + idx * 90;
                const x2 = cx + 68 * Math.cos((angle * Math.PI) / 180);
                const y2 = cy + 68 * Math.sin((angle * Math.PI) / 180);
                return (
                  <line 
                    key={`campaign-portal-${idx}`} 
                    x1={cx} y1={cy} x2={x2} y2={y2} 
                    stroke={colors.primary} 
                    strokeWidth="1" 
                    strokeDasharray="2 3" 
                  />
                );
              })}
            </g>
          )}

          {/* Streak ignition aura */}
          {streak >= 3 && (
            <circle cx={cx} cy={cy} r="18" fill="none" stroke={colors.primary} strokeWidth="0.5" strokeOpacity="0.25" className="animate-ping" />
          )}

          {/* Highly momentous fracture/fissure overlay if a campaign has been failed */}
          {hasFailedCampaign && (
            <motion.path
              d={`M ${cx - 2.5},${cy - 26} L ${cx + 4},${cy - 10} L ${cx - 5},${cy + 5} L ${cx + 5},${cy + 22} L ${cx - 4},${cy + 31}`}
              fill="none"
              stroke="#ef4444"
              strokeWidth="1.25"
              strokeOpacity="0.85"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="filter drop-shadow-[0_0_2px_#ef4444]"
              animate={{
                opacity: [0.6, 1, 0.7, 1, 0.6],
                strokeWidth: [1, 1.4, 1.15, 1.4, 1]
              }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
          )}
        </g>
      </svg>
    </div>
  );
};
