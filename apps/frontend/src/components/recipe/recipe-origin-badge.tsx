import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  getRecipeOriginBadgeLabel,
  getRecipeOriginTheme,
} from '@/lib/recipe-origin';
import type { RecipeSourceType } from '@/types/recipe';

interface RecipeOriginBadgeProps {
  sourceType?: RecipeSourceType;
  language?: string;
  className?: string;
}

export function RecipeOriginBadge({
  sourceType,
  language,
  className,
}: RecipeOriginBadgeProps) {
  const label = getRecipeOriginBadgeLabel(sourceType, language);
  const theme = getRecipeOriginTheme(sourceType);

  if (!label || !theme) {
    return null;
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'pointer-events-none absolute left-3 top-3 z-20 border font-semibold backdrop-blur-sm',
        theme.badgeClassName,
        className
      )}
    >
      {label}
    </Badge>
  );
}
