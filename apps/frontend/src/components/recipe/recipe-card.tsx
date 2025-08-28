import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Flame } from 'lucide-react';
import { Recipe } from '@/types/recipe';
import {
  dietLabels,
  techniquesOptions,
  specialAttributes,
} from '@/lib/recipe-labels';
import { useParams } from 'next/navigation';
import { getLocalizedRoute, Locale } from '@/i18n';

export interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const { language = 'en' } = useParams();

  return (
    <Link
      href={getLocalizedRoute('recipeDetail', language as Locale, recipe.slug)}
      className="contents"
    >
      <Card className="pt-0 pb-2 px-0">
        <CardContent className="p-0">
          {recipe.images?.[0] ? (
            <Image
              src={recipe.images[0]}
              alt={recipe.title}
              width={600}
              height={256}
              className="w-full h-64 object-cover rounded-t-lg"
              priority={true}
            />
          ) : (
            <div className="rounded-lg w-full md:w-80 h-64 object-cover mb-4 md:mb-0 bg-background flex items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
          <div className="p-4 pb-0">
            <h3 className="text-xl font-semibold">{recipe.title}</h3>
            <p
              className="text-muted-foreground mt-2 line-clamp-2"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.5,
                height: '3em',
                maxHeight: '3em',
                minHeight: '3em',
              }}
            >
              {recipe.description}
            </p>
            <div
              className="flex flex-wrap gap-1 mt-2"
              style={{
                minHeight: '3.2em',
                maxHeight: '3.2em',
                alignItems: 'flex-start',
                overflow: 'hidden',
              }}
            >
              {recipe.mealType && (
                <Badge variant="default">{recipe.mealType}</Badge>
              )}
              {/* Show difficulty from ai if present, else from root */}
              {recipe.ai.difficulty && (
                <Badge variant="default">{recipe.ai.difficulty}</Badge>
              )}
              {recipe.country && (
                <Badge variant="outline">{recipe.country}</Badge>
              )}
              {recipe.ai.dietLabels?.map((d) => {
                const label = dietLabels.find((l) => l.value === d)?.label || d;
                return (
                  <Badge key={d} variant="secondary">
                    {label}
                  </Badge>
                );
              })}
              {recipe.ai.techniques?.map((t) => {
                const label =
                  techniquesOptions.find((l) => l.value === t)?.label || t;
                return (
                  <Badge key={t} variant="outline">
                    {label}
                  </Badge>
                );
              })}
              {recipe.ai.specialAttributes?.map((s) => {
                const label =
                  specialAttributes.find((l) => l.value === s)?.label || s;
                return (
                  <Badge key={s} variant="secondary">
                    {label}
                  </Badge>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {recipe.prepTime} min + {recipe.cookTime} min
              </span>
              <span className="flex items-center gap-3">
                {recipe.ai.nutrition.calories != null && (
                  <span className="flex items-center gap-1">
                    <Flame className="w-4 h-4" />
                    {recipe.ai.nutrition.calories} kcal
                  </span>
                )}
                {/* Show estimated cost in EUR if present */}
                {recipe.ai.estimatedCost != null && (
                  <span className="flex items-center gap-1">
                    <span>€{recipe.ai.estimatedCost}</span>
                  </span>
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
