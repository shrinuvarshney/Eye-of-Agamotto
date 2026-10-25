/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  NavigationItem,
  Task,
  CalendarEvent,
  LearningRoadmap,
  Project,
  JobApplication,
  Note,
  NoteFolder,
  Goal,
  UserProfile,
} from './types';
import { storageService } from './services/storageService';
import { firestoreSyncService } from './services/firestoreSyncService';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { QuickCaptureModal } from './components/modals/QuickCaptureModal';
import { SearchModal } from './components/modals/SearchModal';
import { HomeDashboard } from './pages/HomeDashboard';
import { TasksPage } from './pages/TasksPage';
import { CalendarPage } from './pages/CalendarPage';
import { LearningPage } from './pages/LearningPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { CareerPage } from './pages/CareerPage';
import { KnowledgePage } from './pages/KnowledgePage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { GoalsPage } from './pages/GoalsPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotificationCenterModal } from './components/reminders/NotificationCenterModal';
import { InAppReminderBanner } from './components/reminders/InAppReminderBanner';
import { reminderService } from './services/reminderService';
import { CheckCircle2 } from 'lucide-react';

function AppContent() {
  const [currentNav, setCurrentNav] = useState<NavigationItem>('home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [roadmaps, setRoadmaps] = useState<LearningRoadmap[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [profile, setProfile] = useState<UserProfile>(storageService.getUserProfile());

  const { user } = useAuth();

  // Reload data from storage / memory cache
  const reloadData = useCallback(() => {
    setTasks(storageService.getTasks());
    setCalendarEvents(storageService.getCalendarEvents());
    setRoadmaps(storageService.getRoadmaps());
    setProjects(storageService.getProjects());
    setJobs(storageService.getJobApplications());
    setNotes(storageService.getNotes());
    setFolders(storageService.getNoteFolders());
    setGoals(storageService.getGoals());
    setProfile(storageService.getUserProfile());
  }, []);

  useEffect(() => {
    reloadData();
  }, [user, reloadData]);

  // Subscribe to real-time Firestore sync updates
  useEffect(() => {
    const unsubscribe = firestoreSyncService.subscribeToChanges(() => {
      reloadData();
    });
    return () => unsubscribe();
  }, [reloadData]);

  // Global keyboard shortcut for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleTask = (id: string) => {
    storageService.toggleTaskCompletion(id);
    reloadData();
  };

  // Badge calculations for sidebar using local timezone-aware date
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
  }, []);

  const badgeCounts = useMemo(() => {
    const pendingTasks = tasks.filter(
      (t) => (t.dueDate === todayStr || t.dueDate < todayStr) && t.status !== 'completed'
    ).length;
    const activeRoadmaps = roadmaps.length;
    const activeInterviews = jobs.filter((j) => j.status === 'interviewing').length;
    return { pendingTasks, activeRoadmaps, activeInterviews };
  }, [tasks, roadmaps, jobs, todayStr]);

  // Reminders calculations
  const reminders = useMemo(() => {
    return reminderService.computeAllReminders(tasks, calendarEvents);
  }, [tasks, calendarEvents]);

  const activeRemindersCount = useMemo(() => {
    return reminders.filter((r) => r.status === 'due' || r.status === 'overdue').length;
  }, [reminders]);

  const hasOverdueReminders = useMemo(() => {
    return reminders.some((r) => r.status === 'overdue');
  }, [reminders]);

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex transition-colors duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--brand-primary)] text-xs font-semibold text-[var(--text-primary)] shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[var(--brand-cyan)]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Collapsible Left Sidebar */}
      <Sidebar
        currentNav={currentNav}
        onSelectNav={setCurrentNav}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        badgeCounts={badgeCounts}
        profile={profile}
      />

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Sticky Top Bar Contract */}
        <TopHeader
          currentNav={currentNav}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onSelectNav={setCurrentNav}
          onOpenNotificationCenter={() => setIsNotificationCenterOpen(true)}
          remindersCount={activeRemindersCount}
          hasOverdue={hasOverdueReminders}
        />

        {/* Content Area */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto pb-16">
          {currentNav === 'home' && (
            <HomeDashboard
              tasks={tasks}
              calendarEvents={calendarEvents}
              roadmaps={roadmaps}
              projects={projects}
              jobs={jobs}
              profile={profile}
              onNavigate={setCurrentNav}
              onToggleTask={handleToggleTask}
              onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
            />
          )}

          {currentNav === 'tasks' && (
            <TasksPage
              tasks={tasks}
              onTasksChange={reloadData}
              onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
              onShowToast={showToast}
            />
          )}

          {currentNav === 'calendar' && (
            <CalendarPage
              events={calendarEvents}
              tasks={tasks}
              onEventsChange={reloadData}
              onTasksChange={reloadData}
            />
          )}

          {currentNav === 'learning' && (
            <LearningPage
              roadmaps={roadmaps}
              onRoadmapsChange={reloadData}
              onNavigate={setCurrentNav}
            />
          )}

          {currentNav === 'projects' && (
            <ProjectsPage
              projects={projects}
              tasks={tasks}
              onProjectsChange={reloadData}
              onTasksChange={reloadData}
              onNavigate={setCurrentNav}
            />
          )}

          {currentNav === 'career' && (
            <CareerPage
              jobs={jobs}
              onJobsChange={reloadData}
              onNavigate={setCurrentNav}
            />
          )}

          {currentNav === 'knowledge' && (
            <KnowledgePage
              notes={notes}
              folders={folders}
              projects={projects}
              roadmaps={roadmaps}
              onNotesChange={reloadData}
              onNavigate={setCurrentNav}
            />
          )}

          {currentNav === 'assistant' && (
            <AIAssistantPage
              tasks={tasks}
              notes={notes}
              roadmaps={roadmaps}
              onTasksChange={reloadData}
              onNotesChange={reloadData}
            />
          )}

          {currentNav === 'goals' && (
            <GoalsPage
              goals={goals}
              onGoalsChange={reloadData}
              onOpenQuickCapture={() => setIsQuickCaptureOpen(true)}
            />
          )}

          {currentNav === 'settings' && (
            <SettingsPage
              profile={profile}
              onProfileChange={setProfile}
              onRefreshAllData={reloadData}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
        onSuccess={(msg) => {
          reloadData();
          showToast(msg);
        }}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={setCurrentNav}
      />

      {/* Real-Time Floating In-App Reminder Alert */}
      <InAppReminderBanner
        tasks={tasks}
        onTasksChange={reloadData}
        onOpenNotificationCenter={() => setIsNotificationCenterOpen(true)}
      />

      {/* Notification & Reminder Center Slide-Over Modal */}
      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        tasks={tasks}
        events={calendarEvents}
        onTasksChange={reloadData}
        onNavigate={setCurrentNav}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
