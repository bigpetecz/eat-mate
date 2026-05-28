import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateImageDto {
  @IsString()
  @IsNotEmpty()
  oldUrl: string;

  @IsString()
  @IsNotEmpty()
  newUrl: string;
}
