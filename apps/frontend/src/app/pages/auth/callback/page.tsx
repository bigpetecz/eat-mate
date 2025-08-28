'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../authStore';
import { Spinner } from '@/components/ui/spinner';

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<Spinner className="min-h-screen" />}>
      <AuthCallbackInner />
    </Suspense>
  );
}

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    const state = searchParams.get('state') || '/';
    router.replace(state);
  }, [router, searchParams, setUser]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner />
    </div>
  );
}
