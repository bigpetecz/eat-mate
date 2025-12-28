import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  UploadedFiles,
  NotFoundException,
  BadRequestException,
  UseGuards,
  UnauthorizedException,
  InternalServerErrorException,
  ValidationPipe,
  UsePipes,
  UseInterceptors,
  Inject,
  Query,
} from '@nestjs/common';
import {
  CacheInterceptor,
  CacheTTL,
  CACHE_MANAGER,
} from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { plainToInstance } from 'class-transformer';
import { Model, isValidObjectId, Types } from 'mongoose';
import { ApiTags, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';

import { Recipe } from './schema/recipe.schema';
import { CreateRecipeDto, UpdateRecipeDto, RecipeDto } from './dto/recipe.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User as UserDecorator } from '../auth/user.decorator';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { IngredientNormalizerService } from '../ingredients/service/ingredient-normalizer.service';
import type { JwtUser } from './types';
import { RateRecipeDto } from './dto/rate-recipe.dto';

interface NormalizedIngredientEntry {
  ingredientId: Types.ObjectId | string;
  variantId?: string;
  quantity: number;
  unit?: Types.ObjectId;
}

@ApiTags('recipes')
@Controller('recipes')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class RecipesController {
  constructor(
    @InjectModel(Recipe.name) private readonly recipeModel: Model<Recipe>,
    @InjectModel('Unit') private readonly unitModel: Model<unknown>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly ingredientNormalizer: IngredientNormalizerService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
  ) {}

  // Shared helper to populate ingredient refs and apply lean with virtuals
  private withPopulateAndLean(query: any) {
    return (
      query
        // Project only the fields needed by RecipeDto
        .select(
          'author title description slug images cookTime prepTime servings instructions country ai ' +
            'ingredients.ingredientId ingredients.variantId ingredients.unit'
        )
        .populate('ingredients.ingredientId')
        .populate('ingredients.variantId')
        .populate('ingredients.unit', 'code')
        .lean({ virtuals: true })
    );
  }

  // Create a new recipe (optionally as a translation of another recipe)
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiCreatedResponse({ type: RecipeDto })
  async create(
    @UserDecorator() user: JwtUser,
    @Body() createRecipeDto: CreateRecipeDto & { translationOf?: string }
  ) {
    const author = user.userId;
    const normalizedIngredients: NormalizedIngredientEntry[] = [];
    for (const ing of createRecipeDto.ingredients) {
      // Determine or create ingredientId/variantId
      let ingredientId = ing.ingredientId;
      let variantId: string | undefined;
      if (!ingredientId && ing.name) {
        const result = await this.ingredientNormalizer.findOrCreateVariant(
          ing.name
        );
        ingredientId = result.ingredientId;
        variantId = result.variantId;
      }
      if (!ingredientId) {
        throw new BadRequestException(
          'Ingredient must have a name or ingredientId'
        );
      }
      // Determine Unit ObjectId: prefer unitId, fallback to lookup by code
      let unitObjectId: Types.ObjectId | undefined;
      if (ing.unitId) {
        unitObjectId = new Types.ObjectId(ing.unitId);
      } else if (ing.unit) {
        const unitDoc = await this.unitModel.findOne({ code: ing.unit }).exec();
        if (unitDoc) unitObjectId = unitDoc._id as Types.ObjectId;
      }
      // Only include unit field if we have a valid ObjectId

      const ingredientEntry: NormalizedIngredientEntry = {
        ingredientId,
        variantId,
        quantity: ing.quantity,
      };
      if (unitObjectId) {
        ingredientEntry.unit = unitObjectId;
      }
      normalizedIngredients.push(ingredientEntry);
    }
    // Build the data object for saving (do not overwrite the DTO)
    const recipeData = {
      ...createRecipeDto,
      author,
      ingredients: normalizedIngredients,
    };
    // Save and return populated lean recipe
    const saved = await this.recipeModel.create(recipeData);
    // Populate and lean with virtuals
    const result = await this.withPopulateAndLean(
      this.recipeModel.findById(saved._id)
    ).exec();
    if (!result) throw new InternalServerErrorException();
    // Transform to DTO
    const dto = plainToInstance(RecipeDto, result);

    return dto;
  }

  // Get all translations for a recipe by ID
  @Get(':id/translations')
  @ApiOkResponse({ type: [RecipeDto] })
  async getTranslations(@Param('id') id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid ID');
    }
    const recipe = await this.recipeModel.findById(id).exec();
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    // Populate and lean translation recipe details, then map to DTOs
    const translations = await this.withPopulateAndLean(
      this.recipeModel.find({
        _id: { $in: (recipe.translations || []).map((t) => t.recipeId) },
      })
    ).exec();
    return plainToInstance(RecipeDto, translations);
  }

  // Get all recipes
  @Get(`:language`)
  @ApiOkResponse({ type: [RecipeDto] })
  async findAll(@Param('language') language: string) {
    // Use lean for performance and map to DTOs
    const results = await this.withPopulateAndLean(
      this.recipeModel.find({ language }).select('+slug')
    ).exec();
    return plainToInstance(RecipeDto, results);
  }

  // Filter recipes with advanced query params
  @Get(':language/filter')
  @ApiOkResponse({ type: [RecipeDto] })
  async filterRecipes(
    @Param('language') language: string,
    @Query('search') search?: string,
    @Query('mealType') mealType?: string,
    @Query('diets') diets?: string | string[],
    @Query('techniques') techniques?: string | string[],
    @Query('specialAttributes') specialAttributes?: string | string[],
    @Query('difficulty') difficulty?: string,
    @Query('country') country?: string,
    @Query('prepTimeMin') prepTimeMin?: string,
    @Query('prepTimeMax') prepTimeMax?: string,
    @Query('cookTimeMin') cookTimeMin?: string,
    @Query('cookTimeMax') cookTimeMax?: string,
    @Query('caloriesMin') caloriesMin?: string,
    @Query('caloriesMax') caloriesMax?: string,
    @Query('estimatedCostMin') estimatedCostMin?: string,
    @Query('estimatedCostMax') estimatedCostMax?: string
  ) {
    const andConditions = [];
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
      // Check both root and ai.difficulty for compatibility
      andConditions.push({
        $or: [{ difficulty }, { 'ai.difficulty': difficulty }],
      });
    }
    if (country) {
      andConditions.push({ country });
    }
    if (diets) {
      const arr = Array.isArray(diets) ? diets : [diets];
      andConditions.push({ 'ai.dietLabels': { $all: arr } });
    }
    if (techniques) {
      const arr = Array.isArray(techniques) ? techniques : [techniques];
      andConditions.push({ 'ai.techniques': { $all: arr } });
    }
    if (specialAttributes) {
      const arr = Array.isArray(specialAttributes)
        ? specialAttributes
        : [specialAttributes];
      andConditions.push({ 'ai.specialAttributes': { $all: arr } });
    }
    if (prepTimeMin || prepTimeMax) {
      const prepTimeCond: Record<string, number> = {};
      if (prepTimeMin) prepTimeCond.$gte = Number(prepTimeMin);
      if (prepTimeMax) prepTimeCond.$lte = Number(prepTimeMax);
      andConditions.push({ prepTime: prepTimeCond });
    }
    // Only add cookTime filter if not full range (0-240)
    const cookTimeMinNum = cookTimeMin !== undefined ? Number(cookTimeMin) : 0;
    const cookTimeMaxNum =
      cookTimeMax !== undefined ? Number(cookTimeMax) : 240;
    if (!(cookTimeMinNum === 0 && cookTimeMaxNum === 240)) {
      const cookTimeCond: Record<string, number> = {};
      if (cookTimeMinNum > 0) cookTimeCond.$gte = cookTimeMinNum;
      if (cookTimeMaxNum < 240) cookTimeCond.$lte = cookTimeMaxNum;
      andConditions.push({
        $or: [{ cookTime: cookTimeCond }, { cookTime: null }],
      });
    }
    // Only add calories filter if not full range (0-2000)
    const caloriesMinNum = caloriesMin !== undefined ? Number(caloriesMin) : 0;
    const caloriesMaxNum =
      caloriesMax !== undefined ? Number(caloriesMax) : 2000;
    if (!(caloriesMinNum === 0 && caloriesMaxNum === 2000)) {
      const calCond: Record<string, number> = {};
      if (caloriesMinNum > 0) calCond.$gte = caloriesMinNum;
      if (caloriesMaxNum < 2000) calCond.$lte = caloriesMaxNum;
      andConditions.push({
        $or: [
          { 'ai.nutrition.calories': calCond },
          { 'ai.nutrition.calories': null },
        ],
      });
    }
    // Only add estimatedCost filter if not full range (0-30)
    const estimatedCostMinNum =
      estimatedCostMin !== undefined ? Number(estimatedCostMin) : 0;
    const estimatedCostMaxNum =
      estimatedCostMax !== undefined ? Number(estimatedCostMax) : 30;
    if (!(estimatedCostMinNum === 0 && estimatedCostMaxNum === 30)) {
      const costCond: Record<string, number> = {};
      if (estimatedCostMinNum > 0) costCond.$gte = estimatedCostMinNum;
      if (estimatedCostMaxNum < 30) costCond.$lte = estimatedCostMaxNum;
      andConditions.push({
        $or: [{ 'ai.estimatedCost': costCond }, { 'ai.estimatedCost': null }],
      });
    }
    // Always filter by language, then lean and map
    const query =
      andConditions.length > 0
        ? { $and: [{ language }, ...andConditions] }
        : { language };
    const filtered = await this.withPopulateAndLean(
      this.recipeModel.find(query).select('+slug')
    ).exec();
    return plainToInstance(RecipeDto, filtered);
  }

  // Get a recipe by language and slug (SEO-friendly)
  @Get(':language/recipe/:slug')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300)
  @ApiOkResponse({ type: RecipeDto })
  async findBySlug(
    @Param('language') language: string,
    @Param('slug') slug: string
  ): Promise<RecipeDto> {
    // Use aggregation to join ingredient, variant, and unit data
    const results = await this.recipeModel
      .aggregate([
        { $match: { language, slug } },
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
        // Filter out ingredients with no matching document
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
        // Remove entries where we couldn't resolve an ingredient
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
        // Remove any ingredient entries missing an ingredientId
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
    const doc = results[0];
    // Transform to DTO
    return plainToInstance(RecipeDto, doc);
  }

  // Get a recipe by ID (with ObjectId validation)
  @Get(':id')
  @ApiOkResponse({ type: RecipeDto })
  async findById(@Param('id') id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid ID');
    }
    const result = await this.withPopulateAndLean(
      this.recipeModel.findById(id)
    ).exec();
    if (!result) {
      throw new NotFoundException('Recipe not found');
    }
    return result;
  }

  // Update a recipe by ID (with ObjectId validation)
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiOkResponse({ type: RecipeDto })
  async patchUpdate(
    @Param('id') id: string,
    @UserDecorator() user: JwtUser,
    @Body() updateRecipeDto: UpdateRecipeDto
  ) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid ID');
    }
    const recipe = await this.recipeModel.findById(id).exec();
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }
    if (recipe.author.toString() !== user.userId) {
      throw new UnauthorizedException('Not your recipe');
    }

    // Apply update and return populated lean recipe
    const updated = await this.recipeModel
      .findByIdAndUpdate(id, updateRecipeDto, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('Recipe not found');
    }
    const result = await this.withPopulateAndLean(
      this.recipeModel.findById(updated._id)
    ).exec();
    if (!result) {
      throw new InternalServerErrorException();
    }
    // Invalidate cache for this recipe
    await this.cacheManager.del(
      `GET:/recipes/${result.language}/recipe/${result.slug}`
    );
    return result;
  }

  // Delete a recipe by ID (with ObjectId validation)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOkResponse({ schema: { properties: { message: { type: 'string' } } } })
  async delete(@Param('id') id: string, @UserDecorator() user: JwtUser) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid ID');
    }

    const recipe = await this.recipeModel.findById(id).exec();
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    if (recipe.author.toString() !== user.userId) {
      throw new UnauthorizedException('Not your recipe');
    }

    await recipe.deleteOne();
    // Invalidate cache for this recipe
    await this.cacheManager.del(
      `GET:/recipes/${recipe.language}/recipe/${recipe.slug}`
    );
    return { message: 'Recipe deleted' };
  }

  // Upload images for a recipe and update images array
  @UseGuards(JwtAuthGuard)
  @Post(':id/images')
  @ApiOkResponse({
    schema: {
      properties: { images: { type: 'array', items: { type: 'string' } } },
    },
  })
  @UseInterceptors(FilesInterceptor('files'))
  async uploadImages(
    @Param('id') id: string,
    @UserDecorator() user: JwtUser,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    @UploadedFiles() files: Express.Multer.File[]
  ): Promise<{ images: string[] }> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid ID');
    }

    const recipe = await this.recipeModel.findById(id).exec();
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    if (recipe.author.toString() !== user.userId) {
      throw new UnauthorizedException('Not your recipe');
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadedUrls = [];
    for (const file of files) {
      const uploadResult = await this.cloudinaryService.uploadImageBuffer(
        file.buffer,
        `${id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      );
      uploadedUrls.push(uploadResult.secure_url);
    }
    recipe.images = [...(recipe.images || []), ...uploadedUrls];
    await recipe.save();
    return { images: recipe.images };
  }

  // Delete a specific image from a recipe and Cloudinary
  @UseGuards(JwtAuthGuard)
  @Delete(':id/images')
  @ApiOkResponse({
    schema: {
      properties: { images: { type: 'array', items: { type: 'string' } } },
    },
  })
  async deleteImage(
    @Param('id') id: string,
    @UserDecorator() user: JwtUser,
    @Body('url') url: string
  ) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid ID');
    }
    const recipe = await this.recipeModel.findById(id).exec();
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }
    if (recipe.author.toString() !== user.userId) {
      throw new UnauthorizedException('Not your recipe');
    }
    if (!url) {
      throw new BadRequestException('No image url provided');
    }
    // Extract publicId from Cloudinary URL
    const match = url.match(/\/([^/]+)\.[a-zA-Z]+$/);
    const publicId = match ? match[1] : null;
    if (publicId) {
      await this.cloudinaryService.deleteImage(publicId);
    }
    recipe.images = (recipe.images || []).filter((img) => img !== url);
    await recipe.save();
    return { images: recipe.images };
  }

  // Update (replace) a specific image in the recipe's images array
  @UseGuards(JwtAuthGuard)
  @Patch(':id/images')
  @ApiOkResponse({
    schema: {
      properties: { images: { type: 'array', items: { type: 'string' } } },
    },
  })
  async updateImage(
    @Param('id') id: string,
    @UserDecorator() user: JwtUser,
    @Body('oldUrl') oldUrl: string,
    @Body('newUrl') newUrl: string
  ) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid ID');
    }
    const recipe = await this.recipeModel.findById(id).exec();
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }
    if (recipe.author.toString() !== user.userId) {
      throw new UnauthorizedException('Not your recipe');
    }
    if (!oldUrl || !newUrl) {
      throw new BadRequestException('Missing image url(s)');
    }
    recipe.images = (recipe.images || []).map((img) =>
      img === oldUrl ? newUrl : img
    );
    await recipe.save();
    return { images: recipe.images };
  }

  // Rate a recipe (add or update rating)
  @UseGuards(JwtAuthGuard)
  @Post(':id/rate')
  @ApiOkResponse({
    schema: {
      properties: {
        averageRating: { type: 'number' },
        ratingCount: { type: 'number' },
      },
    },
  })
  async rateRecipe(
    @Param('id') id: string,
    @UserDecorator() user: JwtUser,
    @Body() rateDto: RateRecipeDto
  ): Promise<{ averageRating: number; ratingCount: number }> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid recipe ID');
    }
    const recipe = await this.recipeModel.findById(id).exec();
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }
    if (recipe.author.toString() === user.userId) {
      throw new BadRequestException('You cannot rate your own recipe.');
    }
    // Check for duplicate rating
    const alreadyRated = recipe.ratings.some(
      (r) => r.user.toString() === user.userId
    );
    if (alreadyRated) {
      throw new BadRequestException('You have already rated this recipe.');
    }
    // Add new rating
    recipe.ratings.push({
      user: new Types.ObjectId(user.userId),
      value: rateDto.value,
    });
    // Update averageRating and ratingCount
    recipe.ratingCount = recipe.ratings.length;
    recipe.averageRating =
      recipe.ratingCount > 0
        ? recipe.ratings.reduce((sum, r) => sum + r.value, 0) /
          recipe.ratingCount
        : 0;
    await recipe.save();
    return {
      averageRating: recipe.averageRating,
      ratingCount: recipe.ratingCount,
    };
  }

  // Get all ratings for a recipe
  @Get(':id/ratings')
  @ApiOkResponse({
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: { user: { type: 'string' }, value: { type: 'number' } },
      },
    },
  })
  async getRatings(
    @Param('id') id: string
  ): Promise<{ user: string; value: number }[]> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid recipe ID');
    }

    const recipe = await this.recipeModel.findById(id).lean().exec();
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    return recipe.ratings.map((r) => ({
      user: r.user.toString(),
      value: r.value,
    }));
  }

  // Get average rating and count for a recipe
  @Get(':id/rating')
  @ApiOkResponse({
    schema: {
      properties: {
        averageRating: { type: 'number' },
        ratingCount: { type: 'number' },
      },
    },
  })
  async getAverageRating(
    @Param('id') id: string
  ): Promise<{ averageRating: number; ratingCount: number }> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid recipe ID');
    }

    const recipe = await this.recipeModel.findById(id).lean().exec();
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    return {
      averageRating: recipe.averageRating,
      ratingCount: recipe.ratingCount,
    };
  }
}
