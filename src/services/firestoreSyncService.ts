/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, isOfflineOrTokenError, OperationType } from './firebase';
import { storageService } from './storageService';
import {
  Task,
  CalendarEvent,
  LearningRoadmap,
  Project,
  JobApplication,
  Note,
  NoteFolder,
  Goal,
  UserProfile,
} from '../types';

export interface SyncStatus {
  isCloudConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  syncError: string | null;
}

class FirestoreSyncService {
  private activeListeners: Unsubscribe[] = [];
  private onDataChangeCallbacks: Set<() => void> = new Set();
  private isMigrating = false;
  private isCloudConnected = false;
  private connectionStatusCallbacks: Set<(connected: boolean) => void> = new Set();

  public subscribeToChanges(callback: () => void): () => void {
    this.onDataChangeCallbacks.add(callback);
    return () => {
      this.onDataChangeCallbacks.delete(callback);
    };
  }

  public subscribeToConnectionStatus(callback: (connected: boolean) => void): () => void {
    this.connectionStatusCallbacks.add(callback);
    callback(this.isCloudConnected);
    return () => {
      this.connectionStatusCallbacks.delete(callback);
    };
  }

  public getIsCloudConnected(): boolean {
    return this.isCloudConnected;
  }

  private setConnectionStatus(connected: boolean) {
    if (this.isCloudConnected !== connected) {
      this.isCloudConnected = connected;
      this.connectionStatusCallbacks.forEach((cb) => {
        try {
          cb(connected);
        } catch (e) {
          console.error('Error in connection status callback:', e);
        }
      });
    }
  }

  private notifyChange() {
    this.onDataChangeCallbacks.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.error('Error in data change callback:', e);
      }
    });
  }

  private handleListenerError(error: unknown, opType: OperationType, path: string) {
    if (isOfflineOrTokenError(error)) {
      console.warn(`[FirestoreSync] Listener for ${path} operating in offline mode.`);
      this.setConnectionStatus(false);
      return;
    }
    handleFirestoreError(error, opType, path);
  }

  private handleMutationError(error: unknown, opType: OperationType, path: string) {
    if (isOfflineOrTokenError(error)) {
      console.warn(`[FirestoreSync] Cloud operation offline, change safely cached locally: ${path}`);
      this.setConnectionStatus(false);
      return;
    }
    handleFirestoreError(error, opType, path);
  }

  /**
   * Initializes real-time listeners for the authenticated user
   */
  public initUserListeners(userId: string): void {
    this.cleanupListeners();

    if (!userId) return;

    try {
      // 1. Profile listener
      const profileDocRef = doc(db, 'users', userId);
      const unsubProfile = onSnapshot(
        profileDocRef,
        (snap) => {
          this.setConnectionStatus(true);
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            storageService.saveUserProfile(data);
            this.notifyChange();
          }
        },
        (error) => {
          this.handleListenerError(error, OperationType.GET, `users/${userId}`);
        }
      );
      this.activeListeners.push(unsubProfile);

      // 2. Tasks collection listener
      const tasksColRef = collection(db, 'users', userId, 'tasks');
      const unsubTasks = onSnapshot(
        tasksColRef,
        (snap) => {
          if (this.isMigrating) return;
          const tasks: Task[] = [];
          snap.forEach((d) => tasks.push(d.data() as Task));
          if (tasks.length > 0) {
            storageService.saveTasks(tasks);
            this.notifyChange();
          }
        },
        (error) => {
          this.handleListenerError(error, OperationType.LIST, `users/${userId}/tasks`);
        }
      );
      this.activeListeners.push(unsubTasks);

      // 3. Calendar events listener
      const calColRef = collection(db, 'users', userId, 'calendar_events');
      const unsubCal = onSnapshot(
        calColRef,
        (snap) => {
          if (this.isMigrating) return;
          const events: CalendarEvent[] = [];
          snap.forEach((d) => events.push(d.data() as CalendarEvent));
          if (events.length > 0) {
            storageService.saveCalendarEvents(events);
            this.notifyChange();
          }
        },
        (error) => {
          this.handleListenerError(error, OperationType.LIST, `users/${userId}/calendar_events`);
        }
      );
      this.activeListeners.push(unsubCal);

      // 4. Projects listener
      const projColRef = collection(db, 'users', userId, 'projects');
      const unsubProjects = onSnapshot(
        projColRef,
        (snap) => {
          if (this.isMigrating) return;
          const projects: Project[] = [];
          snap.forEach((d) => projects.push(d.data() as Project));
          if (projects.length > 0) {
            storageService.saveProjects(projects);
            this.notifyChange();
          }
        },
        (error) => {
          this.handleListenerError(error, OperationType.LIST, `users/${userId}/projects`);
        }
      );
      this.activeListeners.push(unsubProjects);

      // 5. Roadmaps listener
      const roadmapsColRef = collection(db, 'users', userId, 'roadmaps');
      const unsubRoadmaps = onSnapshot(
        roadmapsColRef,
        (snap) => {
          if (this.isMigrating) return;
          const roadmaps: LearningRoadmap[] = [];
          snap.forEach((d) => roadmaps.push(d.data() as LearningRoadmap));
          if (roadmaps.length > 0) {
            storageService.saveRoadmaps(roadmaps);
            this.notifyChange();
          }
        },
        (error) => {
          this.handleListenerError(error, OperationType.LIST, `users/${userId}/roadmaps`);
        }
      );
      this.activeListeners.push(unsubRoadmaps);

      // 6. Job Applications listener
      const jobsColRef = collection(db, 'users', userId, 'job_applications');
      const unsubJobs = onSnapshot(
        jobsColRef,
        (snap) => {
          if (this.isMigrating) return;
          const jobs: JobApplication[] = [];
          snap.forEach((d) => jobs.push(d.data() as JobApplication));
          if (jobs.length > 0) {
            storageService.saveJobApplications(jobs);
            this.notifyChange();
          }
        },
        (error) => {
          this.handleListenerError(error, OperationType.LIST, `users/${userId}/job_applications`);
        }
      );
      this.activeListeners.push(unsubJobs);

      // 7. Notes listener
      const notesColRef = collection(db, 'users', userId, 'notes');
      const unsubNotes = onSnapshot(
        notesColRef,
        (snap) => {
          if (this.isMigrating) return;
          const notes: Note[] = [];
          snap.forEach((d) => notes.push(d.data() as Note));
          if (notes.length > 0) {
            storageService.saveNotes(notes);
            this.notifyChange();
          }
        },
        (error) => {
          this.handleListenerError(error, OperationType.LIST, `users/${userId}/notes`);
        }
      );
      this.activeListeners.push(unsubNotes);

      // 8. Note Folders listener
      const foldersColRef = collection(db, 'users', userId, 'note_folders');
      const unsubFolders = onSnapshot(
        foldersColRef,
        (snap) => {
          if (this.isMigrating) return;
          const folders: NoteFolder[] = [];
          snap.forEach((d) => folders.push(d.data() as NoteFolder));
          if (folders.length > 0) {
            storageService.saveNoteFolders(folders);
            this.notifyChange();
          }
        },
        (error) => {
          this.handleListenerError(error, OperationType.LIST, `users/${userId}/note_folders`);
        }
      );
      this.activeListeners.push(unsubFolders);

      // 9. Goals listener
      const goalsColRef = collection(db, 'users', userId, 'goals');
      const unsubGoals = onSnapshot(
        goalsColRef,
        (snap) => {
          if (this.isMigrating) return;
          const goals: Goal[] = [];
          snap.forEach((d) => goals.push(d.data() as Goal));
          if (goals.length > 0) {
            storageService.saveGoals(goals);
            this.notifyChange();
          }
        },
        (error) => {
          this.handleListenerError(error, OperationType.LIST, `users/${userId}/goals`);
        }
      );
      this.activeListeners.push(unsubGoals);
    } catch (err) {
      console.error('Failed to attach user firestore listeners:', err);
    }
  }

  public cleanupListeners(): void {
    this.activeListeners.forEach((unsub) => unsub());
    this.activeListeners = [];
    this.setConnectionStatus(false);
  }

  /**
   * Safely migrates existing local workspace data to Firestore if the user has no existing cloud data.
   */
  public async syncOrMigrateUserData(
    userId: string,
    userMeta: { displayName?: string | null; email?: string | null; photoURL?: string | null }
  ): Promise<void> {
    this.isMigrating = true;
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);

      // Check if user already has cloud tasks
      const tasksColRef = collection(db, 'users', userId, 'tasks');
      const existingTasksSnap = await getDocs(tasksColRef);

      const hasCloudData = userDocSnap.exists() && !existingTasksSnap.empty;

      if (!hasCloudData) {
        // First-time cloud initialization: Migrate local state safely to user-scoped Firestore
        const batch = writeBatch(db);

        // 1. User Profile
        const currentProfile = storageService.getUserProfile();
        const initialProfile: UserProfile = {
          ...currentProfile,
          name: userMeta.displayName || currentProfile.name || 'User',
          email: userMeta.email || currentProfile.email || '',
          avatarUrl: userMeta.photoURL || currentProfile.avatarUrl || undefined,
        };
        batch.set(userDocRef, {
          ...initialProfile,
          uid: userId,
          migratedAt: new Date().toISOString(),
        });

        // 2. Tasks
        const localTasks = storageService.getTasks();
        for (const t of localTasks) {
          const docRef = doc(db, 'users', userId, 'tasks', t.id);
          batch.set(docRef, { ...t, userId });
        }

        // 3. Calendar Events
        const localEvents = storageService.getCalendarEvents();
        for (const ev of localEvents) {
          const docRef = doc(db, 'users', userId, 'calendar_events', ev.id);
          batch.set(docRef, { ...ev, userId });
        }

        // 4. Projects
        const localProjects = storageService.getProjects();
        for (const p of localProjects) {
          const docRef = doc(db, 'users', userId, 'projects', p.id);
          batch.set(docRef, { ...p, userId });
        }

        // 5. Roadmaps
        const localRoadmaps = storageService.getRoadmaps();
        for (const r of localRoadmaps) {
          const docRef = doc(db, 'users', userId, 'roadmaps', r.id);
          batch.set(docRef, { ...r, userId });
        }

        // 6. Job Applications
        const localJobs = storageService.getJobApplications();
        for (const j of localJobs) {
          const docRef = doc(db, 'users', userId, 'job_applications', j.id);
          batch.set(docRef, { ...j, userId });
        }

        // 7. Notes
        const localNotes = storageService.getNotes();
        for (const n of localNotes) {
          const docRef = doc(db, 'users', userId, 'notes', n.id);
          batch.set(docRef, { ...n, userId });
        }

        // 8. Note Folders
        const localFolders = storageService.getNoteFolders();
        for (const f of localFolders) {
          const docRef = doc(db, 'users', userId, 'note_folders', f.id);
          batch.set(docRef, { ...f, userId });
        }

        // 9. Goals
        const localGoals = storageService.getGoals();
        for (const g of localGoals) {
          const docRef = doc(db, 'users', userId, 'goals', g.id);
          batch.set(docRef, { ...g, userId });
        }

        await batch.commit();
        storageService.saveUserProfile(initialProfile);
      } else {
        // User has cloud data: load existing profile and cloud collections into local storage cache
        if (userDocSnap.exists()) {
          const profileData = userDocSnap.data() as UserProfile;
          storageService.saveUserProfile(profileData);
        }

        const cloudTasks: Task[] = [];
        existingTasksSnap.forEach((d) => cloudTasks.push(d.data() as Task));
        if (cloudTasks.length > 0) storageService.saveTasks(cloudTasks);

        const [calSnap, projSnap, roadSnap, jobSnap, noteSnap, folderSnap, goalSnap] =
          await Promise.all([
            getDocs(collection(db, 'users', userId, 'calendar_events')),
            getDocs(collection(db, 'users', userId, 'projects')),
            getDocs(collection(db, 'users', userId, 'roadmaps')),
            getDocs(collection(db, 'users', userId, 'job_applications')),
            getDocs(collection(db, 'users', userId, 'notes')),
            getDocs(collection(db, 'users', userId, 'note_folders')),
            getDocs(collection(db, 'users', userId, 'goals')),
          ]);

        if (!calSnap.empty) {
          const events: CalendarEvent[] = [];
          calSnap.forEach((d) => events.push(d.data() as CalendarEvent));
          storageService.saveCalendarEvents(events);
        }
        if (!projSnap.empty) {
          const projects: Project[] = [];
          projSnap.forEach((d) => projects.push(d.data() as Project));
          storageService.saveProjects(projects);
        }
        if (!roadSnap.empty) {
          const roadmaps: LearningRoadmap[] = [];
          roadSnap.forEach((d) => roadmaps.push(d.data() as LearningRoadmap));
          storageService.saveRoadmaps(roadmaps);
        }
        if (!jobSnap.empty) {
          const jobs: JobApplication[] = [];
          jobSnap.forEach((d) => jobs.push(d.data() as JobApplication));
          storageService.saveJobApplications(jobs);
        }
        if (!noteSnap.empty) {
          const notes: Note[] = [];
          noteSnap.forEach((d) => notes.push(d.data() as Note));
          storageService.saveNotes(notes);
        }
        if (!folderSnap.empty) {
          const folders: NoteFolder[] = [];
          folderSnap.forEach((d) => folders.push(d.data() as NoteFolder));
          storageService.saveNoteFolders(folders);
        }
        if (!goalSnap.empty) {
          const goals: Goal[] = [];
          goalSnap.forEach((d) => goals.push(d.data() as Goal));
          storageService.saveGoals(goals);
        }
      }
    } catch (error) {
      if (isOfflineOrTokenError(error)) {
        console.warn(
          `[FirestoreSync] Cloud connection currently offline or initializing token service. Workspace active in local mode.`
        );
        return;
      }
      handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
    } finally {
      this.isMigrating = false;
      this.notifyChange();
    }
  }

  // --- Scoped Mutation Helpers ---
  // When user is signed in, sync to Firestore; otherwise fallback gracefully.

  public async saveTask(task: Task): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}/tasks/${task.id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'tasks', task.id), {
          ...task,
          userId: user.uid,
        });
      } catch (error) {
        this.handleMutationError(error, OperationType.WRITE, path);
      }
    }
  }

  public async deleteTask(taskId: string): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}/tasks/${taskId}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'tasks', taskId));
      } catch (error) {
        this.handleMutationError(error, OperationType.DELETE, path);
      }
    }
  }

  public async saveCalendarEvent(event: CalendarEvent): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}/calendar_events/${event.id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'calendar_events', event.id), {
          ...event,
          userId: user.uid,
        });
      } catch (error) {
        this.handleMutationError(error, OperationType.WRITE, path);
      }
    }
  }

  public async deleteCalendarEvent(eventId: string): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}/calendar_events/${eventId}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'calendar_events', eventId));
      } catch (error) {
        this.handleMutationError(error, OperationType.DELETE, path);
      }
    }
  }

  public async saveProject(project: Project): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}/projects/${project.id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'projects', project.id), {
          ...project,
          userId: user.uid,
        });
      } catch (error) {
        this.handleMutationError(error, OperationType.WRITE, path);
      }
    }
  }

  public async deleteProject(projectId: string): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}/projects/${projectId}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'projects', projectId));
      } catch (error) {
        this.handleMutationError(error, OperationType.DELETE, path);
      }
    }
  }

  public async saveJobApplication(job: JobApplication): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}/job_applications/${job.id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'job_applications', job.id), {
          ...job,
          userId: user.uid,
        });
      } catch (error) {
        this.handleMutationError(error, OperationType.WRITE, path);
      }
    }
  }

  public async deleteJobApplication(jobId: string): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}/job_applications/${jobId}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'job_applications', jobId));
      } catch (error) {
        this.handleMutationError(error, OperationType.DELETE, path);
      }
    }
  }

  public async saveNote(note: Note): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}/notes/${note.id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'notes', note.id), {
          ...note,
          userId: user.uid,
        });
      } catch (error) {
        this.handleMutationError(error, OperationType.WRITE, path);
      }
    }
  }

  public async deleteNote(noteId: string): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}/notes/${noteId}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'notes', noteId));
      } catch (error) {
        this.handleMutationError(error, OperationType.DELETE, path);
      }
    }
  }

  public async saveGoal(goal: Goal): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}/goals/${goal.id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'goals', goal.id), {
          ...goal,
          userId: user.uid,
        });
      } catch (error) {
        this.handleMutationError(error, OperationType.WRITE, path);
      }
    }
  }

  public async saveRoadmap(roadmap: LearningRoadmap): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}/roadmaps/${roadmap.id}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'roadmaps', roadmap.id), {
          ...roadmap,
          userId: user.uid,
        });
      } catch (error) {
        this.handleMutationError(error, OperationType.WRITE, path);
      }
    }
  }

  public async deleteRoadmap(roadmapId: string): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}/roadmaps/${roadmapId}`;
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'roadmaps', roadmapId));
      } catch (error) {
        this.handleMutationError(error, OperationType.DELETE, path);
      }
    }
  }

  public async saveUserProfile(profile: UserProfile): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      const path = `users/${user.uid}`;
      try {
        await setDoc(
          doc(db, 'users', user.uid),
          {
            ...profile,
            uid: user.uid,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (error) {
        this.handleMutationError(error, OperationType.WRITE, path);
      }
    }
  }
}

export const firestoreSyncService = new FirestoreSyncService();
