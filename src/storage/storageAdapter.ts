import AsyncStorage from '@react-native-async-storage/async-storage';

export interface KeyValueStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  clear?: () => Promise<void>;
}

/**
 * In-memory fallback storage used during unit testing or non-React-Native environments.
 */
export class MemoryStorage implements KeyValueStorage {
  private store = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

/**
 * Returns the default persistent AsyncStorage client, safely wrapping operations.
 */
class DefaultAsyncStorageAdapter implements KeyValueStorage {
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      // Storage full or quota exceeded
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // Ignore removal failure
    }
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch {
      // Ignore clear failure
    }
  }
}

export const defaultStorage: KeyValueStorage = new DefaultAsyncStorageAdapter();
