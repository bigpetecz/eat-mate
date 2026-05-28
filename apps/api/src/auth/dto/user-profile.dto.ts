export class UserProfileDto {
  _id: string;
  id: string;
  email: string;
  displayName: string;
  theme: 'auto' | 'light' | 'dark';
  picture?: string;
  gender?: 'male' | 'female' | null;
  language: 'en' | 'cs';
}
