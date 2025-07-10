import { FC } from 'react';
import { Card } from '@/components/ui/card';
import PrivatePage from '@/components/auth/PrivatePage';
import { getUser } from '@/app/auth/getUser';
import RecipeForm from '@/components/recipe/RecipeForm';

const CreateRecipePage: FC = async () => {
  const user = await getUser();

  return (
    <PrivatePage user={user}>
      <div className="bg-muted min-h-[calc(100vh-8rem)] py-8">
        <Card className="max-w-2xl mx-auto p-8">
          <h1 className="text-2xl font-bold text-center">
            Create a New Recipe
          </h1>
          <p className="text-muted-foreground text-center">
            Take a moment to describe your recipe in detail! The more
            information you provide, the easier it will be for others to follow,
            enjoy, and appreciate your creation.
          </p>
          <RecipeForm
            user={user}
            defaultValues={{
              title: '',
              description: '',
              country: '',
              prepTime: 0,
              cookTime: 0,
              servings: 1,
              ingredients: [{ name: '', quantity: '' }],
              instructions: [''],
            }}
            // Remove onSubmit prop
          />
        </Card>
      </div>
    </PrivatePage>
  );
};

export default CreateRecipePage;
