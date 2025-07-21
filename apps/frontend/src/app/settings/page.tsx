import { Card } from '@/components/ui/card';
import { SettingsForm } from './SettingsForm';
import PrivatePage from '@/components/auth/PrivatePage';
import { getUser } from '../auth/getUser';

export default async function SettingsPage() {
  const user = await getUser();

  return (
    <PrivatePage user={user}>
      <div className="bg-muted min-h-[calc(100vh-8rem)]">
        <div className="flex w-full justify-center py-10 px-1">
          <Card className="w-full max-w-xl p-6 md:p-10 bg-background">
            <h1 className="text-2xl font-bold mb-6 text-center">Settings</h1>
            <SettingsForm user={user} />
          </Card>
        </div>
      </div>
    </PrivatePage>
  );
}
