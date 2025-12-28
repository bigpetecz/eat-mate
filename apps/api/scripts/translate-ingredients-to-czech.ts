import mongoose from 'mongoose';
import { Ingredient } from '../src/recipes/ingredient.schema';
import 'dotenv/config';
import { config } from 'dotenv';
config({ path: ['apps/api/.env', 'apps/api/.env.local'] });
import { Translate } from '@google-cloud/translate/build/src/v2';

const MONGO_URI = process.env.MONGODB_URI;
const GOOGLE_KEY_PATH = process.env.GOOGLE_KEY_PATH;

async function main() {
  if (!MONGO_URI) throw new Error('MONGODB_URI is not defined');
  if (!GOOGLE_KEY_PATH) throw new Error('GOOGLE_KEY_PATH is not defined');
  await mongoose.connect(MONGO_URI);

  const translate = new Translate({ keyFilename: GOOGLE_KEY_PATH });

  const ingredients = await Ingredient.find({
    $or: [
      { 'locales.cs': { $exists: false } },
      { 'locales.cs': '' },
      { 'locales.cs': null },
    ],
  });

  for (const ingredient of ingredients) {
    const locales = (ingredient.locales || {}) as Record<string, string>;
    const enName = String(locales.en || ingredient.defaultName);
    if (!enName || typeof enName !== 'string') continue;
    try {
      const [csName] = await translate.translate(enName, 'cs');
      ingredient.locales = locales;
      locales.cs = csName;
      await ingredient.save();
      console.log(`Translated: ${enName} → ${csName}`);
    } catch (err) {
      console.error(`Failed to translate: ${enName}`, err);
    }
  }

  await mongoose.disconnect();
  console.log('Done translating ingredients to Czech.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
