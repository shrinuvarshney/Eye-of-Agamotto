/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  Firestore,
  setLogLevel,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore using the specific firestoreDatabaseId from config
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Suppress internal SDK connection retry logs while running in offline/local cache mode
setLogLevel('silent');

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Google Auth Provider setup
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Enum for operation types conforming to Firebase skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Checks if an error is an offline, network connectivity, or token propagation failure.
 */
export function isOfflineOrTokenError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const code = (error as { code?: string })?.code || '';
  return (
    msg.includes('client is offline') ||
    msg.includes('the client is offline') ||
    msg.includes('failed to get document because the client is offline') ||
    msg.includes('could not reach cloud firestore backend') ||
    msg.includes('token-service-api-has-not-been-used') ||
    msg.includes('fetching auth token failed') ||
    code === 'unavailable' ||
    code === 'failed-precondition' ||
    code === 'network-request-failed' ||
    code === 'auth/network-request-failed'
  );
}

/**
 * Checks if an error is a security rule / permissions failure.
 */
export function isPermissionError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const code = (error as { code?: string })?.code || '';
  return (
    code === 'permission-denied' ||
    msg.includes('permission') ||
    msg.includes('insufficient permissions') ||
    msg.includes('missing or insufficient')
  );
}

/**
 * Handles Firestore security / permission errors by throwing a structured JSON error string.
 */
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validates connectivity to Firestore at application boot time
 */
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline: please verify internet connection or Firebase setup.');
    } else {
      // Non-fatal if connection test doc is empty or restricted
      console.info('Firestore initialized successfully.');
    }
    return false;
  }
}

// Run connectivity check silently
testConnection().catch(() => {});
