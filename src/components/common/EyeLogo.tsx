/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Eye of Agamotto - Cosmic Purple Eye Emblem
 */

import React from 'react';

interface EyeLogoProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export const EyeLogo: React.FC<EyeLogoProps> = ({ size = 28, className = '', animate = false }) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
      title="Eye of Agamotto"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_14px_rgba(139,92,246,0.45)]"
      >
        {/* Outer Amulet Relic Ring */}
        <circle
          cx="50"
          cy="50"
          r="46"
          stroke="url(#cosmicAmuletViolet)"
          strokeWidth="3.5"
          className="opacity-90"
        />

        {/* Outer Mystical Tick Marks / Cardinal Nodes */}
        <line x1="50" y1="2" x2="50" y2="8" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="50" y1="92" x2="50" y2="98" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="2" y1="50" x2="8" y2="50" stroke="#22D3EE" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="92" y1="50" x2="98" y2="50" stroke="#22D3EE" strokeWidth="2.5" strokeLinecap="round" />

        {/* Concentric Runic Lattice Ring */}
        <circle
          cx="50"
          cy="50"
          r="38"
          stroke="#8B5CF6"
          strokeWidth="1.2"
          strokeDasharray="4 3"
          className={animate ? 'animate-spin' : ''}
          style={{ transformOrigin: '50% 50%', animationDuration: '30s' }}
        />

        {/* Vesica Piscis (The Eye Contours) */}
        <path
          d="M 12 50 C 26 26, 74 26, 88 50 C 74 74, 26 74, 12 50 Z"
          stroke="url(#cosmicContourCyan)"
          strokeWidth="2.5"
          fill="url(#eyeInteriorVoid)"
        />

        {/* Inner Aperture Blades */}
        <circle cx="50" cy="50" r="22" stroke="#A78BFA" strokeWidth="1.8" />

        {/* Cosmic Time Core Glow */}
        <circle
          cx="50"
          cy="50"
          r="14"
          fill="url(#cosmicCoreGlow)"
        />

        {/* Radiant Pupil Aperture */}
        <ellipse cx="50" cy="50" rx="4.5" ry="11" fill="#F5F3FF" className="opacity-95" />
        <circle cx="50" cy="50" r="2.2" fill="#1E1B4B" />

        {/* Gradient Defs */}
        <defs>
          <linearGradient id="cosmicAmuletViolet" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
          <linearGradient id="cosmicContourCyan" x1="12" y1="50" x2="88" y2="50" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="50%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
          <radialGradient id="eyeInteriorVoid" cx="50" cy="50" r="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E1B4B" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0C0B20" stopOpacity="0.95" />
          </radialGradient>
          <radialGradient id="cosmicCoreGlow" cx="50" cy="50" r="14" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="45%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#312E81" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
};
