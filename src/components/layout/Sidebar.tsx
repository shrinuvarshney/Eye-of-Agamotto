/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Eye of Agamotto - Cosmic Purple Sidebar Navigation
 */

import React from 'react';
import {
  Home,
  CheckSquare,
  Calendar as CalendarIcon,
  GraduationCap,
  FolderGit2,
  Briefcase,
  BookOpen,
  Sparkles,
  Trophy,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Cloud,
} from 'lucide-react';
import { NavigationItem, UserProfile } from '../../types';
import { EyeLogo } from '../common/EyeLogo';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  currentNav: NavigationItem;
  onSelectNav: (item: NavigationItem) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  badgeCounts: {
    pendingTasks: number;
    activeRoadmaps: number;
    activeInterviews: number;
  };
  profile: UserProfile;
}

interface NavItemConfig {
  id: NavigationItem;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeKey?: 'pendingTasks' | 'activeRoadmaps' | 'activeInterviews';
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'tasks', label: 'My Tasks', icon: CheckSquare, badgeKey: 'pendingTasks' },
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
  { id: 'learning', label: 'Learning', icon: GraduationCap, badgeKey: 'activeRoadmaps' },
  { id: 'projects', label: 'Projects', icon: FolderGit2 },
  { id: 'career', label: 'Career', icon: Briefcase, badgeKey: 'activeInterviews' },
  { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
  { id: 'assistant', label: 'AI Assistant', icon: Sparkles },
  { id: 'goals', label: 'Goals', icon: Trophy },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentNav,
  onSelectNav,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  badgeCounts,
  profile,
}) => {
  const { user, isCloudConnected } = useAuth();
  const displayName = user?.displayName || profile.name;
  const userInitials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const content = (
    <div className="flex flex-col h-full bg-[var(--bg-sidebar)] border-r border-[var(--border-default)] text-[var(--text-secondary)] select-none transition-colors duration-200">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-[var(--border-subtle)]">
        <div
          onClick={() => {
            onSelectNav('home');
            if (isMobileOpen) onCloseMobile();
          }}
          className="flex items-center gap-3 cursor-pointer group overflow-hidden"
        >
          <div className="relative flex items-center justify-center">
            {/* Soft subtle purple backdrop glow */}
            <div className="absolute inset-0 bg-[var(--brand-primary)]/20 rounded-full blur-md -z-10 pointer-events-none" />
            <EyeLogo size={30} animate={false} />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm text-[var(--text-primary)] tracking-tight truncate group-hover:text-[var(--brand-secondary)] transition-colors">
                Eye of Agamotto
              </span>
              <span className="text-[10px] text-[var(--brand-cyan)] font-medium tracking-tight truncate">
                Focus Today. Build Tomorrow.
              </span>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Desktop collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors focus-visible:ring-1 focus-visible:ring-[var(--border-focus)]"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto" aria-label="Main Navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentNav === item.id;
          const badgeValue = item.badgeKey ? badgeCounts[item.badgeKey] : 0;

          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectNav(item.id);
                if (isMobileOpen) onCloseMobile();
              }}
              title={isCollapsed ? `${item.label}${badgeValue > 0 ? ` (${badgeValue})` : ''}` : undefined}
              aria-current={isActive ? 'page' : undefined}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 min-h-[40px] rounded-xl text-xs font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] ${
                isActive
                  ? 'bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] border border-[var(--brand-primary)] font-semibold shadow-sm dark:shadow-[0_0_16px_rgba(139,92,246,0.18)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] border border-transparent'
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
            >
              {/* Active Left Indicator Bar */}
              {isActive && (
                <span
                  className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[var(--brand-primary)]"
                  aria-hidden="true"
                />
              )}

              <div className="relative shrink-0 flex items-center justify-center">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-[var(--brand-primary)] dark:text-[var(--brand-secondary)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]'
                  }`}
                />
                {/* Collapsed Badge Dot Indicator */}
                {isCollapsed && badgeValue > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[var(--brand-primary)] border border-[var(--bg-sidebar)]"
                    title={`${badgeValue} pending`}
                  />
                )}
              </div>

              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between text-left truncate">
                  <span className="truncate">{item.label}</span>
                  {badgeValue > 0 && (
                    <span
                      className={`ml-2 font-mono text-[10px] tabular-nums px-1.5 py-0.5 rounded-md ${
                        isActive
                          ? 'bg-[var(--brand-primary)]/20 text-[var(--brand-secondary)] font-semibold'
                          : 'bg-[var(--bg-surface)] text-[var(--text-muted)]'
                      }`}
                    >
                      {badgeValue}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-[var(--border-subtle)]">
        <div
          onClick={() => {
            onSelectNav('settings');
            if (isMobileOpen) onCloseMobile();
          }}
          className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-[var(--bg-surface-hover)] transition-colors ${
            isCollapsed ? 'justify-center p-1.5' : ''
          }`}
          title="Account & Settings"
        >
          <div className="relative shrink-0">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={displayName}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-[var(--brand-primary)]"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--brand-indigo)] to-[var(--brand-primary)] text-white font-bold text-xs flex items-center justify-center shadow-inner">
                {userInitials || 'EA'}
              </div>
            )}
            {user && (
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-[var(--bg-sidebar)] ${
                  isCloudConnected ? 'bg-[var(--status-success)]' : 'bg-[var(--status-warning)]'
                }`}
                title={isCloudConnected ? 'Cloud Synced' : 'Local Cache Active'}
              />
            )}
          </div>

          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                {displayName}
              </span>
              <span className="text-[11px] text-[var(--text-muted)] truncate flex items-center gap-1">
                {user ? (
                  isCloudConnected ? (
                    <>
                      <Cloud className="w-3 h-3 text-[var(--status-success)] shrink-0" />
                      <span className="text-[var(--status-success)]">Cloud Synced</span>
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-warning)] shrink-0" />
                      <span className="text-[var(--status-warning)]">Local Cache</span>
                    </>
                  )
                ) : (
                  profile.title
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:block shrink-0 transition-all duration-300 z-30 h-screen sticky top-0 ${
          isCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {content}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-elevated z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
