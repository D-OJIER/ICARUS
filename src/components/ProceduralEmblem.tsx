/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

interface ProceduralEmblemProps {
  name: string;
  id: string;
  createdAt: string;
  difficulty: string;
  size?: number;
  pulseEnabled?: boolean;
}

export const ProceduralEmblem: React.FC<ProceduralEmblemProps> = ({
  name,
  id,
  createdAt,
  difficulty,
  size = 64,
  pulseEnabled = true,
}) => {
  // Deterministic seed generation function
  const getStringSeed = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const seed = getStringSeed(name + id + createdAt + difficulty);

  // Derive parameters from seed
  const sides = (seed % 6) + 3; // 3 (triangle) to 8 (octagon)
  const rotationDirection = seed % 2 === 0 ? 1 : -1;
  const rotationSpeed = (seed % 15) + 12; // 12s to 27s complete cycle
  const innerSides = ((seed >> 2) % 4) + 3; // Inner shape sides
  const orbitsCount = (seed % 5) + 2; // 2 to 6 orbiting nodes
  const outerSpikesCount = ((seed >> 4) % 8) + 6; // 6 to 13 external spikes
  const innerRingType = seed % 3; // 0: plain, 1: dashed, 2: double
  
  // Custom colors matching gothic palette based on difficulty
  let primaryColor = '#c89e5c'; // Gothic gold
  let glowColor = 'rgba(200, 158, 146, 0.4)';
  if (difficulty === 'Mortal Penance') {
    primaryColor = '#dc2626'; // Gothic blood red
    glowColor = 'rgba(220, 38, 38, 0.4)';
  } else if (difficulty === 'Sinuous Vow') {
    primaryColor = '#6e8fa8'; // Gothic sky blue
    glowColor = 'rgba(110, 143, 168, 0.4)';
  }

  // Draw regular polygon coordinates
  const getPolygonPoints = (numSides: number, radius: number): string => {
    const points: string[] = [];
    for (let i = 0; i < numSides; i++) {
      const angle = (i * 2 * Math.PI) / numSides - Math.PI / 2;
      const x = 50 + radius * Math.cos(angle);
      const y = 50 + radius * Math.sin(angle);
      points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    }
    return points.join(' ');
  };

  // Outer gears/spikes paths
  const getOuterSpikes = (count: number, innerR: number, outerR: number): string => {
    const points: string[] = [];
    for (let i = 0; i < count * 2; i++) {
      const isOuter = i % 2 === 0;
      const r = isOuter ? outerR : innerR;
      const angle = (i * Math.PI) / count - Math.PI / 2;
      const x = 50 + r * Math.cos(angle);
      const y = 50 + r * Math.sin(angle);
      points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    }
    return points.join(' ') + ' z';
  };

  return (
    <div 
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full overflow-visible drop-shadow-[0_0_8px_var(--glow)]" 
        style={{ '--glow': glowColor } as React.CSSProperties}
      >
        {/* Outer glowing protective boundary orb */}
        <circle 
          cx="50" 
          cy="50" 
          r="48" 
          fill="none" 
          stroke={primaryColor} 
          strokeWidth="0.5" 
          strokeOpacity="0.15" 
        />

        {/* 1. Procedural outermost spikes or runic gear rings (Rotating) */}
        <motion.polygon
          points={getOuterSpikes(outerSpikesCount, 40, 45)}
          fill="none"
          stroke={primaryColor}
          strokeWidth="0.75"
          strokeOpacity="0.3"
          animate={{ rotate: rotationDirection * 360 }}
          transition={{
            repeat: Infinity,
            duration: rotationSpeed * 1.5,
            ease: 'linear',
          }}
          style={{ transformOrigin: '50px 50px' }}
        />

        {/* 2. Deterministic Main Polygon (Counter-rotating) */}
        <motion.polygon
          points={getPolygonPoints(sides, 35)}
          fill="none"
          stroke={primaryColor}
          strokeWidth="1.5"
          strokeOpacity="0.85"
          animate={{ rotate: -rotationDirection * 360 }}
          transition={{
            repeat: Infinity,
            duration: rotationSpeed,
            ease: 'linear',
          }}
          style={{ transformOrigin: '50px 50px' }}
        />

        {/* 3. Outer Ring Details */}
        <circle 
          cx="50" 
          cy="50" 
          r="38" 
          fill="none" 
          stroke={primaryColor} 
          strokeWidth="0.75" 
          strokeOpacity="0.5"
          strokeDasharray={innerRingType === 1 ? '3 3' : innerRingType === 2 ? '12 3 3 3' : undefined} 
        />

        {/* 4. Internal Deterministic Shape (Polygonal / Triangular) */}
        <motion.polygon
          points={getPolygonPoints(innerSides, 21)}
          fill="none"
          stroke={primaryColor}
          strokeWidth="1"
          strokeOpacity="0.7"
          animate={{ rotate: rotationDirection * 360 }}
          transition={{
            repeat: Infinity,
            duration: rotationSpeed * 0.7,
            ease: 'linear',
          }}
          style={{ transformOrigin: '50px 50px' }}
        />

        {/* 5. Direct Inner core Pulsing runetime circle */}
        <motion.circle
          cx="50"
          cy="50"
          r="10"
          fill="none"
          stroke={primaryColor}
          strokeWidth="1.5"
          animate={pulseEnabled ? { 
            scale: [1, 1.15, 1],
            strokeOpacity: [0.6, 1, 0.6],
            fill: [`${primaryColor}10`, `${primaryColor}25`, `${primaryColor}10`] 
          } : {}}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ transformOrigin: '50px 50px' }}
        />

        {/* 6. Orbital runic vertices circulating around outer loops */}
        {Array.from({ length: orbitsCount }).map((_, index) => {
          const orbitAngleOffset = (index * 2 * Math.PI) / orbitsCount;
          return (
            <motion.circle
              key={index}
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="none"
              animate={{ rotate: rotationDirection * 360 }}
              transition={{
                repeat: Infinity,
                duration: rotationSpeed * 1.2,
                ease: 'linear',
              }}
              style={{ transformOrigin: '50px 50px' }}
            >
              {/* Actual orbital bead render anchor point */}
              <circle
                cx={(50 + 40 * Math.cos(orbitAngleOffset)).toFixed(2)}
                cy={(50 + 40 * Math.sin(orbitAngleOffset)).toFixed(2)}
                r="3"
                fill={primaryColor}
                opacity="0.9"
              />
            </motion.circle>
          );
        })}
      </svg>
    </div>
  );
};
