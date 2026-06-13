import type {
  Recipe,
  RecipeRightsStatus,
  RecipeSourceType,
} from '@/types/recipe';

export function isRecipeOriginFeatureEnabled() {
  return process.env.NEXT_PUBLIC_RECIPE_ORIGIN_ENABLED === 'true';
}

type SupportedLanguage = 'en' | 'cs';

type OriginTheme = {
  badgeClassName: string;
  cardClassName: string;
  accentClassName: string;
  panelClassName: string;
};

const originCopy = {
  en: {
    sourceType: {
      inspired_by_chef: 'Inspired by',
      adapted_from_external: 'Adapted from',
      licensed_partner: 'Licensed',
    },
    summaryPrefix: {
      inspired_by_chef: 'Inspired by',
      adapted_from_external: 'Adapted from',
      licensed_partner: 'Licensed from',
    },
    rightsStatus: {
      attributed: 'Attributed',
      licensed: 'Licensed',
    },
  },
  cs: {
    sourceType: {
      inspired_by_chef: 'Inspirace chefem',
      adapted_from_external: 'Převzato a upraveno',
      licensed_partner: 'Licencováno',
    },
    summaryPrefix: {
      inspired_by_chef: 'Inspirace od',
      adapted_from_external: 'Upraveno podle',
      licensed_partner: 'Licencováno od',
    },
    rightsStatus: {
      attributed: 'Uveden zdroj',
      licensed: 'Licencováno',
    },
  },
} satisfies Record<
  SupportedLanguage,
  {
    sourceType: Record<Exclude<RecipeSourceType, 'user_original'>, string>;
    summaryPrefix: Record<Exclude<RecipeSourceType, 'user_original'>, string>;
    rightsStatus: Record<Exclude<RecipeRightsStatus, 'unknown'>, string>;
  }
>;

const originThemes: Record<
  Exclude<RecipeSourceType, 'user_original'>,
  OriginTheme
> = {
  inspired_by_chef: {
    badgeClassName:
      'border-amber-300 bg-amber-50/95 text-amber-950 shadow-sm transition-colors hover:border-amber-400 hover:bg-amber-100 hover:text-amber-950 dark:border-amber-400/50 dark:bg-amber-950/55 dark:text-amber-50 dark:shadow-none dark:hover:border-amber-300/70 dark:hover:bg-amber-900/70 dark:hover:text-amber-50',
    cardClassName:
      'border-amber-300/70 bg-gradient-to-b from-amber-50/45 to-card transition-colors hover:border-amber-400/80 hover:from-amber-50/65 hover:to-card dark:border-amber-900/60 dark:from-amber-950/45 dark:to-background dark:hover:border-amber-700/70 dark:hover:from-amber-900/60 dark:hover:to-background',
    accentClassName: 'bg-amber-400 dark:bg-amber-500',
    panelClassName:
      'border-amber-200 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/35',
  },
  adapted_from_external: {
    badgeClassName:
      'border-sky-300 bg-sky-50/95 text-sky-950 shadow-sm transition-colors hover:border-sky-400 hover:bg-sky-100 hover:text-sky-950 dark:border-sky-400/50 dark:bg-sky-950/55 dark:text-sky-50 dark:shadow-none dark:hover:border-sky-300/70 dark:hover:bg-sky-900/70 dark:hover:text-sky-50',
    cardClassName:
      'border-sky-300/70 bg-gradient-to-b from-sky-50/45 to-card transition-colors hover:border-sky-400/80 hover:from-sky-50/65 hover:to-card dark:border-sky-900/60 dark:from-sky-950/45 dark:to-background dark:hover:border-sky-700/70 dark:hover:from-sky-900/60 dark:hover:to-background',
    accentClassName: 'bg-sky-400 dark:bg-sky-500',
    panelClassName:
      'border-sky-200 bg-sky-50/60 dark:border-sky-900/60 dark:bg-sky-950/35',
  },
  licensed_partner: {
    badgeClassName:
      'border-emerald-300 bg-emerald-50/95 text-emerald-950 shadow-sm transition-colors hover:border-emerald-400 hover:bg-emerald-100 hover:text-emerald-950 dark:border-emerald-400/50 dark:bg-emerald-950/55 dark:text-emerald-50 dark:shadow-none dark:hover:border-emerald-300/70 dark:hover:bg-emerald-900/70 dark:hover:text-emerald-50',
    cardClassName:
      'border-emerald-300/80 bg-gradient-to-b from-emerald-50/50 to-card transition-colors hover:border-emerald-400/80 hover:from-emerald-50/70 hover:to-card dark:border-emerald-900/60 dark:from-emerald-950/45 dark:to-background dark:hover:border-emerald-700/70 dark:hover:from-emerald-900/60 dark:hover:to-background',
    accentClassName: 'bg-emerald-500 dark:bg-emerald-500',
    panelClassName:
      'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/35',
  },
};

function normalizeLanguage(language?: string): SupportedLanguage {
  return language === 'cs' ? 'cs' : 'en';
}

export function hasRecipeOrigin(recipe: Pick<Recipe, 'sourceType'>) {
  if (!isRecipeOriginFeatureEnabled()) {
    return false;
  }

  return Boolean(recipe.sourceType && recipe.sourceType !== 'user_original');
}

export function getRecipeOriginBadgeLabel(
  sourceType?: RecipeSourceType,
  language?: string,
) {
  if (!isRecipeOriginFeatureEnabled()) {
    return null;
  }

  if (!sourceType || sourceType === 'user_original') {
    return null;
  }

  const copy = originCopy[normalizeLanguage(language)];

  return copy.sourceType[sourceType];
}

export function getRecipeOriginSummary(
  recipe: Pick<Recipe, 'sourceType' | 'sourceName' | 'attributionText'>,
  language?: string,
) {
  if (!isRecipeOriginFeatureEnabled()) {
    return null;
  }

  if (!recipe.sourceType || recipe.sourceType === 'user_original') {
    return null;
  }

  const attributionText = recipe.attributionText?.trim();

  if (attributionText) {
    return attributionText;
  }

  const copy = originCopy[normalizeLanguage(language)];
  const prefix = copy.summaryPrefix[recipe.sourceType];

  if (recipe.sourceName?.trim()) {
    return `${prefix} ${recipe.sourceName.trim()}`;
  }

  return prefix;
}

export function getRecipeOriginRightsLabel(
  rightsStatus?: RecipeRightsStatus,
  language?: string,
) {
  if (!isRecipeOriginFeatureEnabled()) {
    return null;
  }

  if (!rightsStatus || rightsStatus === 'unknown') {
    return null;
  }

  const copy = originCopy[normalizeLanguage(language)];

  return copy.rightsStatus[rightsStatus];
}

export function getRecipeOriginTheme(sourceType?: RecipeSourceType) {
  if (!isRecipeOriginFeatureEnabled()) {
    return null;
  }

  if (!sourceType || sourceType === 'user_original') {
    return null;
  }

  return originThemes[sourceType];
}
