import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UnitAutocompleteQueryDto {
  @ApiProperty({ description: 'Query string for unit search', minLength: 1 })
  @IsString()
  @MinLength(1)
  q: string;

  @ApiProperty({ description: 'Language code', required: false, default: 'en' })
  @IsString()
  @IsOptional()
  lang?: string;
}

export class UnitAutocompleteResultDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  symbol?: string;
}
