import { useEffect } from 'react';
import { ReactNode } from 'react';
import { useAuthStore } from '@/app/auth/authStore';
import { useRouter } from 'next/navigation';

interface PrivatePageProps {
  children: ReactNode;
}

export default function PrivatePage({ children }: PrivatePageProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/sign-in');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <span>Loading...</span>
      </div>
    );
  }

  return <>{children}</>;
}
