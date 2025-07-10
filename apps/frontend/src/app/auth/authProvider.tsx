import { ReactNode, useEffect, useState } from 'react';
import { useAuthStore } from './authStore';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const setUser = useAuthStore((s) => s.setUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const user = await res.json();
          setUser(user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [setUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <span>Loading...</span>
      </div>
    );
  }

  return <>{children}</>;
}
