// src/store/authStore.ts
import { create } from "zustand";

interface AuthState {
  user: null | {
    uid: string;
    email: string | null;
    displayName?: string | null;
    photoURL?: string | null;
  };
  isLoading: boolean;
  setUser: (user: AuthState["user"]) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true, // Start with loading state
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
  logout: () => set({ user: null, isLoading: false }),
}));
