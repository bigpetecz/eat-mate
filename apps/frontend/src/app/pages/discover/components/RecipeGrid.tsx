import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { RecipeCard } from '@/components/recipe/recipe-card';
import type { Recipe } from '@/types/recipe';

interface RecipeGridProps {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
}

export const RecipeGrid = ({ recipes, loading, error }: RecipeGridProps) => (
  <div className="max-w-5xl mx-auto px-2 md:px-0 py-10">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {loading ? (
        <div className="col-span-full flex justify-center items-center py-12">
          <Spinner />
        </div>
      ) : error ? (
        <div className="col-span-full text-center py-12 text-destructive">
          {error}
        </div>
      ) : recipes.length === 0 ? (
        <Card className="col-span-full text-center py-12 text-muted-foreground">
          No recipes found. Try adjusting your filters.
        </Card>
      ) : (
        recipes.map((recipe) => <RecipeCard key={recipe._id} recipe={recipe} />)
      )}
    </div>
  </div>
);
