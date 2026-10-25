/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Eye of Agamotto - Cosmic Mountain Celestial Banner
 */

import React from 'react';
import { Sparkles, Compass } from 'lucide-react';

interface MountainBannerProps {
  greeting: string;
  dateStr: string;
  focusQuote?: string;
  completedTasksCount: number;
  totalTasksCount: number;
  onQuickAction?: () => void;
}

export const MountainBanner: React.FC<MountainBannerProps> = ({
  greeting,
  dateStr,
  focusQuote = 'Master the present moment to bend future reality.',
  completedTasksCount,
  totalTasksCount,
  onQuickAction,
}) => {
  const completionPercentage = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-card transition-colors duration-200">
      {/* Background SVG Mountain Silhouettes & Celestial Nebula */}
      <div className="absolute inset-0 pointer-events-none select-none opacity-30 dark:opacity-40">
        <svg
          viewBox="0 0 1200 320"
          preserveAspectRatio="none"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle starry specks */}
          <circle cx="120" cy="40" r="1.2" fill="#F5F3FF" opacity="0.6" />
          <circle cx="280" cy="70" r="1.5" fill="#22D3EE" opacity="0.7" />
          <circle cx="450" cy="30" r="1" fill="#F5F3FF" opacity="0.5" />
          <circle cx="620" cy="85" r="1.2" fill="#C084FC" opacity="0.6" />
          <circle cx="720" cy="55" r="1.6" fill="#8B5CF6" opacity="0.8" />
          <circle cx="910" cy="35" r="1.2" fill="#22D3EE" opacity="0.7" />
          <circle cx="1060" cy="80" r="1.5" fill="#A78BFA" opacity="0.6" />

          {/* Distant Celestial Peak Range */}
          <path
            d="M0 240 L160 140 L340 220 L520 110 L680 190 L880 90 L1040 180 L1200 120 L1200 320 L0 320 Z"
            fill="url(#cosmicDistantPeaks)"
            opacity="0.6"
          />

          {/* Midground Mountain Ridges */}
          <path
            d="M0 260 L140 190 L260 230 L410 160 L580 240 L760 140 L930 220 L1080 150 L1200 230 L1200 320 L0 320 Z"
            fill="url(#cosmicMidPeaks)"
            opacity="0.8"
          />

          {/* Foreground Celestial Mist Layer */}
          <path
            d="M0 280 C300 240, 600 300, 900 250 C1050 225, 1150 270, 1200 260 L1200 320 L0 320 Z"
            fill="url(#cosmicMistGradient)"
          />

          <defs>
            <linearGradient id="cosmicDistantPeaks" x1="600" y1="90" x2="600" y2="320" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#37305C" />
              <stop offset="100%" stopColor="#12112B" />
            </linearGradient>
            <linearGradient id="cosmicMidPeaks" x1="600" y1="140" x2="600" y2="320" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#2E1065" />
              <stop offset="100%" stopColor="#0C0B20" />
            </linearGradient>
            <linearGradient id="cosmicMistGradient" x1="0" y1="260" x2="1200" y2="320" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.20" />
              <stop offset="50%" stopColor="#22D3EE" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0.25" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Atmospheric Cosmic Radial Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-48 bg-[var(--brand-primary)]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 px-6 py-6 md:px-8 md:py-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--brand-cyan)]">
            <Compass className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
            <span>Eye of Agamotto · Personal OS</span>
            <span aria-hidden="true" className="text-[var(--text-disabled)]">·</span>
            <span className="text-[var(--text-muted)] tabular-nums font-mono">{dateStr}</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            {greeting}
          </h1>

          <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-xl">
            {focusQuote}
          </p>
        </div>

        {/* Quick KPI & Progress Anchor */}
        <div className="flex items-center gap-4 shrink-0 bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] rounded-xl p-3.5 shadow-card transition-colors duration-200">
          <div className="flex flex-col">
            <span className="text-xs text-[var(--text-muted)] font-medium">Today's Focus</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold text-[var(--text-primary)] font-mono tabular-nums">{completedTasksCount}</span>
              <span className="text-xs text-[var(--text-muted)] font-mono">/ {totalTasksCount} tasks</span>
            </div>
            <div className="w-28 h-1.5 bg-[var(--bg-surface)] rounded-full overflow-hidden mt-1.5 border border-[var(--border-subtle)]">
              <div
                className="h-full bg-gradient-to-r from-[var(--brand-indigo)] via-[var(--brand-primary)] to-[var(--brand-cyan)] rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, completionPercentage)}%` }}
              />
            </div>
          </div>

          {onQuickAction && (
            <button
              onClick={onQuickAction}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] rounded-lg shadow-sm transition-all whitespace-nowrap active:scale-95 focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] glow-purple"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Quick Capture</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
