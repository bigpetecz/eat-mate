import { create } from 'zustand';
import { useEffect, useState } from 'react';
import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  _id: string;
  displayName: string;
  email: string;
  avatar?: string;
  // Add more fields as needed
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
      isAuthenticated: !!user && !!state.token,
    })),
  setToken: (token) =>
    set((state) => ({
      token,
      isAuthenticated: !!token && !!state.user,
    })),
  logout: () => set({ user: null, token: null, isAuthenticated: false }),
}));
