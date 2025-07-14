'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore, User } from '@/app/auth/authStore';
import { BookIcon, LogInIcon, SettingsIcon } from 'lucide-react';
import { FC } from 'react';

interface UserProps {
  user: User;
}

export const UserMenu: FC<UserProps> = ({ user }) => {
  const { t } = useTranslation();
  const logout = useAuthStore((s) => s.logout);
  const handleLogout = async () => {
    try {
      await fetch('api/auth/logout', {
        method: 'POST',
        cache: 'no-store',
        credentials: 'include',
      });
      logout();
      window.location.replace('/'); // Forces a full reload and user re-fetch
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  const initials = user?.displayName
    ? user.displayName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="cursor-pointer">
        <button
          type="button"
          className="flex items-center gap-2 px-2 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage
              src={user?.picture || ''}
              alt={user?.displayName || 'User'}
            />
            <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
          </Avatar>
          <span className="truncate font-medium text-sm">
            {user?.displayName || t('Account')}
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        {user ? (
          <>
            <div className="px-3 py-2">
              <div className="font-medium text-base">{user.displayName}</div>
              {user.email && (
                <div className="text-xs text-muted-foreground">
                  {user.email}
                </div>
              )}
            </div>
            <DropdownMenuSeparator />
            <Link href="/settings">
              <DropdownMenuItem className="cursor-pointer">
                <SettingsIcon className="size-4" />
                {t('Settings')}
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogInIcon className="size-4" />
              {t('Logout')}
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <Link href="/sign-in">
              <DropdownMenuItem className="cursor-pointer">
                <LogInIcon className="size-4" />
                {t('Login')}
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <Link href="/sign-up">
              <DropdownMenuItem asChild className="cursor-pointer">
                <div className="flex items-center gap-2">
                  <BookIcon className="size-4" />
                  {t('Sign up')}
                </div>
              </DropdownMenuItem>
            </Link>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
