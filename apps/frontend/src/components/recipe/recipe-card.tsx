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
import { cn } from '@/lib/utils';
import {
  getRecipeOriginSummary,
  getRecipeOriginTheme,
  hasRecipeOrigin,
} from '@/lib/recipe-origin';
import { RecipeOriginBadge } from './recipe-origin-badge';

export interface RecipeCardProps {
  recipe: Recipe;
  sourceContext?: 'discover' | 'favorites' | 'my-recipes';
  returnTo?: string;
}

export function RecipeCard({
  recipe,
  sourceContext,
  returnTo,
}: RecipeCardProps) {
  const params = useParams();
  const language =
    typeof params?.language === 'string' ? params.language : 'en';
  const originTheme = getRecipeOriginTheme(recipe.sourceType);
  const originSummary = getRecipeOriginSummary(recipe, language);
  const showsOrigin = hasRecipeOrigin(recipe);
  const recipeDetailUrl = getLocalizedRoute(
    'recipeDetail',
    language as Locale,
    recipe.slug,
  );
  const detailParams = new URLSearchParams();

  if (sourceContext) {
    detailParams.set('source', sourceContext);
  }

  if (returnTo) {
    detailParams.set('returnTo', returnTo);
  }

  const recipeHref =
    detailParams.size > 0
      ? `${recipeDetailUrl}?${detailParams.toString()}`
      : recipeDetailUrl;

  return (
    <Link href={recipeHref} className="contents">
      <Card
        className={cn(
          'relative overflow-hidden pt-0 pb-2 px-0 transition-colors',
          originTheme?.cardClassName,
        )}
      >
        {showsOrigin && originTheme ? (
          <div
            aria-hidden="true"
            className={cn(
              'absolute inset-y-0 left-0 z-10 w-1',
              originTheme.accentClassName,
            )}
          />
        ) : null}
        <CardContent className="p-0">
          <div className="relative">
            <RecipeOriginBadge
              sourceType={recipe.sourceType}
              language={language}
            />
            {recipe.images?.[0] ? (
              <Image
                src={recipe.images[0]}
                alt={recipe.title}
                width={600}
                height={256}
                className="h-64 w-full object-cover rounded-t-lg"
                priority={true}
              />
            ) : (
              <div className="flex h-64 w-full items-center justify-center rounded-lg bg-background text-muted-foreground md:w-80">
                No image
              </div>
            )}
          </div>
          <div className="p-4 pb-0">
            <h3 className="text-xl font-semibold">{recipe.title}</h3>
            {originSummary ? (
              <p className="mt-1 line-clamp-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {originSummary}
              </p>
            ) : null}
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
              {recipe?.ai?.difficulty && (
                <Badge variant="default">{recipe.ai.difficulty}</Badge>
              )}
              {recipe.country && (
                <Badge variant="outline">{recipe.country}</Badge>
              )}
              {recipe.ai?.dietLabels?.map((d) => {
                const label = dietLabels.find((l) => l.value === d)?.label || d;
                return (
                  <Badge key={d} variant="secondary">
                    {label}
                  </Badge>
                );
              })}
              {recipe.ai?.techniques?.map((t) => {
                const label =
                  techniquesOptions.find((l) => l.value === t)?.label || t;
                return (
                  <Badge key={t} variant="outline">
                    {label}
                  </Badge>
                );
              })}
              {recipe.ai?.specialAttributes?.map((s) => {
                const label =
                  specialAttributes.find((l) => l.value === s)?.label || s;
                return (
                  <Badge key={s} variant="secondary">
                    {label}
                  </Badge>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {recipe.prepTime} min + {recipe.cookTime} min
              </span>
              <span className="flex items-center gap-3">
                {recipe.ai?.nutrition?.calories != null && (
                  <span className="flex items-center gap-1">
                    <Flame className="w-4 h-4" />
                    {recipe.ai.nutrition.calories} kcal
                  </span>
                )}
                {/* Show estimated cost in EUR if present */}
                {recipe.ai?.estimatedCost != null && (
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
