import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Batch } from './types';

interface AppState {
  currentBatch: Batch | null;
  currentAnimalIndex: number;
  activeTab: 'setup' | 'collection' | 'summary' | 'history' | 'dashboard' | 'science';
  setCurrentBatch: (batch: Batch | null) => void;
  setCurrentAnimalIndex: (index: number) => void;
  setActiveTab: (tab: 'setup' | 'collection' | 'summary' | 'history' | 'dashboard' | 'science') => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentBatch: null,
      currentAnimalIndex: 1,
      activeTab: 'setup',
      setCurrentBatch: (batch) => set({ currentBatch: batch, currentAnimalIndex: 1 }),
      setCurrentAnimalIndex: (index) => set({ currentAnimalIndex: index }),
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: 'monitoria-abate-storage', // name of the item in the storage (must be unique)
    }
  )
);

