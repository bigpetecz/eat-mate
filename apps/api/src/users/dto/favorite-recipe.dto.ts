import { Type } from 'class-transformer';
import { IsMongoId } from 'class-validator';

export class FavoriteRecipeDto {
  @IsMongoId()
  @Type(() => String)
  recipeId: string;
}
