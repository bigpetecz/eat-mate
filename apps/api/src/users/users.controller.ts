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
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { Recipe } from '../recipes/recipe.schema';
import { User } from './user.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';
// JwtUser type from jwt.strategy validate()
type JwtUser = { userId: string; email: string };
// UserDecorator: use @Req() for now since custom decorator is missing
import { IsString } from 'class-validator';
import { Type } from 'class-transformer';

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
    @InjectModel(Recipe.name) private readonly recipeModel: Model<Recipe>
  ) {}

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
  @Get('favorites')
  async getFavorites(@Req() req: Request): Promise<{ recipes: Recipe[] }> {
    if (!req.user) throw new BadRequestException('User not found in request');
    const user: JwtUser = req.user as JwtUser;
    const userDoc = await this.userModel.findById(user.userId).lean().exec();
    if (!userDoc) throw new NotFoundException('User not found');
    const favoriteIds = Array.isArray(userDoc.favorites)
      ? userDoc.favorites.map((fav: Types.ObjectId) => fav.toString())
      : [];
    if (!favoriteIds.length) return { recipes: [] };
    const recipes = await this.recipeModel
      .find({ _id: { $in: favoriteIds } })
      .lean()
      .exec();
    return { recipes };
  }
}
