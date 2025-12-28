import EditRecipeForm from './edit-recipe.form';
import PrivatePage from '@/components/auth/PrivatePage';
import { Card } from '@/components/ui/card';
import { recipeDetailDictionary } from '@/dictionaries/recipeDetail';
import { getDictionary } from '@/dictionaries/dictionaries';
import { getAuthenticatedUser } from '@/lib/server-api';
import { User } from '@/app/auth/authStore';

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{
    language: keyof typeof recipeDetailDictionary;
  }>;
}) {
  const user = (await getAuthenticatedUser()) as User | null;
  const { language } = await params;

  const formDict = await getDictionary(language, 'recipe-form');

  return (
    <PrivatePage user={user}>
      <div className="bg-muted min-h-[calc(100vh-8rem)] px-1 py-8">
        <Card className="bg-background max-w-2xl mx-auto p-8">
          <h1 className="text-2xl font-bold text-center">Edit Recipe</h1>
          <p className="text-muted-foreground text-center">
            Take a moment to describe your recipe in detail! The more
            information you provide, the easier it will be for others to follow,
            enjoy, and appreciate your creation.
          </p>
          <EditRecipeForm language={language} dict={formDict} user={user} />
        </Card>
      </div>
    </PrivatePage>
  );
}
