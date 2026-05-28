import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteImageDto {
  @IsString()
  @IsNotEmpty()
  url: string;
}
