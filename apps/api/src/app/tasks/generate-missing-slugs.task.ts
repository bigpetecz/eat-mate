import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Recipe } from '../../recipes/recipe.schema';
import slugify from 'slugify';

@Injectable()
export class GenerateMissingSlugsTask implements OnApplicationBootstrap {
  constructor(
    @InjectModel(Recipe.name) private readonly recipeModel: Model<Recipe>
  ) {}

  async onApplicationBootstrap() {
    const recipes = await this.recipeModel.find({
      $or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }],
    });
    Logger.log(
      `Found ${recipes.length} recipes missing slug.`,
      'GenerateMissingSlugsTask'
    );
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
      while (
        await this.recipeModel.exists({ slug, _id: { $ne: recipe._id } })
      ) {
        slug = `${baseSlug}-${i++}`;
      }
      recipe.slug = slug;
      await recipe.save();
      Logger.log(
        `Updated recipe ${recipe._id} with slug: ${slug}`,
        'GenerateMissingSlugsTask'
      );
    }
    Logger.log('Done.', 'GenerateMissingSlugsTask');
    // Optionally, exit process if this is a one-time task
    process.exit(0);
  }
}
