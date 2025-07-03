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
}

export class UpdateRecipeDto extends CreateRecipeDto {}
