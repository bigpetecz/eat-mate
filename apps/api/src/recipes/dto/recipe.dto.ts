import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Expose, Type } from 'class-transformer';

import { IsMongoId, IsEnum } from 'class-validator';
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { WinePairing } from '../recipe.enums';

class IngredientDto {
  @IsMongoId()
  @IsOptional()
  ingredientId?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsMongoId()
  @IsOptional()
  variantId?: string;

  @Type(() => Number)
  @IsNumber()
  quantity: number;

  @IsString()
  @IsString()
  @IsOptional()
  unit?: string; // references unit code for freeform entries

  @IsMongoId()
  @IsOptional()
  unitId?: string; // references Unit _id when selected from autocomplete
}

class ImageDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}

class NutritionDto {
  @IsOptional()
  @IsNumber()
  calories?: number;

  @IsOptional()
  @IsNumber()
  protein?: number;

  @IsOptional()
  @IsNumber()
  fat?: number;

  @IsOptional()
  @IsNumber()
  carbs?: number;

  @IsOptional()
  @IsNumber()
  fiber?: number;

  @IsOptional()
  @IsNumber()
  sugar?: number;

  @IsOptional()
  @IsNumber()
  sodium?: number;
}

class AiInfoDto {
  @IsOptional()
  @IsNumber()
  estimatedCalories?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => NutritionDto)
  nutrition?: NutritionDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dietLabels?: string[];

  @IsOptional()
  @IsEnum(WinePairing)
  winePairing?: WinePairing;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedRecipes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  techniques?: string[];

  @IsOptional()
  @IsString()
  difficulty?: string;

  @IsOptional()
  @IsNumber()
  estimatedCost?: number;

  @IsOptional()
  @IsString()
  hash?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialAttributes?: string[];
}

// New DTO for populated ingredient entries
export class RecipeIngredientDto {
  @ApiProperty({ description: 'Ingredient unique identifier', type: String })
  @IsMongoId()
  ingredientId: string;

  @ApiProperty({ description: 'Quantity', type: Number })
  @Type(() => Number)
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: 'Unit name (localized)', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({
    description: 'Variant unique identifier',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsMongoId()
  variantId?: string;

  @ApiProperty({ description: 'Ingredient display name (localized)' })
  @Expose()
  @IsString()
  name: string;
}

export class CreateRecipeDto {
  @IsString()
  @IsNotEmpty()
  author: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageDto)
  @IsOptional()
  images?: ImageDto[];

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  prepTime?: number;

  @Type(() => Number)
  @IsNumber()
  cookTime: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  servings?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngredientDto)
  ingredients: IngredientDto[];

  @IsArray()
  @IsString({ each: true })
  instructions: string[];

  @IsString()
  @IsOptional()
  country?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AiInfoDto)
  ai?: AiInfoDto;
}

/**
 * DTO for updating recipes; all fields optional
 */
export class UpdateRecipeDto extends PartialType(CreateRecipeDto) {}

/**
 * DTO for returning recipe data
 */
export class RecipeDto extends OmitType(CreateRecipeDto, [
  'images',
  'ingredients',
] as const) {
  @ApiProperty({ description: 'Recipe unique identifier' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'SEO-friendly unique slug' })
  @Expose()
  slug: string;

  @ApiProperty({ type: [String], description: 'Image URLs' })
  @Expose()
  images: string[];

  @ApiProperty({
    type: [RecipeIngredientDto],
    description: 'Populated ingredient entries',
  })
  @Expose()
  @Type(() => RecipeIngredientDto)
  ingredients: RecipeIngredientDto[];

  @ApiProperty({ description: 'Average user rating', type: Number })
  @Expose()
  @IsNumber()
  averageRating: number;

  @ApiProperty({ description: 'Number of ratings', type: Number })
  @Expose()
  @IsNumber()
  ratingCount: number;
}
