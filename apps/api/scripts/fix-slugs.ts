import mongoose from 'mongoose';
import 'dotenv/config';
import { config } from 'dotenv';
config({ path: 'apps/api/.env.local' });

const MONGO_URI = process.env.MONGODB_URI;

const RecipeSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
});

const Recipe = mongoose.model('Recipe', RecipeSchema);

async function fixSlugs() {
  if (MONGO_URI === undefined) {
    throw new Error('MONGODB_URI is not defined');
  }
  await mongoose.connect(MONGO_URI);
  const recipes = await Recipe.find();
  let updated = 0;

  for (const recipe of recipes) {
    const match = recipe.slug.match(/^(.*)-(cs|en)$/);
    if (match) {
      const baseSlug = match[1];
      let newSlug = baseSlug;
      let i = 2;
      // Ensure uniqueness
      while (await Recipe.exists({ slug: newSlug, _id: { $ne: recipe._id } })) {
        newSlug = `${baseSlug}-${i}`;
        i++;
      }
      recipe.slug = newSlug;
      await recipe.save();
      updated++;
      console.log(`Updated slug for recipe ${recipe._id}: ${newSlug}`);
    }
  }
  console.log(`Done. Updated ${updated} recipes.`);
  await mongoose.disconnect();
}

fixSlugs().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
