import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  NotFoundException,
  BadRequestException,
  UseGuards,
  UnauthorizedException,
  ValidationPipe,
  UsePipes,
  UseInterceptors,
  UploadedFiles,
  Put,
  Query,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId, Types } from 'mongoose';
import { Recipe } from './recipe.schema';
import { CreateRecipeDto, UpdateRecipeDto } from './recipe.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User as UserDecorator } from '../auth/user.decorator';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { JwtUser } from './types';
import type { File as MulterFile } from 'multer';
import { RateRecipeDto } from './rate-recipe.dto';

@Controller('recipes')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class RecipesController {
  constructor(
    @InjectModel(Recipe.name) private readonly recipeModel: Model<Recipe>,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  // Create a new recipe
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @UserDecorator() user: JwtUser,
    @Body() createRecipeDto: CreateRecipeDto
  ) {
    const author = user.userId;
    return new this.recipeModel({ ...createRecipeDto, author }).save();
  }

  // Get all recipes
  @Get()
  async findAll() {
    return this.recipeModel.find().exec();
  }

  // Filter recipes with advanced query params
  @Get('filter')
  async filterRecipes(
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
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } },
          { country: { $regex: search, $options: 'i' } },
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
    const query = andConditions.length > 0 ? { $and: andConditions } : {};
    return this.recipeModel.find(query).exec();
  }

  // Get a recipe by ID (with ObjectId validation)
  @Get(':id')
  async findById(@Param('id') id: string) {
    if (!isValidObjectId(id)) throw new BadRequestException('Invalid ID');
    const recipe = await this.recipeModel.findById(id).exec();
    if (!recipe) throw new NotFoundException('Recipe not found');
    return recipe;
  }

  // Update a recipe by ID (with ObjectId validation)
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async patchUpdate(
    @Param('id') id: string,
    @UserDecorator() user: JwtUser,
    @Body() updateRecipeDto: UpdateRecipeDto
  ) {
    if (!isValidObjectId(id)) throw new BadRequestException('Invalid ID');
    const recipe = await this.recipeModel.findById(id).exec();
    if (!recipe) throw new NotFoundException('Recipe not found');
    if (recipe.author.toString() !== user.userId)
      throw new UnauthorizedException('Not your recipe');
    Object.assign(recipe, updateRecipeDto);
    return recipe.save();
  }

  // Delete a recipe by ID (with ObjectId validation)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: string, @UserDecorator() user: JwtUser) {
    if (!isValidObjectId(id)) throw new BadRequestException('Invalid ID');
    const recipe = await this.recipeModel.findById(id).exec();
    if (!recipe) throw new NotFoundException('Recipe not found');
    if (recipe.author.toString() !== user.userId)
      throw new UnauthorizedException('Not your recipe');
    await recipe.deleteOne();
    return { message: 'Recipe deleted' };
  }

  // Upload images for a recipe and update images array
  @UseGuards(JwtAuthGuard)
  @Post(':id/images')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadImages(
    @Param('id') id: string,
    @UserDecorator() user: JwtUser,
    @UploadedFiles() files: MulterFile[]
  ) {
    if (!isValidObjectId(id)) throw new BadRequestException('Invalid ID');
    const recipe = await this.recipeModel.findById(id).exec();
    if (!recipe) throw new NotFoundException('Recipe not found');
    if (recipe.author.toString() !== user.userId)
      throw new UnauthorizedException('Not your recipe');
    if (!files || files.length === 0)
      throw new BadRequestException('No files uploaded');
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
  async deleteImage(
    @Param('id') id: string,
    @UserDecorator() user: JwtUser,
    @Body('url') url: string
  ) {
    if (!isValidObjectId(id)) throw new BadRequestException('Invalid ID');
    const recipe = await this.recipeModel.findById(id).exec();
    if (!recipe) throw new NotFoundException('Recipe not found');
    if (recipe.author.toString() !== user.userId)
      throw new UnauthorizedException('Not your recipe');
    if (!url) throw new BadRequestException('No image url provided');
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
  async updateImage(
    @Param('id') id: string,
    @UserDecorator() user: JwtUser,
    @Body('oldUrl') oldUrl: string,
    @Body('newUrl') newUrl: string
  ) {
    if (!isValidObjectId(id)) throw new BadRequestException('Invalid ID');
    const recipe = await this.recipeModel.findById(id).exec();
    if (!recipe) throw new NotFoundException('Recipe not found');
    if (recipe.author.toString() !== user.userId)
      throw new UnauthorizedException('Not your recipe');
    if (!oldUrl || !newUrl)
      throw new BadRequestException('Missing image url(s)');
    recipe.images = (recipe.images || []).map((img) =>
      img === oldUrl ? newUrl : img
    );
    await recipe.save();
    return { images: recipe.images };
  }

  // Rate a recipe (add or update rating)
  @UseGuards(JwtAuthGuard)
  @Post(':id/rate')
  async rateRecipe(
    @Param('id') id: string,
    @UserDecorator() user: JwtUser,
    @Body() rateDto: RateRecipeDto
  ): Promise<{ averageRating: number; ratingCount: number }> {
    if (!isValidObjectId(id))
      throw new BadRequestException('Invalid recipe ID');
    const recipe = await this.recipeModel.findById(id).exec();
    if (!recipe) throw new NotFoundException('Recipe not found');
    if (recipe.author.toString() === user.userId)
      throw new BadRequestException('You cannot rate your own recipe.');
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
  async getRatings(
    @Param('id') id: string
  ): Promise<{ user: string; value: number }[]> {
    if (!isValidObjectId(id))
      throw new BadRequestException('Invalid recipe ID');
    const recipe = await this.recipeModel.findById(id).lean().exec();
    if (!recipe) throw new NotFoundException('Recipe not found');
    return recipe.ratings.map((r) => ({
      user: r.user.toString(),
      value: r.value,
    }));
  }

  // Get average rating and count for a recipe
  @Get(':id/rating')
  async getAverageRating(
    @Param('id') id: string
  ): Promise<{ averageRating: number; ratingCount: number }> {
    if (!isValidObjectId(id))
      throw new BadRequestException('Invalid recipe ID');
    const recipe = await this.recipeModel.findById(id).lean().exec();
    if (!recipe) throw new NotFoundException('Recipe not found');
    return {
      averageRating: recipe.averageRating,
      ratingCount: recipe.ratingCount,
    };
  }
}
