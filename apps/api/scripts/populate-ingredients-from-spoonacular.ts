import 'dotenv/config';
import { config } from 'dotenv';
config({ path: 'apps/api/.env.local' });
import axios from 'axios';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { Ingredient } from '../src/recipes/ingredient.schema';
import { IngredientVariant } from '../src/recipes/ingredient-variant.schema';

const MONGO_URI = process.env.MONGODB_URI;
const IMAGE_BASE_URL = 'https://img.spoonacular.com/ingredients_250x250/';
const IMAGE_SAVE_DIR = '/Volumes/Yoda/ingredients';

async function fetchIngredients(query: string, offset = 0, number = 99000) {
  const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
  const SPOONACULAR_API_URL = 'https://api.spoonacular.com/food/ingredients';
  const url = `${SPOONACULAR_API_URL}/autocomplete?query=${query}&number=${number}&offset=${offset}&apiKey=${SPOONACULAR_API_KEY}`;
  const { data } = await axios.get(url);
  return data;
}

async function downloadImage(imageName: string) {
  if (!imageName) return;
  const url = IMAGE_BASE_URL + imageName;
  const dest = path.join(IMAGE_SAVE_DIR, imageName);
  if (fs.existsSync(dest)) return; // Skip if already downloaded
  try {
    const response = await axios.get(url, { responseType: 'stream' });
    await new Promise((resolve, reject) => {
      const stream = response.data.pipe(fs.createWriteStream(dest));
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
  } catch (e) {
    throw new Error(`Failed to download image: ${imageName}`);
  }
}

async function fetchIngredientNutrition(id: number) {
  const url = `${IMAGE_BASE_URL.replace(
    'ingredients_250x250/',
    ''
  )}${id}/information?amount=100&unit=gram&apiKey=${
    process.env.SPOONACULAR_API_KEY
  }`;
  try {
    const { data } = await axios.get(url);
    if (data.nutrition && data.nutrition.nutrients) {
      const n = data.nutrition.nutrients;
      const get = (name: string) => {
        const found = n.find(
          (x: any) => x.name.toLowerCase() === name.toLowerCase()
        );
        return found ? found.amount : undefined;
      };
      return {
        calories: get('Calories'),
        protein: get('Protein'),
        fat: get('Fat'),
        carbs: get('Carbohydrates'),
        fiber: get('Fiber'),
        sugar: get('Sugar'),
        sodium: get('Sodium'),
      };
    }
    return undefined;
  } catch (_e) {
    console.warn(`Failed to fetch nutrition for ingredient id ${id}`);
    return undefined;
  }
}

async function main() {
  if (!fs.existsSync(IMAGE_SAVE_DIR)) {
    fs.mkdirSync(IMAGE_SAVE_DIR, { recursive: true });
  }
  if (!MONGO_URI) {
    throw new Error('MONGODB_URI is not defined');
  }
  await mongoose.connect(MONGO_URI);

  const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
  // .filter((l) => l !== 'a' && l !== 'b');
  const limit = 999900;
  let grandTotalFetched = 0;

  for (const letter of alphabet) {
    let offset = 0;
    let totalFetched = 0;
    let hasMore = true;
    console.log(`\n=== Fetching ingredients for letter: '${letter}' ===`);
    while (hasMore) {
      let batchError = false;
      let batchSuccess = 0;
      let batchFail = 0;
      let batchImageFail = 0;
      const ingredients = await fetchIngredients(letter, offset, limit);
      console.log(
        `Fetched ${ingredients.length} ingredients in batch (offset ${offset}) for '${letter}'`
      );
      if (!ingredients.length) break;
      for (const [i, ing] of ingredients.entries()) {
        try {
          const nutrition = ing.id
            ? await fetchIngredientNutrition(ing.id)
            : undefined;
          // Download image if available and ingredient not in DB
          let base = await Ingredient.findOne({ defaultName: ing.name });
          if (!base && ing.image) {
            try {
              await downloadImage(ing.image);
            } catch (imgErr) {
              batchImageFail++;
              console.warn(
                `[${offset + i + 1}] Failed to download image: ${ing.image}`
              );
            }
          }
          if (!base) {
            try {
              base = await Ingredient.create({
                defaultName: ing.name,
                locales: { en: ing.name },
                variants: [],
                nutrition,
                image: ing.image || undefined,
              });
            } catch (e) {
              if (
                e &&
                typeof e === 'object' &&
                'code' in e &&
                typeof (e as { code?: unknown }).code === 'number' &&
                (e as { code: number }).code === 11000
              ) {
                console.log(
                  `[${offset + i + 1}] Skipped duplicate Ingredient: ${
                    ing.name
                  }`
                );
                continue;
              } else {
                throw e;
              }
            }
          } else {
            let updated = false;
            if (nutrition) {
              base.nutrition = nutrition;
              updated = true;
            }
            if (!base.image && ing.image) {
              base.image = ing.image;
              updated = true;
            }
            if (updated) {
              await base.save();
            }
          }
          let variant = await IngredientVariant.findOne({
            ingredientId: base._id,
            defaultName: ing.name,
          });
          if (!variant) {
            try {
              variant = await IngredientVariant.create({
                ingredientId: base._id,
                defaultName: ing.name,
                locales: { en: ing.name },
              });
              base.variants.push(variant._id);
              await base.save();
            } catch (e) {
              if (
                e &&
                typeof e === 'object' &&
                'code' in e &&
                typeof (e as { code?: unknown }).code === 'number' &&
                (e as { code: number }).code === 11000
              ) {
                console.log(
                  `[${offset + i + 1}] Skipped duplicate IngredientVariant: ${
                    ing.name
                  }`
                );
                continue;
              } else {
                throw e;
              }
            }
          }
          batchSuccess++;
          if ((offset + i + 1) % 10 === 0) {
            console.log(`[${offset + i + 1}] Processed: ${ing.name}`);
          }
        } catch (err) {
          batchFail++;
          batchError = true;
          console.error(
            `[${offset + i + 1}] Error processing ingredient: ${ing.name}`
          );
          if (err instanceof Error) {
            console.error(err.message);
          } else {
            console.error(err);
          }
        }
      }
      totalFetched += ingredients.length;
      offset += limit;
      hasMore = ingredients.length === limit;
      console.log(
        `Batch done: Success: ${batchSuccess}, Ingredient errors: ${batchFail}, Image errors: ${batchImageFail}`
      );
      console.log(`Total processed so far for '${letter}': ${totalFetched}`);
      if (batchError) {
        console.warn(
          'Some errors occurred in this batch. See above for details.'
        );
      }
    }
    grandTotalFetched += totalFetched;
    console.log(
      `=== Finished letter '${letter}'. Total fetched: ${totalFetched} ===\n`
    );
  }
  await mongoose.disconnect();
  console.log(
    `Done populating all ingredients and images from Spoonacular. Grand total: ${grandTotalFetched}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
