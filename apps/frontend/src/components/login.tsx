import { Locale } from '@/i18n';
import { getDictionary } from '@/dictionaries/dictionaries';
import { LoginFormClient } from './login-client';

export async function LoginForm({
  className,
  language,
  ...props
}: React.ComponentProps<'div'> & { language: Locale }) {
  const dictionary = await getDictionary(language, 'sign-in');
  return (
    <LoginFormClient className={className} dictionary={dictionary} {...props} />
  );
}
