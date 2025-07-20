import './globals.css';
import './i18n';
import { Toaster } from '@/components/ui/toaster';
import { Header } from './Header';
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
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="w-full">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Header />
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
