import { Toaster } from '@/components/ui/toaster';
import { Analytics } from '@vercel/analytics/next';
import { ThemeProvider } from 'next-themes';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="w-full">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <main className="pt-16 min-h-[calc(100vh-4rem)]">
            {children}
            <Analytics />
          </main>
          <Toaster />
          <footer className="border-t px-6 py-4 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Eat Mate.{' '}
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
