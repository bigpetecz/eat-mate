import 'dotenv/config';
import { config } from 'dotenv';
config({ path: 'apps/api/.env.local' });
import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGODB_URI;

const RecipeSchema = new mongoose.Schema({
  language: { type: String, required: true },
});

const Recipe = mongoose.model('Recipe', RecipeSchema);

// run: npx ts-node -P apps/api/scripts/tsconfig.scripts.json apps/api/scripts/remove-all-czech-recipes.ts
async function removeAllCzechRecipes() {
  if (MONGO_URI === undefined) {
    throw new Error('MONGODB_URI is not defined');
  }
  await mongoose.connect(MONGO_URI);
  const result = await Recipe.deleteMany({ language: 'cs' });
  console.log(`Done. Removed ${result.deletedCount} Czech recipes.`);
  await mongoose.disconnect();
}

removeAllCzechRecipes().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
