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
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Recipe } from './recipe.schema';
import { CreateRecipeDto, UpdateRecipeDto } from './recipe.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User as UserDecorator } from '../auth/user.decorator';

@Controller('recipes')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class RecipesController {
  constructor(
    @InjectModel(Recipe.name) private readonly recipeModel: Model<Recipe>
  ) {}

  // Create a new recipe
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @UserDecorator() user: any,
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
  @Patch(':id')
  async patchUpdate(
    @Param('id') id: string,
    @UserDecorator() user: any,
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
  async delete(@Param('id') id: string, @UserDecorator() user: any) {
    if (!isValidObjectId(id)) throw new BadRequestException('Invalid ID');
    const recipe = await this.recipeModel.findById(id).exec();
    if (!recipe) throw new NotFoundException('Recipe not found');
    if (recipe.author.toString() !== user.userId)
      throw new UnauthorizedException('Not your recipe');
    await recipe.deleteOne();
    return { message: 'Recipe deleted' };
  }
}
