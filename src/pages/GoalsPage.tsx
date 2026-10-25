/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Plus,
  Target,
  CheckCircle2,
  Circle,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Goal } from '../types';
import { storageService } from '../services/storageService';

interface GoalsPageProps {
  goals: Goal[];
  onGoalsChange: () => void;
  onOpenQuickCapture: () => void;
}

export const GoalsPage: React.FC<GoalsPageProps> = ({
  goals,
  onGoalsChange,
  onOpenQuickCapture,
}) => {
  const [timeframeFilter, setTimeframeFilter] = useState<'all' | 'annual' | 'quarterly' | 'monthly'>('all');

  const filteredGoals = useMemo(() => {
    return goals.filter((g) => {
      if (timeframeFilter !== 'all' && g.timeframe !== timeframeFilter) return false;
      return true;
    });
  }, [goals, timeframeFilter]);

  const handleToggleKeyResult = (goalId: string, krId: string) => {
    storageService.toggleGoalKeyResult(goalId, krId);
    onGoalsChange();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#F1F5F9] tracking-tight">
            Strategic Objectives & OKRs
          </h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Quarterly and annual key results driving learning mastery, career jumps, and systems engineering
          </p>
        </div>

        <button
          onClick={onOpenQuickCapture}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#080C12] bg-[#10B981] hover:bg-[#059669] rounded-lg shadow-sm transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-[#0A1018] border border-[#263548] rounded-xl p-1.5 w-fit">
        {(['all', 'quarterly', 'annual', 'monthly'] as const).map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframeFilter(tf)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
              timeframeFilter === tf
                ? 'bg-[#082B2A] text-[#2DD4BF] border border-[#0D9488] font-semibold'
                : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#172231]'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <div className="rounded-xl bg-[#101722] border border-[#263548] p-12 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[#0A1018] border border-[#263548] flex items-center justify-center text-[#FBBF24]">
            <Trophy className="w-6 h-6 text-[#FBBF24]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-[#F1F5F9]">
              {timeframeFilter !== 'all' ? `No ${timeframeFilter} goals set` : 'No goals created yet'}
            </h3>
            <p className="text-xs text-[#94A3B8] max-w-sm">
              {timeframeFilter !== 'all'
                ? `Switch to "all" to view objectives across all time horizons.`
                : 'Define quarterly milestones, exam rank goals, or career benchmarks with concrete key results.'}
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            {timeframeFilter !== 'all' && (
              <button
                onClick={() => setTimeframeFilter('all')}
                className="px-3 py-1.5 rounded-lg bg-[#172231] text-xs text-[#CBD5E1] hover:text-[#F1F5F9] transition-colors"
              >
                Show All Horizons
              </button>
            )}
            <button
              onClick={onOpenQuickCapture}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#080C12] bg-[#10B981] hover:bg-[#059669] rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Goal</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGoals.map((g) => {
            const totalKRs = g.keyResults.length;
            const completedKRs = g.keyResults.filter((kr) => kr.completed).length;
            const progressPercent = totalKRs > 0 ? Math.round((completedKRs / totalKRs) * 100) : 0;

            return (
              <div
                key={g.id}
                className="rounded-xl bg-[#101722] border border-[#263548] p-5 flex flex-col justify-between space-y-4 shadow-sm hover:border-[#2DD4BF]/40 transition-all"
              >
                <div className="space-y-3">
                  {/* Timeframe & Category */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#082B2A] text-[#2DD4BF] border border-[#0D9488] font-semibold">
                      {g.timeframe}
                    </span>
                    <span className="text-[#94A3B8] capitalize font-medium">{g.category}</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold text-[#F1F5F9] leading-snug">{g.title}</h3>

                  {g.notes && (
                    <p className="text-xs text-[#94A3B8] leading-relaxed">{g.notes}</p>
                  )}

                  {/* Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#94A3B8]">Key Results</span>
                      <span className="text-[#10B981] font-bold tabular-nums">
                        {progressPercent}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0A1018] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#10B981] transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Key Results Checklist */}
                  <div className="space-y-2 pt-2 border-t border-[#1B2838]">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] block">
                      Key Results Checklist
                    </span>
                    <div className="space-y-2">
                      {g.keyResults.map((kr) => (
                        <div
                          key={kr.id}
                          onClick={() => handleToggleKeyResult(g.id, kr.id)}
                          className="flex items-start gap-2.5 p-2 rounded-lg bg-[#0A1018] hover:bg-[#172231] border border-[#263548] cursor-pointer text-xs group transition-colors"
                        >
                          {kr.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-[#10B981] mt-0.5 shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-[#64748B] group-hover:text-[#94A3B8] mt-0.5 shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <span
                              className={`leading-tight block ${
                                kr.completed ? 'line-through text-[#64748B]' : 'text-[#F1F5F9]'
                              }`}
                            >
                              {kr.title}
                            </span>
                            {kr.targetValue && (
                              <span className="text-[10px] font-mono text-[#94A3B8] mt-0.5 block">
                                Metric: {kr.currentValue} / {kr.targetValue} {kr.unit}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Due Date Footer */}
                <div className="pt-3 border-t border-[#1B2838] flex items-center justify-between text-xs text-[#94A3B8] font-mono">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
                    Target: {g.dueDate}
                  </span>
                  <span className="text-[10px] text-[#2DD4BF]">
                    {completedKRs}/{totalKRs} met
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
