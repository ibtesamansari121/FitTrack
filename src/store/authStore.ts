// src/store/authStore.ts
import { create } from "zustand";

interface AuthState {
  user: null | {
    uid: string;
    email: string | null;
    displayName?: string | null;
    photoURL?: string | null;
  };
  setUser: (user: AuthState["user"]) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
