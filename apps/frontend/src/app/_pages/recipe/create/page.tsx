import { Card } from '@/components/ui/card';
import PrivatePage from '@/components/auth/PrivatePage';
import { CreateRecipeForm } from './create-recipe.form';
import { getDictionary } from '@/dictionaries/dictionaries';
import { Locale } from '@/i18n';
import { getAuthenticatedUser } from '@/lib/server-api';
import { User } from '@/app/auth/authStore';

interface Props {
  params: Promise<{ language: Locale }>;
}

const CreateRecipePage = async ({ params }: Props) => {
  const user = (await getAuthenticatedUser()) as User | null;
  const { language } = await params;
  const dict = await getDictionary(language, 'create-recipe');
  const formDict = await getDictionary(language, 'recipe-form');
  return (
    <PrivatePage user={user}>
      <div className="bg-muted min-h-[calc(100vh-8rem)] w-full">
        <div className="py-8 max-w-5xl mx-auto px-2 md:px-0">
          <Card className="bg-background max-w-2xl mx-auto p-8">
            <h1 className="text-2xl font-bold text-center">{dict.title}</h1>
            <p className="text-muted-foreground text-center">
              {dict.description}
            </p>
            <CreateRecipeForm language={language} user={user} dict={formDict} />
          </Card>
        </div>
      </div>
    </PrivatePage>
  );
};

export default CreateRecipePage;
