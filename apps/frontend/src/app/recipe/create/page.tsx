import { FC } from 'react';
import { Card } from '@/components/ui/card';
import PrivatePage from '@/components/auth/PrivatePage';
import { getUser } from '@/app/auth/getUser';
import { CreateRecipeForm } from './create-recipe.form';

const CreateRecipePage: FC = async () => {
  const user = await getUser();

  return (
    <PrivatePage user={user}>
      <div className="bg-muted min-h-[calc(100vh-8rem)] w-full">
        <div className="py-8 max-w-5xl mx-auto px-2 md:px-0">
          <Card className="p-4 md:p-8 bg-background">
            <h1 className="text-2xl font-bold text-center">
              Create a New Recipe
            </h1>
            <p className="text-muted-foreground text-center">
              Take a moment to describe your recipe in detail! The more
              information you provide, the easier it will be for others to
              follow, enjoy, and appreciate your creation.
            </p>
            <CreateRecipeForm user={user} />
          </Card>
        </div>
      </div>
    </PrivatePage>
  );
};

export default CreateRecipePage;
