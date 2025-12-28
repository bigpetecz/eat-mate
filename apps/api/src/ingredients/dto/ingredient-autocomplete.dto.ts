import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IngredientAutocompleteQueryDto {
  @ApiProperty({
    description: 'Query string for ingredient search',
    minLength: 2,
  })
  @IsString()
  @MinLength(2)
  q: string;

  @ApiProperty({ description: 'Language code', required: false, default: 'en' })
  @IsString()
  @IsOptional()
  lang?: string;
}

export class IngredientAutocompleteResultDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  image?: string | null;
}
