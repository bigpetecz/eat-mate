// ...existing code...
import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  Req,
  NotFoundException,
  Body,
  BadRequestException,
  Put,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { Recipe } from '../recipes/recipe.schema';
import { User } from './user.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';
import { OpenAIService } from '../openai/openai.service';
// JwtUser type from jwt.strategy validate()
type JwtUser = { userId: string; email: string };
// UserDecorator: use @Req() for now since custom decorator is missing
import { IsString, IsOptional, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsIn(['auto', 'dark', 'light'])
  theme?: 'auto' | 'dark' | 'light';

  @IsOptional()
  @IsIn(['male', 'female', null])
  gender?: 'male' | 'female' | null;
}

class FavoriteRecipeDto {
  @IsString()
  @Type(() => String)
  recipeId: string;
}

// Removed unused AuthenticatedRequest interface
@Controller('users')
export class UsersController {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Recipe.name) private readonly recipeModel: Model<Recipe>,
    private readonly openaiService: OpenAIService
  ) {}

  // Get recipes authored by the current user
  @UseGuards(JwtAuthGuard)
  @Get(':language/my-recipes')
  async getMyRecipes(
    @Req() req: Request,
    @Param('language') language: string
  ): Promise<{ recipes: Recipe[] }> {
    if (!req.user) throw new BadRequestException('User not found in request');
    const user: JwtUser = req.user as JwtUser;
    // Assumes Recipe schema has an 'author' field referencing User._id
    const recipes = await this.recipeModel
      .find({ author: user.userId, language })
      .lean()
      .exec();
    return { recipes };
  }

  // Update user settings (displayName, theme)
  @UseGuards(JwtAuthGuard)
  @Put('settings')
  async updateSettings(
    @Req() req: Request,
    @Body() dto: UpdateSettingsDto
  ): Promise<{
    displayName: string;
    theme: string;
    gender: 'male' | 'female' | null;
  }> {
    if (!req.user) throw new BadRequestException('User not found in request');
    const user: JwtUser = req.user as JwtUser;
    const userDoc = await this.userModel.findById(user.userId).exec();
    if (!userDoc) throw new NotFoundException('User not found');
    if (dto.displayName !== undefined) userDoc.displayName = dto.displayName;
    if (dto.theme !== undefined) userDoc.theme = dto.theme;
    if (dto.gender !== undefined) userDoc.gender = dto.gender;
    try {
      await userDoc.save();
    } catch (err: any) {
      // Mongo duplicate key error code
      if (err.code === 11000 && err.keyPattern?.displayName) {
        throw new BadRequestException('Display name is already taken.');
      }
      throw err;
    }
    return {
      displayName: userDoc.displayName,
      theme: userDoc.theme,
      gender: userDoc.gender,
    };
  }
  // Generate a unique funny username using OpenAI
  @UseGuards(JwtAuthGuard)
  @Get('generate-user-name')
  async generateFunnyName(
    @Req() req: Request
  ): Promise<{ displayName: string }> {
    const displayNameParam = req.query.displayName as string;
    const emailParam = req.query.email as string;
    if (!displayNameParam || !emailParam) {
      throw new BadRequestException(
        'Both displayName and email must be provided in query parameters.'
      );
    }
    let attempt = 0;
    const maxAttempts = 5;
    let displayName = '';
    while (attempt < maxAttempts) {
      displayName = await this.openaiService.generateUsername({
        name: displayNameParam,
        email: emailParam,
      });
      // Check uniqueness in DB
      const exists = await this.userModel.exists({ displayName });
      if (!exists) break;
      attempt++;
    }
    if (!displayName)
      throw new BadRequestException('Failed to generate username');
    return { displayName };
  }

  // Add recipe to favorites
  @UseGuards(JwtAuthGuard)
  @Post('favorites')
  async addFavorite(
    @Req() req: Request,
    @Body() dto: FavoriteRecipeDto
  ): Promise<{ favorites: string[] }> {
    if (!req.user) throw new BadRequestException('User not found in request');
    const user: JwtUser = req.user as JwtUser;
    if (!isValidObjectId(dto.recipeId))
      throw new BadRequestException('Invalid recipe ID');
    const recipe = await this.recipeModel.findById(dto.recipeId).lean().exec();
    if (!recipe) throw new NotFoundException('Recipe not found');
    const userDoc = await this.userModel.findById(user.userId).exec();
    if (!userDoc) throw new NotFoundException('User not found');
    if (
      userDoc.favorites.some(
        (fav: Types.ObjectId) => fav.toString() === dto.recipeId
      )
    ) {
      throw new BadRequestException('Recipe already in favorites.');
    }
    userDoc.favorites.push(new Types.ObjectId(dto.recipeId));
    await userDoc.save();
    return {
      favorites: userDoc.favorites.map((fav: Types.ObjectId) => fav.toString()),
    };
  }

  // Remove recipe from favorites
  @UseGuards(JwtAuthGuard)
  @Delete('favorites/:id')
  async removeFavorite(
    @Req() req: Request,
    @Param('id') id: string
  ): Promise<{ favorites: string[] }> {
    if (!req.user) throw new BadRequestException('User not found in request');
    const user: JwtUser = req.user as JwtUser;
    if (!isValidObjectId(id))
      throw new BadRequestException('Invalid recipe ID');
    const userDoc = await this.userModel.findById(user.userId).exec();
    if (!userDoc) throw new NotFoundException('User not found');
    const index = userDoc.favorites.findIndex(
      (fav: Types.ObjectId) => fav.toString() === id
    );
    if (index === -1) {
      throw new BadRequestException('Recipe not in favorites.');
    }
    userDoc.favorites.splice(index, 1);
    await userDoc.save();
    return {
      favorites: userDoc.favorites.map((fav: Types.ObjectId) => fav.toString()),
    };
  }

  // Get user's favorite recipes
  @UseGuards(JwtAuthGuard)
  @Get(':language/favorites')
  async getFavorites(
    @Req() req: Request,
    @Param('language') language: string
  ): Promise<{ recipes: Recipe[] }> {
    if (!req.user) throw new BadRequestException('User not found in request');
    const user: JwtUser = req.user as JwtUser;
    const userDoc = await this.userModel.findById(user.userId).lean().exec();
    if (!userDoc) throw new NotFoundException('User not found');
    const favoriteIds = Array.isArray(userDoc.favorites)
      ? userDoc.favorites.map((fav: Types.ObjectId) => fav.toString())
      : [];
    if (!favoriteIds.length) return { recipes: [] };
    const recipes = await this.recipeModel
      .find({ _id: { $in: favoriteIds }, language })
      .lean()
      .exec();
    return { recipes };
  }
}
