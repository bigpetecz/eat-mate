import '../globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '../../components/navigation/header';
import { Analytics } from '@vercel/analytics/next';
import { ThemeProvider } from 'next-themes';
import { Locale } from '@/i18n';
import { getDictionary } from '@/dictionaries/dictionaries';

export const metadata = {
  title: 'Eat Mate - Your source for delicious recipes',
};

export async function generateStaticParams() {
  return [{ language: 'en' }, { langugage: 'cs' }];
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { language: Locale };
}) {
  const { language } = params;

  const commonDictionary = await getDictionary(language, 'common');

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Header commonDictionary={commonDictionary} language={language} />
      <main className="pt-16 min-h-[calc(100vh-4rem)]">
        {children}
        <Analytics />
      </main>
      <Toaster />
      <footer className="border-t px-6 py-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Eat Mate.{' '}
        {commonDictionary.allRightsReserved}.
      </footer>
    </ThemeProvider>
  );
}
