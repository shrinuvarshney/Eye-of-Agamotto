/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider, isOfflineOrTokenError } from '../services/firebase';
import { firestoreSyncService } from '../services/firestoreSyncService';
import { storageService } from '../services/storageService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authError: string | null;
  isSyncing: boolean;
  isCloudConnected: boolean;
  lastSyncedAt: Date | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  clearAuthError: () => void;
  manualSync: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(
    firestoreSyncService.getIsCloudConnected()
  );
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  useEffect(() => {
    return firestoreSyncService.subscribeToConnectionStatus(setIsCloudConnected);
  }, []);

  // Listen to Auth State changes & persist session
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        setUser(firebaseUser);
        storageService.setActiveUser(firebaseUser ? firebaseUser.uid : null);
        if (firebaseUser) {
          setIsSyncing(true);
          try {
            await firebaseUser.getIdToken();
          } catch (tokenErr) {
            if (isOfflineOrTokenError(tokenErr)) {
              console.warn('[AuthContext] Auth token service is initializing or offline.');
            }
          }

          try {
            // First migrate local demo data safely if needed, or pull cloud collections
            await firestoreSyncService.syncOrMigrateUserData(firebaseUser.uid, {
              displayName: firebaseUser.displayName,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
            });
            // Attach real-time Firestore listeners for this user
            firestoreSyncService.initUserListeners(firebaseUser.uid);
            setLastSyncedAt(new Date());
          } catch (err) {
            if (isOfflineOrTokenError(err)) {
              console.info('[AuthContext] Cloud sync operating in offline mode.');
              firestoreSyncService.initUserListeners(firebaseUser.uid);
            } else {
              console.error('Error during initial user sync:', err);
              setAuthError('Failed to synchronize cloud workspace data.');
            }
          } finally {
            setIsSyncing(false);
          }
        } else {
          firestoreSyncService.cleanupListeners();
          setIsSyncing(false);
        }
        setLoading(false);
      },
      (error) => {
        console.error('onAuthStateChanged error:', error);
        setAuthError(error.message);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
      firestoreSyncService.cleanupListeners();
    };
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      // Use popup authentication as recommended for AI Studio environment
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      console.error('Google Sign-In error:', err);
      let errorMsg = 'Failed to sign in with Google. Please try again.';
      if (err instanceof Error) {
        if (err.message.includes('popup-closed-by-user')) {
          errorMsg = 'Sign-in window was closed before completion.';
        } else if (err.message.includes('popup-blocked')) {
          errorMsg = 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
        } else {
          errorMsg = err.message;
        }
      }
      setAuthError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      firestoreSyncService.cleanupListeners();
      await signOut(auth);
    } catch (err: unknown) {
      console.error('Sign-out error:', err);
      setAuthError(err instanceof Error ? err.message : 'Failed to sign out.');
    } finally {
      setLoading(false);
    }
  };

  const manualSync = async () => {
    if (!user) return;
    setIsSyncing(true);
    setAuthError(null);
    try {
      await firestoreSyncService.syncOrMigrateUserData(user.uid, {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      });
      setLastSyncedAt(new Date());
    } catch (err: unknown) {
      if (isOfflineOrTokenError(err)) {
        console.info('[AuthContext] Manual sync: Cloud Firestore is operating in offline mode.');
      } else {
        console.error('Manual sync error:', err);
        setAuthError(err instanceof Error ? err.message : 'Sync failed.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        isSyncing,
        isCloudConnected,
        lastSyncedAt,
        signInWithGoogle,
        signOutUser,
        clearAuthError,
        manualSync,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
