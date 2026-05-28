import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateUserSettingsDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsIn(['auto', 'dark', 'light'])
  theme?: 'auto' | 'dark' | 'light';

  @IsOptional()
  @IsIn(['male', 'female', null])
  gender?: 'male' | 'female' | null;

  @IsOptional()
  @IsIn(['en', 'cs'])
  language?: 'en' | 'cs';
}
