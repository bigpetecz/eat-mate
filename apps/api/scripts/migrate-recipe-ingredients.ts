// --- Normalization and Fuzzy Matching Helpers ---
function normalizeName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Simple Levenshtein distance for fuzzy matching
function levenshtein(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = [];
  for (let i = 0; i <= bn; i++) matrix[i] = [i];
  for (let j = 0; j <= an; j++) matrix[0][j] = j;
  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[bn][an];
}

function findFuzzyMatch(
  name: string,
  candidates: string[],
  threshold = 2
): string | null {
  const norm = normalizeName(name);
  let best = null;
  let bestDist = Infinity;
  for (const cand of candidates) {
    const dist = levenshtein(norm, normalizeName(cand));
    if (dist < bestDist) {
      bestDist = dist;
      best = cand;
    }
  }
  return bestDist <= threshold ? best : null;
}
import 'dotenv/config';
import { config } from 'dotenv';
config({ path: ['apps/api/.env', 'apps/api/.env.local'] });

import mongoose from 'mongoose';
// Use plain-schemas for reference, but do not strictly type loaded data
import { Ingredient } from '../src/ingredients/schema/ingredient.schema';
import { Unit } from '../src/units/schema/unit.schema';
import { Translate } from '@google-cloud/translate/build/src/v2';
// Do not import RecipeSchema or anything from recipe.schema.ts

const MONGO_URI = process.env.MONGODB_URI;
const GOOGLE_KEY_PATH = process.env.GOOGLE_KEY_PATH;

async function main() {
  if (!MONGO_URI) throw new Error('MONGODB_URI not set');
  if (!GOOGLE_KEY_PATH) throw new Error('GOOGLE_KEY_PATH is not defined');
  await mongoose.connect(MONGO_URI);
  const dryRun = process.argv.includes('--dry-run');
  console.log(`Recipe ingredients migration starting. DryRun=${dryRun}`);

  const translate = new Translate({ keyFilename: GOOGLE_KEY_PATH });

  // Convert _id fields to string for type compatibility
  const allIngredients = (await Ingredient.find({}).lean()).map((i: any) => ({
    ...i,
    _id: i._id?.toString(),
    defaultName: typeof i.defaultName === 'string' ? i.defaultName : '',
    variants: Array.isArray(i.variants)
      ? i.variants.map((v: any) =>
          typeof v === 'object' && v && 'toString' in v
            ? v.toString()
            : String(v)
        )
      : [],
  }));
  const allUnits = (await Unit.find({}).lean()).map((u: any) => ({
    ...u,
    _id: u._id?.toString(),
    defaultName: typeof u.defaultName === 'string' ? u.defaultName : '',
    code: typeof u.code === 'string' ? u.code : '',
    category: u.category === null ? undefined : u.category,
    locales: u.locales === null ? undefined : u.locales,
  }));

  // Build lookup maps for fast matching (ENGLISH ONLY)
  // Use normalized names for matching
  const ingredientMap = new Map(
    allIngredients
      .filter(
        (i: any) =>
          i &&
          i._id &&
          typeof i.locales === 'object' &&
          i.locales !== null &&
          typeof (i.locales as { en?: unknown }).en === 'string'
      )
      .map((i: any) => [normalizeName((i.locales as { en: string }).en), i._id])
  );
  // Build a list of all unit codes and ENGLISH names for matching
  const unitList = allUnits.map((u: any) => {
    const names = [normalizeName(u.code), normalizeName(u.defaultName)];
    if (u.locales && typeof u.locales.en === 'string') {
      names.push(normalizeName(u.locales.en));
    }
    return {
      code: normalizeName(u.code),
      names,
      _id: u._id,
    };
  });

  // Use a minimal schema with constraints for migration
  const RecipeMigrationSchema = new mongoose.Schema(
    {
      title: { type: String, required: true },
      language: { type: String, required: true },
      slug: { type: String, required: true },
      description: { type: String, required: true },
      ingredients: [
        {
          ingredientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Ingredient',
          },
          quantity: { type: Number },
          unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' },
          name: { type: String },
        },
      ],
      // Add more fields as needed for your migration
    },
    { strict: false }
  );
  const Recipe = mongoose.model('Recipe', RecipeMigrationSchema, 'recipes');
  // Use type assertions for dynamic properties
  // Only process recipes in English
  const recipes = (await Recipe.find({ language: 'en' }).lean()).map((r) => {
    const rec = r as any;
    return {
      ...rec,
      _id: rec._id?.toString(),
      author:
        rec.author && typeof rec.author === 'object' && 'toString' in rec.author
          ? rec.author.toString()
          : rec.author,
      ingredients: Array.isArray(rec.ingredients)
        ? rec.ingredients.map((ing: any) => ({
            ...ing,
            ingredientId:
              ing.ingredientId &&
              typeof ing.ingredientId === 'object' &&
              'toString' in ing.ingredientId
                ? ing.ingredientId.toString()
                : ing.ingredientId,
            unit:
              ing.unit && typeof ing.unit === 'object' && 'toString' in ing.unit
                ? ing.unit.toString()
                : ing.unit,
          }))
        : [],
    };
  });

  let updated = 0;
  let matchedIngredients = 0;
  let matchedUnits = 0;
  let parsedQuantities = 0;
  const skippedFreeForm = 0;
  const unmatchedIngredients = new Set<string>();
  const unmatchedUnits = new Set<string>();
  for (const recipe of recipes) {
    let changed = false;
    for (const ing of recipe.ingredients) {
      // If ingredientId is missing and quantity is a string, try to migrate
      const hasIngredientId = Object.prototype.hasOwnProperty.call(
        ing,
        'ingredientId'
      );
      const ingredientIdIsString = typeof ing.ingredientId === 'string';
      const quantityIsString = typeof ing.quantity === 'string';

      if (hasIngredientId && quantityIsString) {
        // Try to match ingredient
        let name: string | undefined = undefined;
        if (ingredientIdIsString) {
          name = ing.ingredientId;
        } else if ('name' in ing && typeof ing.name === 'string') {
          name = ing.name;
        }
        if (typeof name === 'string') {
          const normName = normalizeName(name);
          let matchId = ingredientMap.get(normName);
          if (!matchId) {
            // Try fuzzy match
            const allNames = Array.from(ingredientMap.keys());
            const fuzzy = findFuzzyMatch(normName, allNames as string[]);
            if (fuzzy) {
              matchId = ingredientMap.get(fuzzy);
              console.log(
                `Fuzzy ingredient match: "${name}" -> "${fuzzy}" -> ${matchId}`
              );
            }
          }
          if (matchId) {
            ing.ingredientId = matchId;
            matchedIngredients++;
            changed = true;
            console.log(`Ingredient match: "${name}" -> ${matchId}`);
          } else {
            unmatchedIngredients.add(name);
            console.log(`Ingredient NOT matched: "${name}"`);
          }
        }

        // Parse quantity and unit from string: ingredient schema defines quantity as number,
        // but legacy data may have stored a string. Access through loose cast.
        const legacyQuantity: unknown = ing.quantity;
        const qstr =
          typeof legacyQuantity === 'string' ? legacyQuantity.trim() : '';
        // Match patterns like '2 cups', '1, diced', '1/2 tsp', 'to taste', 'for garnish', etc.
        let quantityNum: number | undefined = undefined;
        let unitStr: string | undefined = undefined;
        let skipUnitMatching = false;

        // 1. If matches '3, minced' or '3, diced', only set quantity, skip unit
        let match = qstr.match(/^([\d.,/]+),\s*.*$/);
        if (match) {
          const numStr = match[1].replace(',', '.');
          if (numStr.includes('/')) {
            const [num, denom] = numStr.split('/').map(Number);
            if (!isNaN(num) && !isNaN(denom) && denom !== 0) {
              quantityNum = num / denom;
            }
          } else {
            const parsed = parseFloat(numStr);
            if (!isNaN(parsed)) quantityNum = parsed;
          }
          unitStr = undefined;
          skipUnitMatching = true;
        } else {
          // 2. If matches just a number (e.g. '3'), only set quantity, skip unit
          match = qstr.match(/^([\d.,/]+)$/);
          if (match) {
            const numStr = match[1].replace(',', '.');
            if (numStr.includes('/')) {
              const [num, denom] = numStr.split('/').map(Number);
              if (!isNaN(num) && !isNaN(denom) && denom !== 0) {
                quantityNum = num / denom;
              }
            } else {
              const parsed = parseFloat(numStr);
              if (!isNaN(parsed)) quantityNum = parsed;
            }
            unitStr = undefined;
            skipUnitMatching = true;
          } else {
            // 3. Try to match numeric quantity and unit (e.g., '2 cups', '1/2 tsp', '2 tbsp', '1tsp')
            match = qstr.match(/^([\d.,/]+)\s*([a-zA-Z]+)?(.*)$/);
            if (match) {
              const numStr = match[1].replace(',', '.');
              if (numStr.includes('/')) {
                const [num, denom] = numStr.split('/').map(Number);
                if (!isNaN(num) && !isNaN(denom) && denom !== 0) {
                  quantityNum = num / denom;
                }
              } else {
                const parsed = parseFloat(numStr);
                if (!isNaN(parsed)) quantityNum = parsed;
              }
              if (match[2]) unitStr = match[2].toLowerCase();
            } else {
              // If nothing matched and qstr is non-empty, treat the whole string as a unit
              if (qstr && qstr.length > 0) {
                unitStr = qstr.toLowerCase().trim();
              }
            }
          }
        }

        // Set parsed values
        if (typeof quantityNum === 'number') {
          ing.quantity = quantityNum;
          parsedQuantities++;
          changed = true;
        } else {
          // If quantity is not a number, remove it so schema validation passes
          delete ing.quantity;
        }

        // Try to match unitStr to a unit ObjectId using code, defaultName, or locales, unless we should skip unit matching
        let unitId: string | undefined = undefined;
        if (!skipUnitMatching && unitStr) {
          const normUnit = normalizeName(unitStr);
          for (const u of unitList) {
            if (u.names.includes(normUnit)) {
              unitId = u._id;
              break;
            }
          }
          // Fuzzy match if not found
          if (!unitId) {
            const allUnitNames = unitList.flatMap((u: any) => u.names);
            const fuzzy = findFuzzyMatch(normUnit, allUnitNames);
            if (fuzzy) {
              for (const u of unitList) {
                if (u.names.includes(fuzzy)) {
                  unitId = u._id;
                  console.log(
                    `Fuzzy unit match: "${unitStr}" -> "${fuzzy}" -> ${unitId}`
                  );
                  break;
                }
              }
            }
          }
        }
        // If unitStr is present, not skipped, and not matched, treat as a new unit
        if (
          !skipUnitMatching &&
          typeof unitStr === 'string' &&
          unitStr &&
          !unitId
        ) {
          unmatchedUnits.add(unitStr);
          console.log(`Unit NOT matched: ${unitStr}`);
        }
        if (unitId) {
          ing.unit = unitId;
          matchedUnits++;
          changed = true;
          console.log(`Unit match: ${unitStr} -> ${unitId}`);
        }
      }
    }
    if (changed) {
      if (!dryRun) {
        // Update the recipe in the database
        await Recipe.updateOne({ _id: recipe._id }, recipe);
      }
      updated++;
    }

    // --- Update Czech translation recipe with same ingredient/unit IDs ---
    if (Array.isArray(recipe.translations)) {
      const csTranslation = recipe.translations.find(
        (t: unknown): t is { language: string; recipeId: string } =>
          typeof t === 'object' &&
          t !== null &&
          'language' in t &&
          t.language === 'cs' &&
          'recipeId' in t
      );
      if (csTranslation && csTranslation.recipeId) {
        // Load Czech recipe
        const csRecipe = await Recipe.findOne({
          _id: csTranslation.recipeId,
        }).lean();
        if (csRecipe && Array.isArray(csRecipe.ingredients)) {
          let csChanged = false;
          // Try to match by order (if same length), else by normalized name
          if (csRecipe.ingredients.length === recipe.ingredients.length) {
            for (let i = 0; i < recipe.ingredients.length; i++) {
              const enIng = recipe.ingredients[i];
              const csIng = csRecipe.ingredients[i];
              if (enIng.ingredientId && enIng.unit) {
                if (
                  String(csIng.ingredientId) !== String(enIng.ingredientId) ||
                  String(csIng.unit) !== String(enIng.unit)
                ) {
                  csIng.ingredientId = enIng.ingredientId;
                  csIng.unit = enIng.unit;
                  csChanged = true;
                }
              }
              // Sanitize quantity: must be a number or undefined
              if (typeof csIng.quantity !== 'number') {
                const parsed = parseFloat(
                  String(csIng.quantity)
                    .replace(/[^\d.,/]/g, '')
                    .replace(',', '.')
                );
                if (!isNaN(parsed)) {
                  csIng.quantity = parsed;
                } else {
                  delete csIng.quantity;
                }
              }
            }
          } else {
            // Fallback: match by normalized name
            for (const enIng of recipe.ingredients) {
              if (!enIng.ingredientId || !enIng.unit) continue;
              // Try to find matching Czech ingredient by normalized name
              const enNorm = enIng.name ? normalizeName(enIng.name) : '';
              function isIngredientWithName(x: unknown): x is {
                name: string;
                ingredientId: string;
                unit: string;
                quantity?: unknown;
              } {
                return (
                  typeof x === 'object' &&
                  x !== null &&
                  'name' in x &&
                  typeof (x as { name: unknown }).name === 'string' &&
                  normalizeName((x as { name: string }).name) === enNorm
                );
              }
              const match = csRecipe.ingredients.find(isIngredientWithName);
              if (match) {
                if (
                  String(match.ingredientId) !== String(enIng.ingredientId) ||
                  String(match.unit) !== String(enIng.unit)
                ) {
                  match.ingredientId = enIng.ingredientId;
                  match.unit = enIng.unit;
                  csChanged = true;
                }
                // Sanitize quantity: must be a number or undefined
                if (typeof match.quantity !== 'number') {
                  const parsed = parseFloat(
                    String(match.quantity)
                      .replace(/[^\d.,/]/g, '')
                      .replace(',', '.')
                  );
                  if (!isNaN(parsed)) {
                    match.quantity = parsed;
                  } else {
                    delete match.quantity;
                  }
                }
              }
            }
          }
          if (csChanged) {
            if (!dryRun) {
              await Recipe.updateOne(
                { _id: csRecipe._id },
                { ingredients: csRecipe.ingredients }
              );
            }
            console.log(
              `Updated Czech recipe: ${csRecipe._id} with new ingredient/unit IDs`
            );
          }
        }
      }
    }
  }
  console.log('----- Migration Summary -----');
  console.log(`Recipes touched: ${updated}`);
  console.log(`Ingredients matched: ${matchedIngredients}`);
  console.log(`Units matched: ${matchedUnits}`);
  console.log(`Quantities parsed: ${parsedQuantities}`);
  console.log(`Free-form quantities skipped: ${skippedFreeForm}`);

  if (unmatchedIngredients.size > 0) {
    console.log('Unmatched ingredients:');
    for (const name of unmatchedIngredients) {
      console.log('  -', name);
    }
    // Insert unmatched ingredients as new Ingredient documents (with EN and CS locales)
    for (const name of unmatchedIngredients) {
      // Check if already exists (case-insensitive)
      const exists = await Ingredient.findOne({
        'locales.en': new RegExp('^' + name + '$', 'i'),
      });
      if (!exists) {
        try {
          const [csTranslation] = await translate.translate(name, 'cs');
          const ingredient = {
            defaultName: name,
            locales: { en: name, cs: csTranslation },
          };
          if (!dryRun) {
            await Ingredient.create(ingredient);
          }
          console.log('Inserted new ingredient:', ingredient);
        } catch (e) {
          console.error('Translation error for ingredient', name, e);
        }
      }
    }
  }

  if (unmatchedUnits.size > 0) {
    console.log('Unmatched units:');
    for (const name of unmatchedUnits) {
      console.log('  -', name);
    }
    // Insert unmatched units as new Unit documents (with EN and CS locales)
    for (const name of unmatchedUnits) {
      // Check if already exists (case-insensitive)
      const exists = await Unit.findOne({
        $or: [
          { code: new RegExp('^' + name + '$', 'i') },
          { defaultName: new RegExp('^' + name + '$', 'i') },
          { 'locales.en': new RegExp('^' + name + '$', 'i') },
        ],
      });
      if (!exists) {
        try {
          const [csTranslation] = await translate.translate(name, 'cs');
          const unit = {
            code: name,
            defaultName: name,
            locales: { en: name, cs: csTranslation },
          };
          if (!dryRun) {
            await Unit.create(unit);
          }
          console.log('Inserted new unit:', unit);
        } catch (e) {
          console.error('Translation error for unit', name, e);
        }
      }
    }
  }

  console.log('--------------------------------');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
