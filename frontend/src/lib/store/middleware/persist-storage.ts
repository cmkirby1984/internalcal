/**
 * Custom Storage for Zustand Persist Middleware
 * Handles localStorage with JSON serialization and error handling
 */

import type { PersistStorage, StorageValue } from 'zustand/middleware';

export const createStorage = <T>(prefix: string = 'motel_'): PersistStorage<T> => ({
  getItem: (name: string): StorageValue<T> | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const value = localStorage.getItem(`${prefix}${name}`);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.warn(`Failed to get item from storage: ${name}`, error);
      return null;
    }
  },

  setItem: (name: string, value: StorageValue<T>): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(`${prefix}${name}`, JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to set item in storage: ${name}`, error);
    }
  },

  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(`${prefix}${name}`);
    } catch (error) {
      console.warn(`Failed to remove item from storage: ${name}`, error);
    }
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const defaultStorage = createStorage<any>();

// Utilities for clearing persisted state
export const clearPersistedState = (storeName: string): void => {
  defaultStorage.removeItem(storeName);
};

export const clearAllPersistedState = (): void => {
  if (typeof window === 'undefined') return;
  
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('motel_')) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach((key) => localStorage.removeItem(key));
};

