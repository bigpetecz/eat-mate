import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  getRecipeOriginRightsLabel,
  getRecipeOriginSummary,
  getRecipeOriginTheme,
} from '@/lib/recipe-origin';
import type { Recipe } from '@/types/recipe';

interface RecipeOriginPanelProps {
  recipe: Recipe;
  language?: string;
  title: string;
  sourceLinkLabel: string;
}

export function RecipeOriginPanel({
  recipe,
  language,
  title,
  sourceLinkLabel,
}: RecipeOriginPanelProps) {
  const summary = getRecipeOriginSummary(recipe, language);
  const rightsLabel = getRecipeOriginRightsLabel(recipe.rightsStatus, language);
  const theme = getRecipeOriginTheme(recipe.sourceType);

  if (!summary || !theme) {
    return null;
  }

  return (
    <section
      aria-label={title}
      className={cn(
        'rounded-xl border px-4 py-4 md:px-5 md:py-5',
        theme.panelClassName
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {title}
          </p>
          <p className="text-sm font-medium text-foreground md:text-base">
            {summary}
          </p>
        </div>
        {rightsLabel ? (
          <Badge
            variant="outline"
            className={cn('border font-semibold', theme.badgeClassName)}
          >
            {rightsLabel}
          </Badge>
        ) : null}
      </div>
      {recipe.sourceUrl ? (
        <a
          href={recipe.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex text-sm font-medium text-foreground underline underline-offset-4 transition-opacity hover:opacity-80"
        >
          {sourceLinkLabel}
        </a>
      ) : null}
    </section>
  );
}
