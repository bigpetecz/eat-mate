'use client';
import { useEffect } from 'react';
import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/app/auth/authStore';

interface PrivatePageProps {
  user: User;
  children: ReactNode;
}

export default function PrivatePage({ user, children }: PrivatePageProps) {
  const router = useRouter();

  useEffect(() => {
    if (user === null) {
      router.replace('/sign-in');
    }
  }, [user, router]);

  return <>{children}</>;
}
