'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

  useEffect(() => {
    const state = searchParams.get('state') || '/';
    const safeState = state.startsWith('/') ? state : '/';
    router.replace(safeState);
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner />
    </div>
  );
}
