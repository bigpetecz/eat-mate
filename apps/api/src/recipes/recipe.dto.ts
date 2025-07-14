import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class IngredientDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  quantity: string;
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
  @IsString()
  winePairing?: string;

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

  @IsNumber()
  @IsOptional()
  prepTime?: number;

  @IsNumber()
  @IsNotEmpty()
  cookTime: number;

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

export class UpdateRecipeDto extends CreateRecipeDto {}
