'use client';
import { useEffect } from 'react';
import apiClient from '../apiClient';
import { Spinner } from '@/components/ui/spinner';
import { useAuthStore } from '../auth/authStore';

export default function LogoutPage() {
  const logout = useAuthStore((s) => s.logout);
  useEffect(() => {
    apiClient.post('/auth/logout').finally(() => {
      logout();
      window.location.replace('/');
    });
  }, [logout]);
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-lg">
      <Spinner />
    </div>
  );
}
