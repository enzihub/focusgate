import { create } from 'zustand';

interface UserPrefHourState {
  preferredHour: number;
  setPreferredHour: (value: number) => void;
}

// Create a store for UserPrefHourState state to store the phone number
export const usePrefHourState = create<UserPrefHourState>((set) => ({
  preferredHour: 0,
  setPreferredHour: (value) => set({ preferredHour: value }),
}));
