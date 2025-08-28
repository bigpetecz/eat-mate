import { Card } from '@/components/ui/card';
import { SettingsForm } from './SettingsForm';
import PrivatePage from '@/components/auth/PrivatePage';
import { getUser } from '../auth/getUser';
import { getDictionary } from '@/dictionaries/dictionaries';
import { Locale } from '@/i18n';

interface Props {
  params: Promise<{ language: Locale }>;
}

const SettingsPage = async ({ params }: Props) => {
  const user = await getUser();
  const { language } = await params;
  const dict = await getDictionary(language, 'settings');
  return (
    <PrivatePage user={user}>
      <div className="bg-muted min-h-[calc(100vh-8rem)]">
        <div className="flex w-full justify-center py-10 px-1">
          <Card className="w-full max-w-xl p-6 md:p-10 bg-background">
            <h1 className="text-2xl font-bold mb-6 text-center">
              {dict.title}
            </h1>
            <p className="text-muted-foreground text-center mb-6">
              {dict.description}
            </p>
            <SettingsForm user={user} dict={dict} />
          </Card>
        </div>
      </div>
    </PrivatePage>
  );
};

export default SettingsPage;
