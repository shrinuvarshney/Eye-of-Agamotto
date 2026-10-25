/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Task,
  TaskStatus,
  CalendarEvent,
  LearningRoadmap,
  LearningModule,
  LearningTopic,
  LearningSubtopic,
  Project,
  ProjectMilestone,
  JobApplication,
  Note,
  NoteFolder,
  Goal,
  UserProfile,
} from '../types';
import {
  initialTasks,
  initialCalendarEvents,
  initialRoadmaps,
  initialProjects,
  initialJobApplications,
  initialNotes,
  initialNoteFolders,
  initialGoals,
  initialUserProfile,
} from '../data/initialData';
import { firestoreSyncService } from './firestoreSyncService';

let currentActiveUserId: string | null = null;

function getKey(base: string): string {
  if (currentActiveUserId) {
    return `agamotto_${currentActiveUserId}_${base}`;
  }
  return `agamotto_${base}`;
}

const STORAGE_KEYS = {
  get TASKS() {
    return getKey('tasks_v1');
  },
  get CALENDAR() {
    return getKey('calendar_v1');
  },
  get ROADMAPS() {
    return getKey('roadmaps_v1');
  },
  get PROJECTS() {
    return getKey('projects_v1');
  },
  get JOBS() {
    return getKey('jobs_v1');
  },
  get NOTES() {
    return getKey('notes_v1');
  },
  get FOLDERS() {
    return getKey('folders_v1');
  },
  get GOALS() {
    return getKey('goals_v1');
  },
  get PROFILE() {
    return getKey('profile_v1');
  },
};

// Safe JSON parser
function safeGet<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      if (currentActiveUserId) {
        const legacyKey = key.replace(`agamotto_${currentActiveUserId}_`, 'agamotto_');
        const legacyRaw = localStorage.getItem(legacyKey);
        if (legacyRaw) {
          localStorage.setItem(key, legacyRaw);
          return JSON.parse(legacyRaw) as T;
        }
      }
      return defaultValue;
    }
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Error reading key ${key} from storage:`, err);
    return defaultValue;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving key ${key} to storage:`, err);
  }
}

export const storageService = {
  setActiveUser(userId: string | null): void {
    currentActiveUserId = userId;
  },
  getActiveUserId(): string | null {
    return currentActiveUserId;
  },
  // Tasks
  getTasks(): Task[] {
    return safeGet<Task[]>(STORAGE_KEYS.TASKS, initialTasks);
  },
  saveTasks(tasks: Task[]): void {
    safeSet(STORAGE_KEYS.TASKS, tasks);
  },
  addTask(task: Omit<Task, 'id' | 'createdAt'>): Task {
    const tasks = this.getTasks();
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    tasks.unshift(newTask);
    this.saveTasks(tasks);
    firestoreSyncService.saveTask(newTask).catch((e) => console.error('Cloud task save error:', e));
    return newTask;
  },
  updateTask(updated: Task): void {
    const tasks = this.getTasks().map((t) => (t.id === updated.id ? updated : t));
    this.saveTasks(tasks);
    firestoreSyncService.saveTask(updated).catch((e) => console.error('Cloud task update error:', e));
  },
  deleteTask(id: string): void {
    const tasks = this.getTasks().filter((t) => t.id !== id);
    this.saveTasks(tasks);
    firestoreSyncService.deleteTask(id).catch((e) => console.error('Cloud task delete error:', e));
  },
  toggleTaskCompletion(id: string): Task | null {
    const tasks = this.getTasks();
    let updated: Task | null = null;
    const nextTasks = tasks.map((t) => {
      if (t.id === id) {
        const isCompleted = t.status === 'completed';
        if (!isCompleted && t.recurring && t.recurring !== 'none') {
          // Recurring task completion: advance to next occurrence
          const d = new Date(t.dueDate + 'T00:00:00');
          if (t.recurring === 'daily') d.setDate(d.getDate() + 1);
          else if (t.recurring === 'weekly') d.setDate(d.getDate() + 7);
          else if (t.recurring === 'monthly') d.setMonth(d.getMonth() + 1);

          const nextDateStr = d.toISOString().split('T')[0];
          updated = {
            ...t,
            dueDate: nextDateStr,
            status: 'todo',
            completedAt: undefined,
          };
        } else {
          updated = {
            ...t,
            status: isCompleted ? 'todo' : 'completed',
            completedAt: isCompleted ? undefined : new Date().toISOString(),
          };
        }
        return updated;
      }
      return t;
    });
    this.saveTasks(nextTasks);
    if (updated) {
      firestoreSyncService.saveTask(updated).catch((e) => console.error('Cloud task toggle error:', e));
    }
    return updated;
  },
  updateTaskStatus(id: string, status: TaskStatus): Task | null {
    const tasks = this.getTasks();
    let updated: Task | null = null;
    const nextTasks = tasks.map((t) => {
      if (t.id === id) {
        updated = {
          ...t,
          status,
          completedAt: status === 'completed' ? (t.completedAt || new Date().toISOString()) : undefined,
        };
        return updated;
      }
      return t;
    });
    this.saveTasks(nextTasks);
    if (updated) {
      firestoreSyncService.saveTask(updated).catch((e) => console.error('Cloud task status error:', e));
    }
    return updated;
  },
  rescheduleTask(id: string, newDate: string, newTime?: string): Task | null {
    const tasks = this.getTasks();
    let updated: Task | null = null;
    const nextTasks = tasks.map((t) => {
      if (t.id === id) {
        updated = {
          ...t,
          dueDate: newDate,
          dueTime: newTime !== undefined ? newTime : t.dueTime,
        };
        return updated;
      }
      return t;
    });
    this.saveTasks(nextTasks);
    if (updated) {
      firestoreSyncService.saveTask(updated).catch((e) => console.error('Cloud task reschedule error:', e));
    }
    return updated;
  },

  // Calendar
  getCalendarEvents(): CalendarEvent[] {
    return safeGet<CalendarEvent[]>(STORAGE_KEYS.CALENDAR, initialCalendarEvents);
  },
  saveCalendarEvents(events: CalendarEvent[]): void {
    safeSet(STORAGE_KEYS.CALENDAR, events);
  },
  addCalendarEvent(event: Omit<CalendarEvent, 'id'>): CalendarEvent {
    const events = this.getCalendarEvents();
    const newEvent: CalendarEvent = {
      ...event,
      id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    events.push(newEvent);
    this.saveCalendarEvents(events);
    firestoreSyncService.saveCalendarEvent(newEvent).catch((e) => console.error('Cloud event save error:', e));
    return newEvent;
  },
  updateCalendarEvent(updated: CalendarEvent): void {
    const events = this.getCalendarEvents().map((e) => (e.id === updated.id ? updated : e));
    this.saveCalendarEvents(events);
    firestoreSyncService.saveCalendarEvent(updated).catch((e) => console.error('Cloud event update error:', e));
  },
  deleteCalendarEvent(id: string): void {
    const events = this.getCalendarEvents().filter((e) => e.id !== id);
    this.saveCalendarEvents(events);
    firestoreSyncService.deleteCalendarEvent(id).catch((e) => console.error('Cloud event delete error:', e));
  },
  checkCalendarEventDuplicate(
    event: { title: string; startDate: string; startTime: string },
    excludeId?: string
  ): boolean {
    const events = this.getCalendarEvents();
    const cleanTitle = event.title.trim().toLowerCase();
    return events.some(
      (e) =>
        e.id !== excludeId &&
        e.startDate === event.startDate &&
        e.startTime === event.startTime &&
        e.title.trim().toLowerCase() === cleanTitle
    );
  },

  // Roadmaps
  getRoadmaps(): LearningRoadmap[] {
    return safeGet<LearningRoadmap[]>(STORAGE_KEYS.ROADMAPS, initialRoadmaps);
  },
  saveRoadmaps(roadmaps: LearningRoadmap[]): void {
    safeSet(STORAGE_KEYS.ROADMAPS, roadmaps);
    roadmaps.forEach((r) => firestoreSyncService.saveRoadmap(r).catch(() => {}));
  },
  addRoadmap(roadmap: Omit<LearningRoadmap, 'id'>): LearningRoadmap {
    const roadmaps = this.getRoadmaps();
    const newRoadmap: LearningRoadmap = {
      ...roadmap,
      id: `roadmap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    roadmaps.push(newRoadmap);
    this.saveRoadmaps(roadmaps);
    firestoreSyncService.saveRoadmap(newRoadmap).catch(() => {});
    return newRoadmap;
  },
  updateRoadmap(updated: LearningRoadmap): void {
    const roadmaps = this.getRoadmaps().map((r) => (r.id === updated.id ? updated : r));
    this.saveRoadmaps(roadmaps);
    firestoreSyncService.saveRoadmap(updated).catch(() => {});
  },
  deleteRoadmap(id: string): void {
    const roadmaps = this.getRoadmaps().filter((r) => r.id !== id);
    this.saveRoadmaps(roadmaps);
    firestoreSyncService.deleteRoadmap(id).catch(() => {});
  },
  addModule(roadmapId: string, module: Omit<LearningModule, 'id'>): LearningModule | null {
    const roadmaps = this.getRoadmaps();
    const newMod: LearningModule = {
      ...module,
      id: `mod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    let updatedTarget: LearningRoadmap | null = null;
    const updatedRoadmaps = roadmaps.map((r) => {
      if (r.id !== roadmapId) return r;
      const mod = {
        ...r,
        modules: [...r.modules, newMod],
      };
      updatedTarget = mod;
      return mod;
    });
    if (updatedTarget) {
      this.saveRoadmaps(updatedRoadmaps);
      firestoreSyncService.saveRoadmap(updatedTarget).catch(() => {});
      return newMod;
    }
    return null;
  },
  updateModule(roadmapId: string, updatedMod: LearningModule): void {
    const roadmaps = this.getRoadmaps();
    let updatedTarget: LearningRoadmap | null = null;
    const updatedRoadmaps = roadmaps.map((r) => {
      if (r.id !== roadmapId) return r;
      const mod = {
        ...r,
        modules: r.modules.map((m) => (m.id === updatedMod.id ? updatedMod : m)),
      };
      updatedTarget = mod;
      return mod;
    });
    if (updatedTarget) {
      this.saveRoadmaps(updatedRoadmaps);
      firestoreSyncService.saveRoadmap(updatedTarget).catch(() => {});
    }
  },
  deleteModule(roadmapId: string, moduleId: string): void {
    const roadmaps = this.getRoadmaps();
    let updatedTarget: LearningRoadmap | null = null;
    const updatedRoadmaps = roadmaps.map((r) => {
      if (r.id !== roadmapId) return r;
      const mod = {
        ...r,
        modules: r.modules.filter((m) => m.id !== moduleId),
      };
      updatedTarget = mod;
      return mod;
    });
    if (updatedTarget) {
      this.saveRoadmaps(updatedRoadmaps);
      firestoreSyncService.saveRoadmap(updatedTarget).catch(() => {});
    }
  },
  addTopic(roadmapId: string, moduleId: string, topic: Omit<LearningTopic, 'id'>): LearningTopic | null {
    const roadmaps = this.getRoadmaps();
    const newTopic: LearningTopic = {
      ...topic,
      id: `top-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    let updatedTarget: LearningRoadmap | null = null;
    const updatedRoadmaps = roadmaps.map((r) => {
      if (r.id !== roadmapId) return r;
      const mod = {
        ...r,
        modules: r.modules.map((m) => {
          if (m.id !== moduleId) return m;
          return {
            ...m,
            topics: [...m.topics, newTopic],
          };
        }),
      };
      updatedTarget = mod;
      return mod;
    });
    if (updatedTarget) {
      this.saveRoadmaps(updatedRoadmaps);
      firestoreSyncService.saveRoadmap(updatedTarget).catch(() => {});
      return newTopic;
    }
    return null;
  },
  updateTopic(roadmapId: string, moduleId: string, updatedTopic: LearningTopic): void {
    const roadmaps = this.getRoadmaps();
    let updatedTarget: LearningRoadmap | null = null;
    const updatedRoadmaps = roadmaps.map((r) => {
      if (r.id !== roadmapId) return r;
      const mod = {
        ...r,
        modules: r.modules.map((m) => {
          if (m.id !== moduleId) return m;
          return {
            ...m,
            topics: m.topics.map((t) => (t.id === updatedTopic.id ? updatedTopic : t)),
          };
        }),
      };
      updatedTarget = mod;
      return mod;
    });
    if (updatedTarget) {
      this.saveRoadmaps(updatedRoadmaps);
      firestoreSyncService.saveRoadmap(updatedTarget).catch(() => {});
    }
  },
  deleteTopic(roadmapId: string, moduleId: string, topicId: string): void {
    const roadmaps = this.getRoadmaps();
    let updatedTarget: LearningRoadmap | null = null;
    const updatedRoadmaps = roadmaps.map((r) => {
      if (r.id !== roadmapId) return r;
      const mod = {
        ...r,
        modules: r.modules.map((m) => {
          if (m.id !== moduleId) return m;
          return {
            ...m,
            topics: m.topics.filter((t) => t.id !== topicId),
          };
        }),
      };
      updatedTarget = mod;
      return mod;
    });
    if (updatedTarget) {
      this.saveRoadmaps(updatedRoadmaps);
      firestoreSyncService.saveRoadmap(updatedTarget).catch(() => {});
    }
  },
  addSubtopic(roadmapId: string, topicId: string, title: string): LearningSubtopic | null {
    const roadmaps = this.getRoadmaps();
    const newSub: LearningSubtopic = {
      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      completed: false,
    };
    let updatedTarget: LearningRoadmap | null = null;
    const updatedRoadmaps = roadmaps.map((r) => {
      if (r.id !== roadmapId) return r;
      const mod = {
        ...r,
        modules: r.modules.map((m) => ({
          ...m,
          topics: m.topics.map((t) => {
            if (t.id !== topicId) return t;
            return {
              ...t,
              completed: false,
              subtopics: [...t.subtopics, newSub],
            };
          }),
        })),
      };
      updatedTarget = mod;
      return mod;
    });
    if (updatedTarget) {
      this.saveRoadmaps(updatedRoadmaps);
      firestoreSyncService.saveRoadmap(updatedTarget).catch(() => {});
      return newSub;
    }
    return null;
  },
  deleteSubtopic(roadmapId: string, topicId: string, subtopicId: string): void {
    const roadmaps = this.getRoadmaps();
    let updatedTarget: LearningRoadmap | null = null;
    const updatedRoadmaps = roadmaps.map((r) => {
      if (r.id !== roadmapId) return r;
      const mod = {
        ...r,
        modules: r.modules.map((m) => ({
          ...m,
          topics: m.topics.map((t) => {
            if (t.id !== topicId) return t;
            const updatedSubs = t.subtopics.filter((s) => s.id !== subtopicId);
            const allDone = updatedSubs.length > 0 && updatedSubs.every((s) => s.completed);
            return {
              ...t,
              completed: allDone,
              subtopics: updatedSubs,
            };
          }),
        })),
      };
      updatedTarget = mod;
      return mod;
    });
    if (updatedTarget) {
      this.saveRoadmaps(updatedRoadmaps);
      firestoreSyncService.saveRoadmap(updatedTarget).catch(() => {});
    }
  },
  toggleSubtopic(roadmapId: string, topicId: string, subtopicId: string): void {
    const roadmaps = this.getRoadmaps();
    let changedRoadmap: LearningRoadmap | null = null;
    const updated = roadmaps.map((r) => {
      if (r.id !== roadmapId) return r;
      const modUpdated = {
        ...r,
        modules: r.modules.map((m) => ({
          ...m,
          topics: m.topics.map((t) => {
            if (t.id !== topicId) return t;
            const updatedSubtopics = t.subtopics.map((st) =>
              st.id === subtopicId ? { ...st, completed: !st.completed } : st
            );
            const allSubsCompleted = updatedSubtopics.length > 0 && updatedSubtopics.every((st) => st.completed);
            return {
              ...t,
              completed: allSubsCompleted,
              subtopics: updatedSubtopics,
            };
          }),
        })),
      };
      changedRoadmap = modUpdated;
      return modUpdated;
    });
    this.saveRoadmaps(updated);
    if (changedRoadmap) firestoreSyncService.saveRoadmap(changedRoadmap).catch(() => {});
  },
  toggleTopic(roadmapId: string, topicId: string): void {
    const roadmaps = this.getRoadmaps();
    let changedRoadmap: LearningRoadmap | null = null;
    const updated = roadmaps.map((r) => {
      if (r.id !== roadmapId) return r;
      const modUpdated = {
        ...r,
        modules: r.modules.map((m) => ({
          ...m,
          topics: m.topics.map((t) => {
            if (t.id !== topicId) return t;
            const nextCompleted = !t.completed;
            return {
              ...t,
              completed: nextCompleted,
              subtopics: t.subtopics.map((st) => ({ ...st, completed: nextCompleted })),
            };
          }),
        })),
      };
      changedRoadmap = modUpdated;
      return modUpdated;
    });
    this.saveRoadmaps(updated);
    if (changedRoadmap) firestoreSyncService.saveRoadmap(changedRoadmap).catch(() => {});
  },

  // Projects
  getProjects(): Project[] {
    return safeGet<Project[]>(STORAGE_KEYS.PROJECTS, initialProjects);
  },
  saveProjects(projects: Project[]): void {
    safeSet(STORAGE_KEYS.PROJECTS, projects);
    projects.forEach((p) => firestoreSyncService.saveProject(p).catch(() => {}));
  },
  addProject(project: Omit<Project, 'id' | 'createdAt'>): Project {
    const projects = this.getProjects();
    const newProj: Project = {
      ...project,
      id: `proj-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    projects.unshift(newProj);
    this.saveProjects(projects);
    firestoreSyncService.saveProject(newProj).catch((e) => console.error('Cloud project save error:', e));
    return newProj;
  },
  updateProject(updated: Project): void {
    const projects = this.getProjects().map((p) => (p.id === updated.id ? updated : p));
    this.saveProjects(projects);
    firestoreSyncService.saveProject(updated).catch((e) => console.error('Cloud project update error:', e));
  },
  deleteProject(id: string): void {
    const projects = this.getProjects().filter((p) => p.id !== id);
    this.saveProjects(projects);
    firestoreSyncService.deleteProject(id).catch((e) => console.error('Cloud project delete error:', e));
  },
  toggleProjectMilestone(projectId: string, milestoneId: string): void {
    let changedProj: Project | null = null;
    const projects = this.getProjects().map((p) => {
      if (p.id !== projectId) return p;
      const milestones = p.milestones.map((m) =>
        m.id === milestoneId ? { ...m, completed: !m.completed } : m
      );
      const completedCount = milestones.filter((m) => m.completed).length;
      const progress = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;
      const updatedP: Project = {
        ...p,
        milestones,
        progress,
        status: progress === 100 ? ('completed' as const) : p.status === 'completed' ? ('active' as const) : p.status,
      };
      changedProj = updatedP;
      return updatedP;
    });
    this.saveProjects(projects);
    if (changedProj) firestoreSyncService.saveProject(changedProj).catch(() => {});
  },
  addProjectMilestone(projectId: string, milestone: Omit<ProjectMilestone, 'id'>): ProjectMilestone | null {
    const projects = this.getProjects();
    const newM: ProjectMilestone = {
      ...milestone,
      id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    let changedProj: Project | null = null;
    const updatedProjects = projects.map((p) => {
      if (p.id !== projectId) return p;
      const milestones = [...p.milestones, newM];
      const completedCount = milestones.filter((m) => m.completed).length;
      const progress = Math.round((completedCount / milestones.length) * 100);
      const updatedP: Project = {
        ...p,
        milestones,
        progress,
        status: progress === 100 ? 'completed' : p.status === 'completed' ? 'active' : p.status,
      };
      changedProj = updatedP;
      return updatedP;
    });
    if (changedProj) {
      this.saveProjects(updatedProjects);
      firestoreSyncService.saveProject(changedProj).catch(() => {});
      return newM;
    }
    return null;
  },
  updateProjectMilestone(projectId: string, updatedM: ProjectMilestone): void {
    const projects = this.getProjects();
    let changedProj: Project | null = null;
    const updatedProjects = projects.map((p) => {
      if (p.id !== projectId) return p;
      const milestones = p.milestones.map((m) => (m.id === updatedM.id ? updatedM : m));
      const completedCount = milestones.filter((m) => m.completed).length;
      const progress = Math.round((completedCount / milestones.length) * 100);
      const updatedP: Project = {
        ...p,
        milestones,
        progress,
        status: progress === 100 ? 'completed' : p.status === 'completed' ? 'active' : p.status,
      };
      changedProj = updatedP;
      return updatedP;
    });
    if (changedProj) {
      this.saveProjects(updatedProjects);
      firestoreSyncService.saveProject(changedProj).catch(() => {});
    }
  },
  deleteProjectMilestone(projectId: string, milestoneId: string): void {
    const projects = this.getProjects();
    let changedProj: Project | null = null;
    const updatedProjects = projects.map((p) => {
      if (p.id !== projectId) return p;
      const milestones = p.milestones.filter((m) => m.id !== milestoneId);
      const completedCount = milestones.filter((m) => m.completed).length;
      const progress = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;
      const updatedP: Project = {
        ...p,
        milestones,
        progress,
        status: progress === 100 ? 'completed' : p.status === 'completed' ? 'active' : p.status,
      };
      changedProj = updatedP;
      return updatedP;
    });
    if (changedProj) {
      this.saveProjects(updatedProjects);
      firestoreSyncService.saveProject(changedProj).catch(() => {});
    }
  },
  linkTaskToProject(taskId: string, projectId: string | undefined): void {
    const tasks = this.getTasks();
    let updatedTask: Task | null = null;
    const nextTasks = tasks.map((t) => {
      if (t.id === taskId) {
        updatedTask = {
          ...t,
          linkedProjectId: projectId || undefined,
        };
        return updatedTask;
      }
      return t;
    });
    this.saveTasks(nextTasks);
    if (updatedTask) {
      firestoreSyncService.saveTask(updatedTask).catch(() => {});
    }
  },

  // Jobs
  getJobApplications(): JobApplication[] {
    return safeGet<JobApplication[]>(STORAGE_KEYS.JOBS, initialJobApplications);
  },
  saveJobApplications(jobs: JobApplication[]): void {
    safeSet(STORAGE_KEYS.JOBS, jobs);
  },
  addJobApplication(job: Omit<JobApplication, 'id'>): JobApplication {
    const jobs = this.getJobApplications();
    const newJob: JobApplication = {
      ...job,
      id: `job-${Date.now()}`,
    };
    jobs.unshift(newJob);
    this.saveJobApplications(jobs);
    firestoreSyncService.saveJobApplication(newJob).catch((e) => console.error('Cloud job save error:', e));
    return newJob;
  },
  updateJobApplication(updated: JobApplication): void {
    const jobs = this.getJobApplications().map((j) => (j.id === updated.id ? updated : j));
    this.saveJobApplications(jobs);
    firestoreSyncService.saveJobApplication(updated).catch((e) => console.error('Cloud job update error:', e));
  },
  deleteJobApplication(id: string): void {
    const jobs = this.getJobApplications().filter((j) => j.id !== id);
    this.saveJobApplications(jobs);
    firestoreSyncService.deleteJobApplication(id).catch((e) => console.error('Cloud job delete error:', e));
  },

  // Notes
  getNotes(): Note[] {
    return safeGet<Note[]>(STORAGE_KEYS.NOTES, initialNotes);
  },
  saveNotes(notes: Note[]): void {
    safeSet(STORAGE_KEYS.NOTES, notes);
  },
  getNoteFolders(): NoteFolder[] {
    return safeGet<NoteFolder[]>(STORAGE_KEYS.FOLDERS, initialNoteFolders);
  },
  saveNoteFolders(folders: NoteFolder[]): void {
    safeSet(STORAGE_KEYS.FOLDERS, folders);
  },
  addNoteFolder(folder: Omit<NoteFolder, 'id'>): NoteFolder {
    const folders = this.getNoteFolders();
    const newFolder: NoteFolder = {
      ...folder,
      id: `folder-${Date.now()}`,
    };
    folders.push(newFolder);
    this.saveNoteFolders(folders);
    return newFolder;
  },
  addNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note {
    const notes = this.getNotes();
    const now = new Date().toISOString();
    const newNote: Note = {
      ...note,
      id: `note-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    notes.unshift(newNote);
    this.saveNotes(notes);
    firestoreSyncService.saveNote(newNote).catch((e) => console.error('Cloud note save error:', e));
    return newNote;
  },
  updateNote(updated: Note): void {
    const now = new Date().toISOString();
    const fullUpdated = { ...updated, updatedAt: now };
    const notes = this.getNotes().map((n) => (n.id === updated.id ? fullUpdated : n));
    this.saveNotes(notes);
    firestoreSyncService.saveNote(fullUpdated).catch((e) => console.error('Cloud note update error:', e));
  },
  deleteNote(id: string): void {
    const notes = this.getNotes().filter((n) => n.id !== id);
    this.saveNotes(notes);
    firestoreSyncService.deleteNote(id).catch((e) => console.error('Cloud note delete error:', e));
  },

  // Goals
  getGoals(): Goal[] {
    return safeGet<Goal[]>(STORAGE_KEYS.GOALS, initialGoals);
  },
  saveGoals(goals: Goal[]): void {
    safeSet(STORAGE_KEYS.GOALS, goals);
    goals.forEach((g) => firestoreSyncService.saveGoal(g).catch(() => {}));
  },
  toggleGoalKeyResult(goalId: string, krId: string): void {
    let changedGoal: Goal | null = null;
    const goals = this.getGoals().map((g) => {
      if (g.id !== goalId) return g;
      const modGoal: Goal = {
        ...g,
        keyResults: g.keyResults.map((kr) =>
          kr.id === krId ? { ...kr, completed: !kr.completed } : kr
        ),
      };
      changedGoal = modGoal;
      return modGoal;
    });
    this.saveGoals(goals);
    if (changedGoal) firestoreSyncService.saveGoal(changedGoal).catch(() => {});
  },

  // Profile
  getUserProfile(): UserProfile {
    return safeGet<UserProfile>(STORAGE_KEYS.PROFILE, initialUserProfile);
  },
  saveUserProfile(profile: UserProfile): void {
    safeSet(STORAGE_KEYS.PROFILE, profile);
    firestoreSyncService.saveUserProfile(profile).catch((e) => console.error('Cloud profile save error:', e));
  },

  // Reset to initial demo data
  resetAllDemoData(): void {
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.CALENDAR);
    localStorage.removeItem(STORAGE_KEYS.ROADMAPS);
    localStorage.removeItem(STORAGE_KEYS.PROJECTS);
    localStorage.removeItem(STORAGE_KEYS.JOBS);
    localStorage.removeItem(STORAGE_KEYS.NOTES);
    localStorage.removeItem(STORAGE_KEYS.FOLDERS);
    localStorage.removeItem(STORAGE_KEYS.GOALS);
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
  },

  // Export full JSON backup
  exportAllDataJSON(): string {
    const bundle = {
      tasks: this.getTasks(),
      calendar: this.getCalendarEvents(),
      roadmaps: this.getRoadmaps(),
      projects: this.getProjects(),
      jobs: this.getJobApplications(),
      notes: this.getNotes(),
      folders: this.getNoteFolders(),
      goals: this.getGoals(),
      profile: this.getUserProfile(),
      exportedAt: new Date().toISOString(),
      app: 'Eye of Agamotto',
      version: '1.0.0',
    };
    return JSON.stringify(bundle, null, 2);
  },

  // Import JSON backup
  importAllDataJSON(rawJson: string): boolean {
    try {
      const data = JSON.parse(rawJson);
      if (data.tasks) this.saveTasks(data.tasks);
      if (data.calendar) this.saveCalendarEvents(data.calendar);
      if (data.roadmaps) this.saveRoadmaps(data.roadmaps);
      if (data.projects) this.saveProjects(data.projects);
      if (data.jobs) this.saveJobApplications(data.jobs);
      if (data.notes) this.saveNotes(data.notes);
      if (data.goals) this.saveGoals(data.goals);
      if (data.profile) this.saveUserProfile(data.profile);
      return true;
    } catch (e) {
      console.error('Failed to import backup:', e);
      return false;
    }
  },
};
