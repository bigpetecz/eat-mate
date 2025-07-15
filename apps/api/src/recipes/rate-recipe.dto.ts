import { IsInt, Min, Max } from 'class-validator';

export class RateRecipeDto {
  @IsInt()
  @Min(1)
  @Max(5)
  value: number;
}
