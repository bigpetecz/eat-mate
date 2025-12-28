export type UnitLang = 'en' | 'cs';
export interface Unit {
  id: string;
  name: { en: string; cs: string };
  symbol: string;
}
