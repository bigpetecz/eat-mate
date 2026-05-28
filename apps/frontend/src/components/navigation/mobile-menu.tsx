'use client';

import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { FC, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  LogOut,
  Heart,
  Settings,
  Plus,
  LogInIcon,
  Book,
  Menu as MenuIcon,
  PencilIcon,
} from 'lucide-react';
import { DialogTitle } from '@/components/ui/dialog';
import { useAuthStore } from '@/app/auth/authStore';
import { getLocalizedRoute, Locale } from '@/i18n';

export const MobileMenu: FC = () => {
  const [open, setOpen] = useState(false);
  const params = useParams();
  const language =
    typeof params?.language === 'string' ? (params.language as Locale) : 'en';

  const mainItems = [
    {
      title: 'Add Recipe',
      icon: Plus,
      url: getLocalizedRoute('recipeCreate', language),
    },
    {
      title: 'Discover Recipes',
      url: getLocalizedRoute('discover', language, {}),
    },
  ];

  const userItems = [
    {
      title: 'My Recipes',
      icon: PencilIcon,
      url: getLocalizedRoute('myRecipes', language),
    },
    {
      title: 'Favorite recipes',
      icon: Heart,
      url: getLocalizedRoute('favorites', language),
    },
    {
      title: 'Settings',
      icon: Settings,
      url: getLocalizedRoute('userSettings', language),
    },
    {
      title: 'Logout',
      icon: LogOut,
      url: getLocalizedRoute('logout', language),
    },
  ];

  const anonymousItems = [
    {
      title: 'Login',
      icon: LogInIcon,
      url: getLocalizedRoute('login', language),
    },
    {
      title: 'Sign Up',
      icon: Book,
      url: getLocalizedRoute('signUp', language),
    },
  ];

  const user = useAuthStore((s) => s.user);

  const handleClose = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <MenuIcon className="w-6 h-6" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-72 sm:w-80 p-6">
        <div className="space-y-6">
          <div>
            <DialogTitle className="mb-6">Menu</DialogTitle>
            <nav className="space-y-2 flex flex-col gap-2">
              {mainItems.map((item) => (
                <Link href={item.url} key={item.title}>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-base"
                    onClick={handleClose}
                  >
                    {item.icon && <item.icon className="mr-3 w-5 h-5" />}
                    {item.title}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>

          <div className="border-t pt-4">
            <h2 className="text-sm text-muted-foreground mb-2">
              {user ? 'Your Account' : 'Guest Options'}
            </h2>
            <nav className="space-y-2 flex flex-col gap-2">
              {(user ? userItems : anonymousItems).map((item) => (
                <Link href={item.url} key={item.title}>
                  <Button
                    variant={'outline'}
                    className="w-full justify-start text-base"
                    onClick={handleClose}
                  >
                    <item.icon className="mr-3 w-5 h-5" />
                    {item.title}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
