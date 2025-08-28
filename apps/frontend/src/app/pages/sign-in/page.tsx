import { LoginForm } from '@/components/login';
import { Locale } from '@/i18n';

interface SignInPageProps {
  params: Promise<{ language: Locale }>;
}

export default async function SignInPage({ params }: SignInPageProps) {
  const { language } = await params;

  return (
    <div className="bg-muted min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <LoginForm language={language} />
      </div>
    </div>
  );
}
