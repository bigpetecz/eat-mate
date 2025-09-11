import '../globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Analytics } from '@vercel/analytics/next';
import { ThemeProvider } from 'next-themes';
import { Locale } from '@/i18n';
import { getDictionary } from '@/dictionaries/dictionaries';
import { Header } from '@/components/navigation/header';

export const metadata = {
  title: 'Eat Mate - Your source for delicious recipes',
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ language: Locale }>;
}) {
  const { language } = await params;

  const commonDictionary = await getDictionary(language, 'common');

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Header commonDictionary={commonDictionary} language={language} />
      <main className="pt-16 min-h-[calc(100vh-4rem)]">
        {children}
        <Analytics />
      </main>
      <Toaster />
      <footer className="bg-muted border-t px-6 py-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Eat Mate.{' '}
        {commonDictionary.allRightsReserved}.
      </footer>
    </ThemeProvider>
  );
}
