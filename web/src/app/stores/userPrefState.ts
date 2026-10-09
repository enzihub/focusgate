import { create } from 'zustand';

interface UserPrefState {
  prefs: any;
  setPrefs: (value: any) => void;
}

// Create a store for UserPrefHourState state to store the phone number
export const usePrefState = create<UserPrefState>((set) => ({
  prefs: {},
  setPrefs: (value) => set({ prefs: value }),
}));
