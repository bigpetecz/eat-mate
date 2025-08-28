'use client';
import { useForm } from 'react-hook-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getLocalizedRoute, Locale } from '@/i18n';
import { getDictionary } from '@/dictionaries/dictionaries';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
}

export default function RegisterPage() {
  const { language = 'en' } = useParams();
  const [dictionary, setDictionary] = useState<Record<string, string>>();

  useEffect(() => {
    const loadDictionary = async () => {
      const dict = await getDictionary(language as Locale, 'sign-up');
      setDictionary(dict);
    };
    loadDictionary();
  }, [language]);

  const t = (key: string) => dictionary?.[key] || key;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>();
  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = async (data: RegisterForm) => {
    setServerError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        setServerError(err.message || t('registrationFailed'));
        return;
      }
      window.location.replace('/sign-in');
    } catch (e) {
      setServerError(t('networkError'));
    }
  };

  if (!dictionary) {
    return null;
  }

  return (
    <div className="bg-muted min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription>{t('description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="name">{t('name')}</Label>
                  <Input
                    id="name"
                    {...register('name', { required: t('nameRequired') })}
                    autoComplete="name"
                  />
                  {errors.name && (
                    <span className="text-xs text-red-500">
                      {errors.name.message}
                    </span>
                  )}
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email', {
                      required: t('emailRequired'),
                      pattern: {
                        value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
                        message: t('invalidEmail'),
                      },
                    })}
                    autoComplete="email"
                  />
                  {errors.email && (
                    <span className="text-xs text-red-500">
                      {errors.email.message}
                    </span>
                  )}
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="password">{t('password')}</Label>
                  <Input
                    id="password"
                    type="password"
                    {...register('password', {
                      required: t('passwordRequired'),
                      minLength: {
                        value: 6,
                        message: t('passwordMinLength'),
                      },
                    })}
                    autoComplete="new-password"
                  />
                  {errors.password && (
                    <span className="text-xs text-red-500">
                      {errors.password.message}
                    </span>
                  )}
                </div>
                {serverError && (
                  <div className="text-xs text-red-500">{serverError}</div>
                )}
                <div className="flex flex-col items-center justify-between gap-1">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full cursor-pointer"
                  >
                    {isSubmitting ? t('signingUp') : t('signUp')}
                  </Button>
                  <span>{t('or')}</span>
                  <Button variant="outline" className="w-full cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path
                        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                        fill="currentColor"
                      />
                    </svg>
                    {t('signUpWithGoogle')}
                  </Button>
                </div>
              </div>
              <div className="mt-4 text-center text-sm">
                {t('alreadyHaveAccount')}{' '}
                <Link
                  href={getLocalizedRoute('login', language as Locale)}
                  className="underline underline-offset-4"
                >
                  {t('login')}
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
