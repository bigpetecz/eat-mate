import { create } from 'zustand';

export interface User {
  id?: string;
  _id: string;
  displayName: string;
  email: string;
  theme: 'auto' | 'light' | 'dark';
  picture?: string;
  gender?: 'male' | 'female' | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  setUser: (user) =>
    set((state) => ({
      user,
      isAuthenticated: !!user,
    })),
  setToken: (token) =>
    set((state) => ({
      token,
      isAuthenticated: !!state.user,
    })),
  logout: () => set({ user: null, token: null, isAuthenticated: false }),
}));
