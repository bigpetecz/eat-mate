import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { Navigation } from '@/components/navigation/navigation';
import { UserMenu } from '@/components/navigation/user-menu';
import { getUser } from './auth/getUser';
import { MobileMenu } from './MobileMenu';

export async function Header() {
  const user = await getUser();
  return (
    <header className="site-header fixed top-0 flex justify-between items-center px-4 md:px-6 h-16 border-b z-30 bg-background/80 backdrop-blur shadow-sm w-full">
      {/* Logo: show smaller or alternate logo on mobile */}
      <Link href="/" aria-label="Home" className="flex items-center">
        <span className="block md:hidden">
          <Logo className="h-8 w-auto" small />
        </span>
        <span className="hidden md:block">
          <Logo className="h-10 w-auto" />
        </span>
      </Link>
      {/* Desktop navigation */}
      <div className="hidden md:flex flex-1 justify-start pl-32">
        <Navigation />
        <div className="ml-auto">
          <UserMenu user={user} />
        </div>
      </div>
      {/* Mobile hamburger menu */}
      <div className="md:hidden flex items-center">
        <MobileMenu user={user} />
      </div>
    </header>
  );
}
