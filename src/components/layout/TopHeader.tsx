/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Eye of Agamotto - Cosmic Purple Top Navigation Header
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Search,
  Plus,
  Clock,
  Cloud,
  CloudOff,
  LogOut,
  Loader2,
  AlertCircle,
  X,
  ShieldCheck,
  Bell,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import { NavigationItem } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface TopHeaderProps {
  currentNav: NavigationItem;
  onOpenMobileSidebar: () => void;
  onOpenQuickCapture: () => void;
  onOpenSearch: () => void;
  onSelectNav: (item: NavigationItem) => void;
  onOpenNotificationCenter?: () => void;
  remindersCount?: number;
  hasOverdue?: boolean;
}

const NAV_TITLES: Record<NavigationItem, string> = {
  home: 'Dashboard & Daily Orbit',
  tasks: 'Task Management',
  calendar: 'Calendar & Time Blocks',
  learning: 'Curriculum & Roadmaps',
  projects: 'Project Architecture',
  career: 'Career & Opportunities',
  knowledge: 'Knowledge & Notes',
  assistant: 'Agamotto Intelligence',
  goals: 'Strategic Milestones',
  settings: 'System & Preferences',
};

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentNav,
  onOpenMobileSidebar,
  onOpenQuickCapture,
  onOpenSearch,
  onSelectNav,
  onOpenNotificationCenter,
  remindersCount = 0,
  hasOverdue = false,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { theme, resolvedTheme, setTheme } = useTheme();

  const {
    user,
    loading: authLoading,
    authError,
    isSyncing,
    isCloudConnected,
    signInWithGoogle,
    signOutUser,
    clearAuthError,
  } = useAuth();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick theme cycle
  const handleCycleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-[var(--bg-header)]/95 backdrop-blur-md border-b border-[var(--border-default)] px-4 md:px-8 flex items-center justify-between gap-4 transition-colors duration-200">
      {/* Zone 1: Mobile Hamburger & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs md:text-sm text-[var(--text-muted)] truncate">
          <button
            onClick={() => onSelectNav('home')}
            className="hover:text-[var(--brand-secondary)] transition-colors whitespace-nowrap"
          >
            Eye of Agamotto
          </button>
          <span aria-hidden="true" className="text-[var(--text-disabled)]">/</span>
          <span className="font-semibold text-[var(--text-primary)] truncate">
            {NAV_TITLES[currentNav]}
          </span>
        </div>
      </div>

      {/* Zone 2: Search shortcut, Theme switcher & Live Clock */}
      <div className="flex items-center gap-3">
        {/* Search trigger */}
        <button
          onClick={onOpenSearch}
          className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--brand-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
          title="Search anything (Cmd+K)"
        >
          <Search className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span>Search tasks, notes, roadmap...</span>
          <kbd className="hidden lg:inline-block font-mono text-[10px] bg-[var(--bg-surface-elevated)] px-1.5 py-0.5 rounded text-[var(--text-muted)] border border-[var(--border-default)]">
            ⌘K
          </kbd>
        </button>

        {/* Theme Switcher Button */}
        <button
          onClick={handleCycleTheme}
          className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
          title={`Theme: ${theme.toUpperCase()} (Click to toggle)`}
          aria-label="Toggle theme mode"
        >
          {theme === 'system' ? (
            <Laptop className="w-4 h-4 text-[var(--brand-cyan)]" />
          ) : resolvedTheme === 'dark' ? (
            <Moon className="w-4 h-4 text-[var(--brand-secondary)]" />
          ) : (
            <Sun className="w-4 h-4 text-[var(--status-warning)]" />
          )}
        </button>

        {/* Live Clock */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] text-[11px] font-mono tabular-nums text-[var(--text-secondary)]">
          <Clock className="w-3 h-3 text-[var(--brand-cyan)]" />
          <span>{timeStr || '00:00:00'}</span>
        </div>

        {/* Mobile search icon button */}
        <button
          onClick={onOpenSearch}
          className="sm:hidden p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Authentication & Cloud Sync Section */}
        {authLoading ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-muted)] text-xs">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--brand-primary)]" />
            <span className="hidden sm:inline">Connecting...</span>
          </div>
        ) : user ? (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--brand-primary)] transition-all text-xs text-[var(--text-secondary)] shadow-sm"
              title={`Signed in as ${user.email}`}
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-5 h-5 rounded-full object-cover ring-1 ring-[var(--brand-primary)]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-[var(--brand-primary)] text-white font-bold text-[10px] flex items-center justify-center">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}

              <div className="hidden sm:flex items-center gap-1.5">
                <span className="max-w-[90px] truncate font-medium text-[var(--text-primary)]">
                  {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
                </span>
                {isSyncing ? (
                  <span title="Syncing with Cloud Firestore..." className="inline-flex items-center gap-1 text-[10px] font-mono text-[var(--brand-cyan)] bg-[var(--bg-surface-elevated)] border border-[var(--brand-cyan)]/40 px-1.5 py-0.5 rounded">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    <span>Syncing</span>
                  </span>
                ) : isCloudConnected ? (
                  <span title="Cloud connected & synchronized with Firestore" className="inline-flex items-center gap-1 text-[10px] font-mono text-[var(--status-success)] bg-[var(--status-success)]/10 border border-[var(--status-success)]/30 px-1.5 py-0.5 rounded">
                    <Cloud className="w-2.5 h-2.5" />
                    <span>Cloud Sync</span>
                  </span>
                ) : (
                  <span title="Operating in local cache mode. Data is saved locally and will synchronize once cloud connection is established." className="inline-flex items-center gap-1 text-[10px] font-mono text-[var(--status-warning)] bg-[var(--status-warning)]/10 border border-[var(--status-warning)]/30 px-1.5 py-0.5 rounded">
                    <CloudOff className="w-2.5 h-2.5" />
                    <span>Local Cache</span>
                  </span>
                )}
              </div>
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] shadow-elevated p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-[var(--border-subtle)]">
                  <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                    {user.displayName || 'Google Account'}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] truncate">{user.email}</p>
                  {isCloudConnected ? (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[var(--status-success)] font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Firestore Cloud Sync Active</span>
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[var(--status-warning)] font-medium">
                      <CloudOff className="w-3.5 h-3.5" />
                      <span>Local Cache Active · Cloud Offline</span>
                    </div>
                  )}
                </div>

                {/* Theme Selector Section inside Dropdown */}
                <div className="px-3 py-2 border-b border-[var(--border-subtle)] space-y-1.5">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-muted)]">Interface Theme</span>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => setTheme('dark')}
                      className={`px-2 py-1 rounded text-[11px] font-medium flex items-center justify-center gap-1 transition-colors ${
                        theme === 'dark'
                          ? 'bg-[var(--brand-primary)] text-white shadow-sm'
                          : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <Moon className="w-3 h-3" />
                      <span>Dark</span>
                    </button>
                    <button
                      onClick={() => setTheme('light')}
                      className={`px-2 py-1 rounded text-[11px] font-medium flex items-center justify-center gap-1 transition-colors ${
                        theme === 'light'
                          ? 'bg-[var(--brand-primary)] text-white shadow-sm'
                          : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <Sun className="w-3 h-3" />
                      <span>Light</span>
                    </button>
                    <button
                      onClick={() => setTheme('system')}
                      className={`px-2 py-1 rounded text-[11px] font-medium flex items-center justify-center gap-1 transition-colors ${
                        theme === 'system'
                          ? 'bg-[var(--brand-primary)] text-white shadow-sm'
                          : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <Laptop className="w-3 h-3" />
                      <span>Auto</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 space-y-1">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onSelectNav('settings');
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    Cloud & Account Settings
                  </button>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      signOutUser();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[var(--status-danger)] hover:bg-[var(--status-danger)]/10 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => signInWithGoogle()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--brand-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium transition-all shadow-sm active:scale-95"
            title="Sign in with your Google account to sync across devices"
          >
            {/* Google Icon SVG */}
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="hidden sm:inline">Sign in with Google</span>
            <span className="sm:hidden">Sign In</span>
          </button>
        )}

        {/* Zone 3: Reminders Notification Bell */}
        {onOpenNotificationCenter && (
          <button
            onClick={onOpenNotificationCenter}
            className={`relative p-2 rounded-lg border transition-all ${
              hasOverdue
                ? 'bg-[var(--status-danger)]/15 border-[var(--status-danger)]/40 text-[var(--status-danger)] hover:bg-[var(--status-danger)]/25'
                : remindersCount > 0
                ? 'bg-[var(--status-warning)]/15 border-[var(--status-warning)]/40 text-[var(--status-warning)] hover:bg-[var(--status-warning)]/25'
                : 'bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
            }`}
            title={
              hasOverdue
                ? `${remindersCount} reminders (${remindersCount} overdue)`
                : remindersCount > 0
                ? `${remindersCount} active reminders`
                : 'Reminders & Notifications'
            }
            aria-label="Open Reminders"
          >
            <Bell className="w-4 h-4" />
            {remindersCount > 0 && (
              <span
                className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-mono font-bold flex items-center justify-center border ${
                  hasOverdue
                    ? 'bg-[var(--status-danger)] text-white border-[var(--status-danger)] animate-pulse'
                    : 'bg-[var(--status-warning)] text-slate-900 border-[var(--status-warning)]'
                }`}
              >
                {remindersCount > 99 ? '99+' : remindersCount}
              </span>
            )}
          </button>
        )}

        {/* Primary Action Quick Capture */}
        <button
          onClick={onOpenQuickCapture}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] rounded-lg shadow-sm transition-all whitespace-nowrap active:scale-95 focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] glow-purple"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Quick Capture</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* Auth Error Banner */}
      {authError && (
        <div className="fixed top-18 right-6 z-50 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-950/90 border border-red-500/50 text-xs text-red-200 shadow-xl backdrop-blur-md">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{authError}</span>
          <button
            onClick={clearAuthError}
            className="p-1 text-red-300 hover:text-white rounded"
            aria-label="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </header>
  );
};
