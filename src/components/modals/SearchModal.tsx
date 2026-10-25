/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Eye of Agamotto - Cosmic Purple Search Modal
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, CheckSquare, BookOpen, GraduationCap, FolderGit2, Briefcase } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { NavigationItem } from '../../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (nav: NavigationItem) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');

  // Handle escape and keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const tasks = storageService
      .getTasks()
      .filter((t) => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || t.tags.some(tag => tag.toLowerCase().includes(q)))
      .map((t) => ({
        type: 'task' as const,
        nav: 'tasks' as NavigationItem,
        title: t.title,
        subtitle: `${t.priority} priority · due ${t.dueDate}`,
        icon: CheckSquare,
      }));

    const roadmaps = storageService.getRoadmaps().flatMap((r) => {
      const matchedTopics: { type: 'learning'; nav: NavigationItem; title: string; subtitle: string; icon: any }[] = [];
      r.modules.forEach((m) => {
        m.topics.forEach((top) => {
          if (top.title.toLowerCase().includes(q) || top.description.toLowerCase().includes(q)) {
            matchedTopics.push({
              type: 'learning',
              nav: 'learning',
              title: top.title,
              subtitle: `${r.title} · ${m.title}`,
              icon: GraduationCap,
            });
          }
        });
      });
      return matchedTopics;
    });

    const projects = storageService
      .getProjects()
      .filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.tags.some(tag => tag.toLowerCase().includes(q)))
      .map((p) => ({
        type: 'project' as const,
        nav: 'projects' as NavigationItem,
        title: p.name,
        subtitle: `${p.category} · ${p.progress}% completed`,
        icon: FolderGit2,
      }));

    const notes = storageService
      .getNotes()
      .filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags.some(tag => tag.toLowerCase().includes(q)))
      .map((n) => ({
        type: 'note' as const,
        nav: 'knowledge' as NavigationItem,
        title: n.title,
        subtitle: `Note · updated ${new Date(n.updatedAt).toLocaleDateString()}`,
        icon: BookOpen,
      }));

    const jobs = storageService
      .getJobApplications()
      .filter((j) => j.company.toLowerCase().includes(q) || j.role.toLowerCase().includes(q) || j.location.toLowerCase().includes(q))
      .map((j) => ({
        type: 'career' as const,
        nav: 'career' as NavigationItem,
        title: `${j.company} - ${j.role}`,
        subtitle: `Status: ${j.status} · ${j.location}`,
        icon: Briefcase,
      }));

    return [...tasks, ...roadmaps, ...projects, ...notes, ...jobs].slice(0, 12);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] rounded-2xl shadow-elevated overflow-hidden flex flex-col transition-colors duration-200">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-header)]">
          <Search className="w-4 h-4 text-[var(--brand-primary)] shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search tasks, syllabus, projects, notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-disabled)] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
            aria-label="Close search modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {query.trim() === '' ? (
            <div className="py-10 px-4 text-center text-xs text-[var(--text-muted)]">
              Search by typing keywords like <span className="text-[var(--brand-cyan)] font-medium">"Attention"</span>,{' '}
              <span className="text-[var(--brand-cyan)] font-medium">"Linear Algebra"</span>, or{' '}
              <span className="text-[var(--brand-cyan)] font-medium">"Anthropic"</span>.
            </div>
          ) : results.length === 0 ? (
            <div className="py-10 px-4 text-center text-xs text-[var(--text-muted)]">
              No matching records found for "{query}".
            </div>
          ) : (
            results.map((res, idx) => {
              const Icon = res.icon;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    onNavigate(res.nav);
                    onClose();
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-surface-hover)] cursor-pointer transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--brand-primary)] shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--brand-secondary)] transition-colors truncate">
                      {res.title}
                    </h4>
                    <p className="text-[11px] text-[var(--text-muted)] truncate">
                      {res.subtitle}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-disabled)] group-hover:text-[var(--brand-cyan)] transition-colors">
                    {res.type}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-[var(--bg-app)] border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>Navigation: Click to jump</span>
            <span>ESC to dismiss</span>
          </div>
          <span className="font-mono">{results.length} result(s)</span>
        </div>
      </div>
    </div>
  );
};
