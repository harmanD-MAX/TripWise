import { create } from 'zustand';

export const useTripStore = create((set) => ({
  trips: [],
  currentTrip: null,
  isLoading: false,
  error: null,

  setTrips: (trips) => set({ trips }),
  setCurrentTrip: (trip) => set({ currentTrip: trip }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
