'use client';

import { ReactNode, useEffect } from 'react';
import { useAuthStore } from './authStore';
import { User } from './authStore';

interface AuthProviderProps {
  initialUser: User | null;
  children: ReactNode;
}

export function normalizeInitialUser(user: User | null): User | null {
  if (user && !user._id && user.id) {
    return { ...user, _id: user.id };
  }
  return user;
}

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    const normalizedUser = normalizeInitialUser(initialUser);
    setUser(normalizedUser);

    if (normalizedUser?.language) {
      document.cookie = `locale=${normalizedUser.language}; path=/; max-age=31536000; samesite=lax`;
    }
  }, [initialUser, setUser]);

  return <>{children}</>;
}
