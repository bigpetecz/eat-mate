'use client';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSwipeable } from 'react-swipeable';
import { FC, useState } from 'react';
import Link from 'next/link';
import { LogOut, Heart, Settings, Plus, LogInIcon, Book } from 'lucide-react';
import { User } from './auth/authStore';

interface MobileMenuProps {
  user: User;
}
export const MobileMenu: FC<MobileMenuProps> = ({ user }) => {
  const [open, setOpen] = useState(false);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => setOpen(false),
    trackTouch: true,
  });

  const mainItems = [
    { title: 'Add recipe', icon: Plus, url: '/recipe/create' },
    { title: 'Discover recipes', url: '/discover' },
  ];

  const userItems = [
    { title: 'Favorites', icon: Heart, url: '/favorites' },
    { title: 'Settings', icon: Settings, url: '/settings' },
    { title: 'Logout', icon: LogOut, url: '/logout' },
  ];

  const anonymousItems = [
    { title: 'Login', icon: LogInIcon, url: '/sign-in' },
    { title: 'Sign Up', icon: Book, url: '/sign-up' },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-xl">
          ☰
        </Button>
      </DialogTrigger>

      <DialogContent
        {...swipeHandlers}
        className="!p-0 !border-none !rounded-none min-h-[calc(100vh-8rem)] !bg-background flex flex-col"
      >
        <DialogTitle className="text-2xl font-bold text-center mb-4">
          Menu
        </DialogTitle>

        <div className="flex flex-col gap-3 mb-6">
          {mainItems.map((item) => (
            <Link href={item.url} key={item.title} passHref legacyBehavior>
              <Button
                variant="outline"
                size="lg"
                className="w-full justify-start text-xl py-5 font-bold shadow-md"
                onClick={() => setOpen(false)}
              >
                {item?.icon && <item.icon className="mr-3 w-6 h-6" />}
                <span>{item.title}</span>
              </Button>
            </Link>
          ))}
        </div>
        <h2 className="text-lg font-semibold text-center mb-2">
          {user ? 'Your Account' : 'Guest Options'}
        </h2>
        <div className="flex flex-col gap-2 mb-4">
          {user
            ? userItems.map((item) => (
                <Link href={item.url} key={item.title} passHref legacyBehavior>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full justify-start text-base py-3"
                    onClick={() => setOpen(false)}
                  >
                    <item.icon className="mr-2 w-5 h-5" />
                    <span>{item.title}</span>
                  </Button>
                </Link>
              ))
            : anonymousItems.map((item) => (
                <Link href={item.url} key={item.title} passHref legacyBehavior>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="w-full justify-start text-base py-3"
                    onClick={() => setOpen(false)}
                  >
                    <item.icon className="mr-2 w-5 h-5" />
                    <span>{item.title}</span>
                  </Button>
                </Link>
              ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
