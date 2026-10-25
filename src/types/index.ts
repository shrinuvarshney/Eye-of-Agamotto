/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'completed';
export type TaskCategory = 'work' | 'study' | 'career' | 'personal';
export type RecurringFrequency = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  category: TaskCategory;
  status: TaskStatus;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  estimatedMinutes?: number;
  recurring: RecurringFrequency;
  tags: string[];
  linkedProjectId?: string;
  completedAt?: string;
  createdAt: string;
  reminderEnabled?: boolean;
  reminderMinutesBefore?: number; // 0 = at due time, 15, 30, 60, 1440
}

export type EventType = 'event' | 'task_block' | 'exam' | 'interview' | 'deep_work' | 'study';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  type: EventType;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endDate: string; // YYYY-MM-DD
  endTime: string; // HH:MM
  location?: string;
  color?: string;
  linkedTaskId?: string;
}

export interface PracticeQuestion {
  id: string;
  question: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  options?: string[];
  answer: string;
  explanation: string;
}

export interface LearningResource {
  id: string;
  title: string;
  type: 'doc' | 'video' | 'paper' | 'course' | 'book';
  url?: string;
  author?: string;
}

export interface LearningSubtopic {
  id: string;
  title: string;
  completed: boolean;
}

export interface LearningTopic {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  subtopics: LearningSubtopic[];
  resources: LearningResource[];
  notes?: string;
  practiceQuestions?: PracticeQuestion[];
}

export interface LearningModule {
  id: string;
  title: string;
  estimatedHours: number;
  topics: LearningTopic[];
}

export interface LearningRoadmap {
  id: string;
  title: string;
  shortCode: string;
  badge: string;
  targetYear?: string;
  summary: string;
  iconName: string;
  colorAccent: string;
  modules: LearningModule[];
}

export type ProjectStatus = 'planning' | 'active' | 'in_review' | 'completed';

export interface ProjectMilestone {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  category: 'GenAI' | 'Full-Stack' | 'Systems' | 'Personal';
  deadline: string;
  progress: number; // 0-100
  tags: string[];
  milestones: ProjectMilestone[];
  isDemoData: boolean;
  repoUrl?: string;
  liveUrl?: string;
  createdAt: string;
}

export type JobStatus = 'bookmarked' | 'applied' | 'interviewing' | 'offered' | 'rejected';

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  location: string;
  applicationDate: string;
  status: JobStatus;
  nextStep: string;
  followUpDate: string;
  salaryRange?: string;
  notes?: string;
  link?: string;
  contactPerson?: string;
}

export interface NoteFolder {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Note {
  id: string;
  folderId: string;
  title: string;
  content: string;
  tags: string[];
  isBookmarked: boolean;
  isPinned: boolean;
  updatedAt: string;
  createdAt: string;
  linkedEntity?: {
    type: 'task' | 'project' | 'roadmap';
    id: string;
    title: string;
  };
}

export interface GoalKeyResult {
  id: string;
  title: string;
  completed: boolean;
  currentValue?: number;
  targetValue?: number;
  unit?: string;
}

export interface Goal {
  id: string;
  title: string;
  timeframe: 'annual' | 'quarterly' | 'monthly';
  category: 'learning' | 'career' | 'projects' | 'health';
  dueDate: string;
  keyResults: GoalKeyResult[];
  notes?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  title: string;
  avatarUrl?: string;
  accentColor: 'emerald' | 'teal' | 'indigo' | 'amber';
  dailyTargetTasks: number;
  timezone: string;
}

export type NavigationItem =
  | 'home'
  | 'tasks'
  | 'calendar'
  | 'learning'
  | 'projects'
  | 'career'
  | 'knowledge'
  | 'assistant'
  | 'goals'
  | 'settings';

export type ReminderStatus = 'scheduled' | 'due' | 'overdue' | 'snoozed' | 'completed' | 'dismissed';

export type ReminderDeliveryStatus =
  | 'pending'
  | 'in_app_displayed'
  | 'browser_displayed'
  | 'push_dispatched'
  | 'push_confirmed'
  | 'failed'
  | 'snoozed';

export type NotificationChannel = 'in_app' | 'browser_api' | 'web_push';

export interface Reminder {
  id: string;
  targetType: 'task' | 'calendar_event';
  targetId: string;
  title: string;
  scheduledTime: string; // ISO String (local timezone aware)
  dueTimeFormatted: string; // e.g. "Today at 14:30"
  timezone: string;
  status: ReminderStatus;
  deliveryStatus: ReminderDeliveryStatus;
  deliveryConfirmedAt?: string;
  deliveryChannel?: NotificationChannel;
  snoozedUntil?: string;
  snoozeHistory?: Array<{
    snoozedAt: string;
    snoozedUntil: string;
    minutes: number;
  }>;
  overdueMinutes?: number;
  isRecurring?: boolean;
  recurringFrequency?: RecurringFrequency;
  createdAt: string;
}

export interface NotificationPreferences {
  browserNotificationsEnabled: boolean;
  backgroundPushEnabled: boolean;
  soundEnabled: boolean;
  defaultSnoozeMinutes: number;
  userTimezone: string;
}
