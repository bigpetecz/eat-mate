import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  Req,
  Body,
  BadRequestException,
  Put,
} from '@nestjs/common';
import { Recipe } from '../recipes/schema/recipe.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';
import type { JwtUser } from '../auth/jwt-user.interface';
import { FavoriteRecipeDto } from './dto/favorite-recipe.dto';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Get recipes authored by the current user
  @UseGuards(JwtAuthGuard)
  @Get(':language/my-recipes')
  async getMyRecipes(
    @Req() req: Request,
    @Param('language') language: string
  ): Promise<{ recipes: Recipe[] }> {
    if (!req.user) throw new BadRequestException('User not found in request');
    const user: JwtUser = req.user as JwtUser;
    return this.usersService.getMyRecipes(user, language);
  }

  // Update user settings (displayName, theme)
  @UseGuards(JwtAuthGuard)
  @Put('settings')
  async updateSettings(
    @Req() req: Request,
    @Body() dto: UpdateUserSettingsDto
  ): Promise<{
    displayName: string;
    theme: string;
    gender: 'male' | 'female' | null;
    language: 'en' | 'cs';
  }> {
    if (!req.user) throw new BadRequestException('User not found in request');
    const user: JwtUser = req.user as JwtUser;
    return this.usersService.updateSettings(user, dto);
  }

  // Generate a unique funny username using OpenAI
  @UseGuards(JwtAuthGuard)
  @Get('generate-user-name')
  async generateFunnyName(
    @Req() req: Request
  ): Promise<{ displayName: string }> {
    const displayNameParam = req.query.displayName as string;
    const emailParam = req.query.email as string;
    return this.usersService.generateFunnyName(displayNameParam, emailParam);
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
    return this.usersService.addFavorite(user, dto.recipeId);
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
    return this.usersService.removeFavorite(user, id);
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
    return this.usersService.getFavorites(user, language);
  }
}
