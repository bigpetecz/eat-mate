import 'dotenv/config';
import { config } from 'dotenv';
config({ path: 'apps/api/.env.local' });
import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGODB_URI;

const RecipeSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  language: { type: String, required: true },
});

const Recipe = mongoose.model('Recipe', RecipeSchema);

async function removeDuplicateCzechRecipes() {
  if (MONGO_URI === undefined) {
    throw new Error('MONGODB_URI is not defined');
  }
  await mongoose.connect(MONGO_URI);
  const czechRecipes = await Recipe.find({ language: 'cs' });
  let removed = 0;

  for (const recipe of czechRecipes) {
    const match = recipe.slug.match(/^(.*)-(\d+)$/);
    if (match) {
      // This recipe is a duplicate (slug ends with -number)
      await Recipe.deleteOne({ _id: recipe._id });
      removed++;
      console.log(
        `Removed duplicate Czech recipe: ${recipe.slug} (${recipe._id})`
      );
    }
  }
  console.log(`Done. Removed ${removed} duplicate Czech recipes.`);
  await mongoose.disconnect();
}

removeDuplicateCzechRecipes().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
