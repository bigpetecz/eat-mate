import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { plainToInstance } from 'class-transformer';

import { Recipe } from '../schema/recipe.schema';
import { RecipeDto } from '../dto/recipe.dto';
import { FilterRecipesQueryDto } from '../dto/filter-recipes-query.dto';
import { RecipePublicationEligibility } from '../recipe.enums';

type RecipeFindQuery = ReturnType<Model<Recipe>['find']>;

@Injectable()
export class RecipesQueryService {
  constructor(
    @InjectModel(Recipe.name) private readonly recipeModel: Model<Recipe>
  ) {}

  private withPopulateAndLean(query: RecipeFindQuery) {
    return query
      .select(
        'author title description slug images cookTime prepTime servings instructions country ai sourceType sourceName sourceUrl attributionText rightsStatus publicationEligibility ' +
          'ingredients.ingredientId ingredients.variantId ingredients.unit'
      )
      .populate('ingredients.ingredientId')
      .populate('ingredients.variantId')
      .populate('ingredients.unit', 'code')
      .lean({ virtuals: true });
  }

  private parseArray(input?: string[]): string[] {
    if (!input) {
      return [];
    }

    return input.map((value) => value.trim()).filter(Boolean);
  }

  async findAll(language: string): Promise<RecipeDto[]> {
    const results = await this.withPopulateAndLean(
      this.recipeModel
        .find({
          language,
          publicationEligibility: { $ne: RecipePublicationEligibility.Blocked },
        })
        .select('+slug')
    ).exec();

    return plainToInstance(RecipeDto, results);
  }

  async filter(
    language: string,
    params: FilterRecipesQueryDto
  ): Promise<RecipeDto[]> {
    const {
      search,
      mealType,
      diets,
      techniques,
      specialAttributes,
      difficulty,
      country,
      sourceType,
      prepTimeMin,
      prepTimeMax,
      cookTimeMin,
      cookTimeMax,
      caloriesMin,
      caloriesMax,
      estimatedCostMin,
      estimatedCostMax,
    } = params;

    const andConditions: Record<string, unknown>[] = [];

    if (search) {
      andConditions.push({
        $or: [
          { 'ingredients.name': { $regex: search, $options: 'i' } },
          { 'ai.keywords': { $regex: search, $options: 'i' } },
        ],
      });
    }

    if (mealType) {
      andConditions.push({ mealType });
    }

    if (difficulty) {
      andConditions.push({
        $or: [{ difficulty }, { 'ai.difficulty': difficulty }],
      });
    }

    if (country) {
      andConditions.push({ country });
    }

    if (sourceType) {
      andConditions.push({ sourceType });
    }

    const dietsArr = this.parseArray(diets);
    if (dietsArr.length) {
      andConditions.push({ 'ai.dietLabels': { $all: dietsArr } });
    }

    const techniquesArr = this.parseArray(techniques);
    if (techniquesArr.length) {
      andConditions.push({ 'ai.techniques': { $all: techniquesArr } });
    }

    const specialArr = this.parseArray(specialAttributes);
    if (specialArr.length) {
      andConditions.push({ 'ai.specialAttributes': { $all: specialArr } });
    }

    if (prepTimeMin !== undefined || prepTimeMax !== undefined) {
      const prepTimeCond: Record<string, number> = {};
      if (prepTimeMin !== undefined) prepTimeCond.$gte = prepTimeMin;
      if (prepTimeMax !== undefined) prepTimeCond.$lte = prepTimeMax;
      andConditions.push({ prepTime: prepTimeCond });
    }

    const cookTimeMinNum = cookTimeMin ?? 0;
    const cookTimeMaxNum = cookTimeMax ?? 240;
    if (!(cookTimeMinNum === 0 && cookTimeMaxNum === 240)) {
      const cookTimeCond: Record<string, number> = {};
      if (cookTimeMinNum > 0) cookTimeCond.$gte = cookTimeMinNum;
      if (cookTimeMaxNum < 240) cookTimeCond.$lte = cookTimeMaxNum;
      andConditions.push({
        $or: [{ cookTime: cookTimeCond }, { cookTime: null }],
      });
    }

    const caloriesMinNum = caloriesMin ?? 0;
    const caloriesMaxNum = caloriesMax ?? 2000;
    if (!(caloriesMinNum === 0 && caloriesMaxNum === 2000)) {
      const caloriesCond: Record<string, number> = {};
      if (caloriesMinNum > 0) caloriesCond.$gte = caloriesMinNum;
      if (caloriesMaxNum < 2000) caloriesCond.$lte = caloriesMaxNum;
      andConditions.push({
        $or: [
          { 'ai.nutrition.calories': caloriesCond },
          { 'ai.nutrition.calories': null },
        ],
      });
    }

    const estimatedCostMinNum = estimatedCostMin ?? 0;
    const estimatedCostMaxNum = estimatedCostMax ?? 30;
    if (!(estimatedCostMinNum === 0 && estimatedCostMaxNum === 30)) {
      const estimatedCostCond: Record<string, number> = {};
      if (estimatedCostMinNum > 0) estimatedCostCond.$gte = estimatedCostMinNum;
      if (estimatedCostMaxNum < 30)
        estimatedCostCond.$lte = estimatedCostMaxNum;
      andConditions.push({
        $or: [
          { 'ai.estimatedCost': estimatedCostCond },
          { 'ai.estimatedCost': null },
        ],
      });
    }

    const query =
      andConditions.length > 0
        ? {
            $and: [
              {
                language,
                publicationEligibility: {
                  $ne: RecipePublicationEligibility.Blocked,
                },
              },
              ...andConditions,
            ],
          }
        : {
            language,
            publicationEligibility: {
              $ne: RecipePublicationEligibility.Blocked,
            },
          };

    const filtered = await this.withPopulateAndLean(
      this.recipeModel.find(query).select('+slug')
    ).exec();

    return plainToInstance(RecipeDto, filtered);
  }

  async findBySlug(language: string, slug: string): Promise<RecipeDto> {
    const results = await this.recipeModel
      .aggregate([
        { $match: { language, slug } },
        {
          $match: {
            publicationEligibility: {
              $ne: RecipePublicationEligibility.Blocked,
            },
          },
        },
        { $unwind: { path: '$ingredients', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'ingredients',
            localField: 'ingredients.ingredientId',
            foreignField: '_id',
            as: 'ingredients.ingredient',
          },
        },
        {
          $unwind: {
            path: '$ingredients.ingredient',
            preserveNullAndEmptyArrays: true,
          },
        },
        { $match: { 'ingredients.ingredient': { $ne: null } } },
        {
          $lookup: {
            from: 'ingredientvariants',
            localField: 'ingredients.variantId',
            foreignField: '_id',
            as: 'ingredients.variant',
          },
        },
        {
          $unwind: {
            path: '$ingredients.variant',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'units',
            localField: 'ingredients.unit',
            foreignField: '_id',
            as: 'ingredients.unitObj',
          },
        },
        {
          $unwind: {
            path: '$ingredients.unitObj',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: { 'ingredients.ingredientId': { $exists: true, $ne: null } },
        },
        {
          $group: {
            _id: '$_id',
            author: { $first: '$author' },
            title: { $first: '$title' },
            description: { $first: '$description' },
            slug: { $first: '$slug' },
            images: { $first: '$images' },
            cookTime: { $first: '$cookTime' },
            prepTime: { $first: '$prepTime' },
            servings: { $first: '$servings' },
            instructions: { $first: '$instructions' },
            country: { $first: '$country' },
            language: { $first: '$language' },
            sourceType: { $first: '$sourceType' },
            sourceName: { $first: '$sourceName' },
            sourceUrl: { $first: '$sourceUrl' },
            attributionText: { $first: '$attributionText' },
            rightsStatus: { $first: '$rightsStatus' },
            publicationEligibility: { $first: '$publicationEligibility' },
            averageRating: { $first: '$averageRating' },
            ratingCount: { $first: '$ratingCount' },
            ai: { $first: '$ai' },
            ingredients: {
              $push: {
                ingredientId: '$ingredients.ingredientId',
                name: {
                  $ifNull: [
                    {
                      $getField: {
                        field: '$language',
                        input: '$ingredients.ingredient.locales',
                      },
                    },
                    '$ingredients.ingredient.defaultName',
                  ],
                },
                variantId: '$ingredients.variantId',
                quantity: '$ingredients.quantity',
                unit: {
                  $ifNull: [
                    {
                      $getField: {
                        field: '$language',
                        input: '$ingredients.unitObj.locales',
                      },
                    },
                    '$ingredients.unitObj.defaultName',
                  ],
                },
              },
            },
          },
        },
        {
          $addFields: {
            ingredients: {
              $filter: {
                input: '$ingredients',
                as: 'ing',
                cond: { $ne: ['$$ing.ingredientId', null] },
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            id: '$_id',
            author: 1,
            title: 1,
            description: 1,
            slug: 1,
            images: 1,
            cookTime: 1,
            prepTime: 1,
            servings: 1,
            instructions: 1,
            country: 1,
            sourceType: 1,
            sourceName: 1,
            sourceUrl: 1,
            attributionText: 1,
            rightsStatus: 1,
            publicationEligibility: 1,
            averageRating: 1,
            ratingCount: 1,
            ai: 1,
            ingredients: 1,
          },
        },
      ])
      .exec();

    if (!results || results.length === 0) {
      throw new NotFoundException('Recipe not found');
    }

    return plainToInstance(RecipeDto, results[0]);
  }
}
