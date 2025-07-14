import './globals.css';
import './i18n';
import { Logo } from '@/components/brand/logo';
import { Navigation } from '@/components/navigation/navigation';
import { UserMenu } from '@/components/navigation/user-menu';
import { Toaster } from '@/components/ui/toaster';
import Link from 'next/link';
import { getUser } from './auth/getUser';
import { Analytics } from '@vercel/analytics/next';
import { ThemeProvider } from 'next-themes';

export const metadata = {
  title: 'Eat Mate - Your source for delicious recipes',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="w-full">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <header className="site-header fixed top-0 flex justify-between items-center px-6 h-16 border-b z-30 bg-background/80 backdrop-blur shadow-sm w-full">
            <Link href="/" aria-label="Home">
              <Logo />
            </Link>
            <div className="flex-1 flex justify-start pl-32">
              <Navigation />
              <div className="ml-auto">
                <UserMenu user={user} />
              </div>
            </div>
          </header>
          <main className="pt-16 min-h-[calc(100vh-4rem)]">
            {children}
            <Analytics />
          </main>
          <Toaster />
          <footer className="border-t px-6 py-4 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Eat Mate. All rights reserved.
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
