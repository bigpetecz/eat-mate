// Centralized recipe-related enums

// Supported languages for recipes
export type RecipeLanguage = 'en' | 'cs';

// Wine pairing options
export enum WinePairing {
  CabernetSauvignon = 'cabernet-sauvignon',
  PinotNoir = 'pinot-noir',
  Merlot = 'merlot',
  Chardonnay = 'chardonnay',
  SauvignonBlanc = 'sauvignon-blanc',
  Riesling = 'riesling',
  Syrah = 'syrah',
  Zinfandel = 'zinfandel',
  Rosé = 'rosé',
  Sparkling = 'sparkling',
  DessertWine = 'dessert-wine',
}

// Cooking techniques
export enum Technique {
  Boiling = 'boiling',
  Blanching = 'blanching',
  Steaming = 'steaming',
  Poaching = 'poaching',
  Simmering = 'simmering',
  Stewing = 'stewing',
  Braising = 'braising',
  Roasting = 'roasting',
  Baking = 'baking',
  Grilling = 'grilling',
  Broiling = 'broiling',
  Sauteing = 'sauteing',
  StirFrying = 'stir-frying',
  DeepFrying = 'deep-frying',
  PanFrying = 'pan-frying',
  Smoking = 'smoking',
  Pickling = 'pickling',
  Fermenting = 'fermenting',
  SousVide = 'sous-vide',
  Raw = 'raw',
}

// Dietary labels
export enum DietLabel {
  Vegetarian = 'vegetarian',
  Vegan = 'vegan',
  Pescatarian = 'pescatarian',
  GlutenFree = 'gluten-free',
  DairyFree = 'dairy-free',
  NutFree = 'nut-free',
  SoyFree = 'soy-free',
  LowCarb = 'low-carb',
  LowFat = 'low-fat',
  Paleo = 'paleo',
  Keto = 'keto',
  Whole30 = 'whole30',
  Halal = 'halal',
  Kosher = 'kosher',
}

// Special recipe attributes
export enum SpecialAttribute {
  OnePot = 'one-pot',
  OnePan = 'one-pan',
  SlowCooker = 'slow-cooker',
  InstantPot = 'instant-pot',
  AirFryer = 'air-fryer',
  NoCook = 'no-cook',
  FreezerFriendly = 'freezer-friendly',
  MealPrep = 'meal-prep',
  ThirtyMinute = '30-minute',
  FiveIngredients = '5-ingredients',
  KidFriendly = 'kid-friendly',
}
