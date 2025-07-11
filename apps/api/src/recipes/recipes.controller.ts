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
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Recipe } from './recipe.schema';
import { CreateRecipeDto, UpdateRecipeDto } from './recipe.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User as UserDecorator } from '../auth/user.decorator';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { JwtUser } from './types';
import type { File as MulterFile } from 'multer';

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
}
