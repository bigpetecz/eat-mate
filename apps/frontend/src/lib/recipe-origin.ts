import type {
  Recipe,
  RecipeRightsStatus,
  RecipeSourceType,
} from '@/types/recipe';

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
    badgeClassName: 'border-amber-300 bg-amber-50/95 text-amber-950 shadow-sm',
    cardClassName:
      'border-amber-300/70 bg-gradient-to-b from-amber-50/45 to-card',
    accentClassName: 'bg-amber-400',
    panelClassName: 'border-amber-200 bg-amber-50/60',
  },
  adapted_from_external: {
    badgeClassName: 'border-sky-300 bg-sky-50/95 text-sky-950 shadow-sm',
    cardClassName: 'border-sky-300/70 bg-gradient-to-b from-sky-50/45 to-card',
    accentClassName: 'bg-sky-400',
    panelClassName: 'border-sky-200 bg-sky-50/60',
  },
  licensed_partner: {
    badgeClassName:
      'border-emerald-300 bg-emerald-50/95 text-emerald-950 shadow-sm',
    cardClassName:
      'border-emerald-300/80 bg-gradient-to-b from-emerald-50/50 to-card',
    accentClassName: 'bg-emerald-500',
    panelClassName: 'border-emerald-200 bg-emerald-50/60',
  },
};

function normalizeLanguage(language?: string): SupportedLanguage {
  return language === 'cs' ? 'cs' : 'en';
}

export function hasRecipeOrigin(recipe: Pick<Recipe, 'sourceType'>) {
  return Boolean(recipe.sourceType && recipe.sourceType !== 'user_original');
}

export function getRecipeOriginBadgeLabel(
  sourceType?: RecipeSourceType,
  language?: string
) {
  if (!sourceType || sourceType === 'user_original') {
    return null;
  }

  const copy = originCopy[normalizeLanguage(language)];

  return copy.sourceType[sourceType];
}

export function getRecipeOriginSummary(
  recipe: Pick<Recipe, 'sourceType' | 'sourceName' | 'attributionText'>,
  language?: string
) {
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
  language?: string
) {
  if (!rightsStatus || rightsStatus === 'unknown') {
    return null;
  }

  const copy = originCopy[normalizeLanguage(language)];

  return copy.rightsStatus[rightsStatus];
}

export function getRecipeOriginTheme(sourceType?: RecipeSourceType) {
  if (!sourceType || sourceType === 'user_original') {
    return null;
  }

  return originThemes[sourceType];
}
