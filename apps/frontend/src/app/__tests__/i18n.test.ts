import { getLocalizedRoute, resolveLocalizedPath, i18n } from '../../i18n';

describe('i18n', () => {
  describe('getLocalizedRoute', () => {
    it('returns the correct English discover path without params', () => {
      const result = getLocalizedRoute('discover', 'en', undefined);
      expect(result).toBe('/en/discover');
    });

    it('returns the correct Czech discover path without params', () => {
      const result = getLocalizedRoute('discover', 'cs', undefined);
      expect(result).toBe('/cs/objevuj');
    });

    it('appends query params to English discover route', () => {
      const result = getLocalizedRoute('discover', 'en', { search: 'pizza' });
      expect(result).toContain('/en/discover');
      expect(result).toContain('search=pizza');
    });

    it('builds recipe detail route for English', () => {
      const result = getLocalizedRoute('recipeDetail', 'en', 'pasta-bolognese');
      expect(result).toBe('/en/recipe/pasta-bolognese');
    });

    it('builds recipe detail route for Czech', () => {
      const result = getLocalizedRoute('recipeDetail', 'cs', 'pasta-bolognese');
      expect(result).toBe('/cs/recept/pasta-bolognese');
    });

    it('returns static routes without invocation', () => {
      expect(getLocalizedRoute('login', 'en')).toBe('/en/sign-in');
      expect(getLocalizedRoute('login', 'cs')).toBe('/cs/prihlasit-se');
    });

    it('returns correct homepage routes', () => {
      expect(getLocalizedRoute('homepage', 'en')).toBe('/');
      expect(getLocalizedRoute('homepage', 'cs')).toBe('/cs');
    });
  });

  describe('resolveLocalizedPath — language swap', () => {
    it('swaps en discover to cs discover', () => {
      const result = resolveLocalizedPath('/en/discover', 'cs');
      expect(result).toBe('/cs/objevuj');
    });

    it('swaps cs discover to en discover', () => {
      const result = resolveLocalizedPath('/cs/objevuj', 'en');
      expect(result).toBe('/en/discover');
    });

    it('swaps en recipe detail to cs recipe detail', () => {
      const result = resolveLocalizedPath('/en/recipe/pasta-bolognese', 'cs');
      expect(result).toBe('/cs/recept/pasta-bolognese');
    });

    it('swaps cs recipe detail to en recipe detail', () => {
      const result = resolveLocalizedPath('/cs/recept/gulasch', 'en');
      expect(result).toBe('/en/recipe/gulasch');
    });

    it('swaps en login to cs login', () => {
      const result = resolveLocalizedPath('/en/sign-in', 'cs');
      expect(result).toBe('/cs/prihlasit-se');
    });

    it('falls back gracefully for unknown paths', () => {
      const result = resolveLocalizedPath('/en/unknown-page', 'cs');
      expect(result).toBe('/cs/unknown-page');
    });
  });

  describe('i18n config', () => {
    it('has en as default locale', () => {
      expect(i18n.defaultLocale).toBe('en');
    });

    it('supports en and cs locales', () => {
      expect(i18n.locales).toContain('en');
      expect(i18n.locales).toContain('cs');
    });
  });
});
