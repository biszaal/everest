import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { uuid } from '@/services/local/db';
import type { AuthUser } from '@/types';

const DEVICE_ID_KEY = 'everest.deviceId';

const storage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) ?? null;
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

let cachedUserId: string | null = null;

const readDeviceId = async (): Promise<string | null> => {
  if (cachedUserId) return cachedUserId;
  const stored = await storage.get(DEVICE_ID_KEY);
  cachedUserId = stored;
  return stored;
};

const toAuthUser = (id: string): AuthUser => ({ userId: id, email: '' });

export const authService = {
  async getSession(): Promise<{ data: { session: { user: { id: string; email: string } } | null } }> {
    const id = await readDeviceId();
    if (!id) return { data: { session: null } };
    return { data: { session: { user: { id, email: '' } } } };
  },

  async signInAnonymously(): Promise<void> {
    const existing = await readDeviceId();
    if (existing) return;
    const id = uuid();
    await storage.set(DEVICE_ID_KEY, id);
    cachedUserId = id;
  },

  async signOut(): Promise<void> {
    await storage.remove(DEVICE_ID_KEY);
    cachedUserId = null;
  },

  onAuthStateChange(_cb: (user: AuthUser | null) => void): () => void {
    // Local mode has no background auth changes — nothing to subscribe to.
    return () => undefined;
  },
};

export const getCurrentUserId = async (): Promise<string> => {
  const id = await readDeviceId();
  if (!id) throw new Error('No local device id yet. Bootstrap must run first.');
  return id;
};

// Expose toAuthUser for anyone that needs to build an AuthUser synchronously from an id.
export const asAuthUser = toAuthUser;
