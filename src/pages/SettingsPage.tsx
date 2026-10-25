/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  User as UserIcon,
  Shield,
  Download,
  Upload,
  RefreshCw,
  Check,
  CheckCircle2,
  AlertTriangle,
  Cloud,
  LogOut,
  Loader2,
  ShieldCheck,
  HardDrive,
  Moon,
  Sun,
  Laptop,
  Palette,
  Sparkles,
} from 'lucide-react';
import { UserProfile } from '../types';
import { storageService } from '../services/storageService';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface SettingsPageProps {
  profile: UserProfile;
  onProfileChange: (p: UserProfile) => void;
  onRefreshAllData: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  profile,
  onProfileChange,
  onRefreshAllData,
}) => {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [title, setTitle] = useState(profile.title);
  const [timezone, setTimezone] = useState(profile.timezone);
  const [dailyTarget, setDailyTarget] = useState(profile.dailyTargetTasks);
  const [accent, setAccent] = useState(profile.accentColor);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const { theme, resolvedTheme, setTheme } = useTheme();

  const {
    user,
    loading: authLoading,
    isSyncing,
    lastSyncedAt,
    signInWithGoogle,
    signOutUser,
    manualSync,
  } = useAuth();

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...profile,
      name,
      email,
      title,
      timezone,
      dailyTargetTasks: Number(dailyTarget),
      accentColor: accent,
    };
    storageService.saveUserProfile(updated);
    onProfileChange(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleExportData = () => {
    const jsonStr = storageService.exportAllDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `eye_of_agamotto_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setStatusMessage('Backup exported successfully.');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        const success = storageService.importAllDataJSON(content);
        if (success) {
          onRefreshAllData();
          setStatusMessage('Workspace restored from backup.');
        } else {
          setStatusMessage('Failed to parse backup JSON. Please check file format.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmReset = () => {
    storageService.resetAllDemoData();
    onRefreshAllData();
    setIsResetConfirmOpen(false);
    setStatusMessage('Demo data restored.');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Workspace Settings & System Preferences
        </h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Control your Cosmic Purple visual theme, Google authentication, and Cloud Firestore data synchronization
        </p>
      </div>

      {statusMessage && (
        <div
          className="p-3.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in"
          style={{
            backgroundColor: 'rgba(139, 92, 246, 0.12)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            color: 'var(--brand-secondary)',
          }}
        >
          <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Cosmic Purple Appearance & Theme Selector */}
      <div
        className="rounded-2xl p-6 space-y-5 shadow-card"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
        }}
      >
        <div
          className="flex items-center justify-between pb-4"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(139, 92, 246, 0.15)',
                color: 'var(--brand-primary)',
              }}
            >
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Appearance & Theme
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Choose between midnight cosmic dark mode, high-contrast crisp light mode, or system sync
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
            }}
          >
            <Sparkles className="w-3 h-3" style={{ color: 'var(--brand-cyan)' }} />
            <span>Active: {resolvedTheme === 'dark' ? 'Dark (#0A0A1A)' : 'Light (#F7F7FC)'}</span>
          </div>
        </div>

        {/* 3 Theme Options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Dark Mode */}
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border text-left transition-all relative cursor-pointer ${
              theme === 'dark'
                ? 'ring-2 ring-[var(--brand-primary)] shadow-lg'
                : 'hover:border-[var(--brand-primary)]'
            }`}
            style={{
              backgroundColor: '#0A0A1A',
              borderColor: theme === 'dark' ? 'var(--brand-primary)' : 'var(--border-default)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#191735] flex items-center justify-center text-[#A78BFA]">
                <Moon className="w-4 h-4" />
              </div>
              {theme === 'dark' && (
                <span className="w-5 h-5 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center text-[10px]">
                  ✓
                </span>
              )}
            </div>
            <div className="text-xs font-bold text-[#F5F3FF]">Cosmic Dark</div>
            <p className="text-[11px] text-[#A1A1AA] mt-0.5">
              Midnight indigo, violet surfaces & electric highlights
            </p>
            <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-[#272344]">
              <span className="w-3 h-3 rounded-full bg-[#0A0A1A] border border-[#37305C]" title="#0A0A1A" />
              <span className="w-3 h-3 rounded-full bg-[#12112B] border border-[#37305C]" title="#12112B" />
              <span className="w-3 h-3 rounded-full bg-[#8B5CF6]" title="#8B5CF6" />
              <span className="w-3 h-3 rounded-full bg-[#22D3EE]" title="#22D3EE" />
            </div>
          </button>

          {/* Light Mode */}
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border text-left transition-all relative cursor-pointer ${
              theme === 'light'
                ? 'ring-2 ring-[var(--brand-primary)] shadow-lg'
                : 'hover:border-[var(--brand-primary)]'
            }`}
            style={{
              backgroundColor: '#FFFFFF',
              borderColor: theme === 'light' ? 'var(--brand-primary)' : 'var(--border-default)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#F1EDFF] flex items-center justify-center text-[#6D28D9]">
                <Sun className="w-4 h-4" />
              </div>
              {theme === 'light' && (
                <span className="w-5 h-5 rounded-full bg-[#6D28D9] text-white flex items-center justify-center text-[10px]">
                  ✓
                </span>
              )}
            </div>
            <div className="text-xs font-bold text-[#18152E]">Cosmic Light</div>
            <p className="text-[11px] text-[#716B85] mt-0.5">
              Crisp light backdrop with royal violet & cyan accents
            </p>
            <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-[#EAE6F4]">
              <span className="w-3 h-3 rounded-full bg-[#F7F7FC] border border-[#DCD5EB]" title="#F7F7FC" />
              <span className="w-3 h-3 rounded-full bg-[#FFFFFF] border border-[#DCD5EB]" title="#FFFFFF" />
              <span className="w-3 h-3 rounded-full bg-[#6D28D9]" title="#6D28D9" />
              <span className="w-3 h-3 rounded-full bg-[#0E7490]" title="#0E7490" />
            </div>
          </button>

          {/* System Sync */}
          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`p-4 rounded-xl border text-left transition-all relative cursor-pointer ${
              theme === 'system'
                ? 'ring-2 ring-[var(--brand-primary)] shadow-lg'
                : 'hover:border-[var(--brand-primary)]'
            }`}
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderColor: theme === 'system' ? 'var(--brand-primary)' : 'var(--border-default)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: 'rgba(139, 92, 246, 0.15)',
                  color: 'var(--brand-primary)',
                }}
              >
                <Laptop className="w-4 h-4" />
              </div>
              {theme === 'system' && (
                <span
                  className="w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px]"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                  ✓
                </span>
              )}
            </div>
            <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
              System Auto
            </div>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Matches your operating system's color scheme seamlessly
            </p>
            <div
              className="flex items-center gap-1.5 mt-3 pt-2"
              style={{ borderTop: '1px solid var(--border-subtle)' }}
            >
              <span className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                Auto-switches with OS
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Cloud Firestore & Google Authentication Card */}
      <div
        className="rounded-2xl p-6 space-y-5 shadow-card"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
        }}
      >
        <div
          className="flex items-center justify-between pb-4"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(34, 211, 238, 0.15)',
                color: 'var(--brand-cyan)',
              }}
            >
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Cloud Firestore & Firebase Authentication
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Real-time multi-device cloud persistence with zero-trust security rules
              </p>
            </div>
          </div>
          {user ? (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono"
              style={{
                backgroundColor: 'rgba(52, 211, 153, 0.12)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                color: 'var(--status-success)',
              }}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Cloud Synced</span>
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono"
              style={{
                backgroundColor: 'rgba(251, 191, 36, 0.12)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                color: 'var(--status-warning)',
              }}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>Guest / Local Mode</span>
            </span>
          )}
        </div>

        {user ? (
          <div className="space-y-4">
            <div
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-default)',
              }}
            >
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-12 h-12 rounded-full object-cover ring-2"
                    style={{ ringColor: 'var(--brand-primary)' }}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full font-bold text-base flex items-center justify-center text-white"
                    style={{ backgroundColor: 'var(--brand-primary)' }}
                  >
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      {user.displayName || 'Authenticated User'}
                    </span>
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: 'rgba(139, 92, 246, 0.15)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--brand-secondary)',
                      }}
                    >
                      Google OAuth
                    </span>
                  </div>
                  <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {user.email}
                  </p>
                  <p className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--text-disabled)' }}>
                    UID: {user.uid}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => manualSync()}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                  title="Force a complete synchronization with Cloud Firestore"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`}
                    style={{ color: 'var(--brand-cyan)' }}
                  />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => signOutUser()}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  style={{
                    backgroundColor: 'rgba(251, 113, 133, 0.1)',
                    border: '1px solid rgba(251, 113, 133, 0.3)',
                    color: 'var(--status-danger)',
                  }}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            <div
              className="p-3.5 rounded-xl text-xs space-y-1"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
              }}
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Firestore Fortress:
                </span>
                <span className="font-mono" style={{ color: 'var(--brand-cyan)' }}>
                  /users/{user.uid}/*
                </span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Zero-trust Firestore security rules protect your data. Only this authenticated Google account can read or write documents. All workspace changes sync automatically.
              </p>
              {lastSyncedAt && (
                <p className="text-[10px] font-mono pt-1" style={{ color: 'var(--text-disabled)' }}>
                  Last cloud sync: {lastSyncedAt.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div
            className="p-5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-default)',
            }}
          >
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Sign In to Enable Cloud Sync
              </h3>
              <p className="text-xs max-w-md leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Sign in with your Google account. Your tasks, calendar events, roadmaps, and notes will sync securely to your private Firestore database.
              </p>
            </div>

            <button
              type="button"
              onClick={() => signInWithGoogle()}
              disabled={authLoading}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all shadow-sm active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
            >
              {authLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--brand-primary)' }} />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              <span>{authLoading ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Profile Form */}
      <div
        className="rounded-2xl p-6 space-y-6 shadow-card"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
        }}
      >
        <div
          className="flex items-center gap-2 pb-4"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <UserIcon className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            Profile Details
          </h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs focus:outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs focus:outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Engineering Title / Focus
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs focus:outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Timezone
              </label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs focus:outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Daily Task Target
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={dailyTarget}
                onChange={(e) => setDailyTarget(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl text-xs focus:outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Highlight Accent Color
              </label>
              <div className="flex items-center gap-2 mt-1">
                {(['purple', 'cyan', 'indigo', 'emerald'] as const).map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setAccent(col)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition-all cursor-pointer"
                    style={{
                      backgroundColor: accent === col ? 'rgba(139, 92, 246, 0.2)' : 'var(--bg-input)',
                      borderColor: accent === col ? 'var(--brand-primary)' : 'var(--border-default)',
                      color: accent === col ? 'var(--brand-secondary)' : 'var(--text-muted)',
                      fontWeight: accent === col ? 700 : 500,
                    }}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-md transition-all cursor-pointer"
              style={{
                backgroundColor: 'var(--brand-primary)',
              }}
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Profile Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Workspace Data Management (Backup, Restore, Reset) */}
      <div
        className="rounded-2xl p-6 space-y-4 shadow-card"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
        }}
      >
        <div
          className="flex items-center gap-2 pb-4"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <Shield className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            Data Fortress & Backup Recovery
          </h2>
        </div>

        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Export your complete Eye of Agamotto workspace data (tasks, calendar timeblocks, curriculum checklists, notes vault, and job applications) to a portable JSON backup.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportData}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
            }}
          >
            <Download className="w-3.5 h-3.5" style={{ color: 'var(--brand-primary)' }} />
            <span>Export Full JSON Backup</span>
          </button>

          <label
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
            }}
          >
            <Upload className="w-3.5 h-3.5" style={{ color: 'var(--brand-cyan)' }} />
            <span>Restore Backup JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
            />
          </label>

          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-colors ml-auto cursor-pointer"
            style={{
              backgroundColor: 'rgba(251, 113, 133, 0.1)',
              border: '1px solid rgba(251, 113, 133, 0.3)',
              color: 'var(--status-danger)',
            }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Resetting Demo Data */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
            }}
          >
            <div className="flex items-center gap-3" style={{ color: 'var(--status-warning)' }}>
              <div
                className="p-2 rounded-xl"
                style={{
                  backgroundColor: 'rgba(251, 191, 36, 0.15)',
                  border: '1px solid rgba(251, 191, 36, 0.3)',
                }}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                Reset Demo Data?
              </h3>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              This will restore the initial showcase state for tasks, projects, and roadmaps. If you are signed in, your cloud records can be refreshed with these defaults.
            </p>

            <div
              className="flex items-center justify-end gap-3 pt-3"
              style={{ borderTop: '1px solid var(--border-subtle)' }}
            >
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                style={{
                  color: 'var(--text-muted)',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer"
                style={{
                  backgroundColor: 'var(--status-danger)',
                }}
              >
                Reset to Demo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
