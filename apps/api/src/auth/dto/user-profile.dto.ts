export class UserProfileDto {
  id: string;
  email: string;
  displayName: string;
  theme: 'auto' | 'light' | 'dark';
  picture?: string;
  gender?: 'male' | 'female' | null;
}
