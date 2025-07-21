import EditRecipeForm from '../edit-recipe.form';
import PrivatePage from '@/components/auth/PrivatePage';
import { getUser } from '@/app/auth/getUser';
import { Card } from '@/components/ui/card';

const EditRecipePage = async () => {
  const user = await getUser();

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
          <EditRecipeForm user={user} />
        </Card>
      </div>
    </PrivatePage>
  );
};
export default EditRecipePage;
