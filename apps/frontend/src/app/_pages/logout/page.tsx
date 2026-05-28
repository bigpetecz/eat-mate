'use client';
import { useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { useAuthStore } from '../../auth/authStore';
import { getLocalizedRoute, Locale } from '@/i18n';
import { useParams, useRouter } from 'next/navigation';

export default function LogoutPage() {
  const [showSlowMessage, setShowSlowMessage] = useState(false);
  const router = useRouter();
  const params = useParams();
  const language =
    typeof params?.language === 'string' ? (params.language as Locale) : 'en';
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    let isCancelled = false;
    const messageTimeoutId = window.setTimeout(() => {
      if (!isCancelled) {
        setShowSlowMessage(true);
      }
    }, 2500);

    const runLogout = async () => {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 4000);

      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal,
        });
      } catch {
        // Continue regardless so users are never stuck on this page.
      } finally {
        window.clearTimeout(timeoutId);
        if (!isCancelled) {
          setShowSlowMessage(false);
          logout();
          router.replace(getLocalizedRoute('homepage', language));
          router.refresh();
        }
      }
    };

    runLogout();

    return () => {
      isCancelled = true;
      window.clearTimeout(messageTimeoutId);
    };
  }, [language, logout, router]);
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-lg gap-2">
      <Spinner />
      {showSlowMessage && (
        <p className="text-sm text-muted-foreground">
          Logging you out... this is taking a bit longer than expected.
        </p>
      )}
    </div>
  );
}
