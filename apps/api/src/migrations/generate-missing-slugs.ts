import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Recipe } from '../recipes/recipe.schema';
import slugify from 'slugify';

async function runMigration() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });
  try {
    const recipeModel = app.get(getModelToken(Recipe.name));
    const recipes = await recipeModel.find({
      $or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }],
    });
    console.log(`Found ${recipes.length} recipes missing slug.`);
    for (const recipe of recipes) {
      if (!recipe.title) continue;
      const baseSlug = slugify(recipe.title, {
        lower: true,
        strict: true,
        locale: 'en',
      });
      let slug = baseSlug;
      let i = 1;
      // Ensure uniqueness
      while (await recipeModel.exists({ slug, _id: { $ne: recipe._id } })) {
        slug = `${baseSlug}-${i++}`;
      }
      recipe.slug = slug;
      await recipe.save();
      console.log(`Updated recipe ${recipe._id} with slug: ${slug}`);
    }
    console.log('Done.');
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await app.close();
  }
}

runMigration();
