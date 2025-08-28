import { Locale } from '@/i18n';

type Namespace =
  | 'common'
  | 'sign-in'
  | 'sign-up'
  | 'home'
  | 'discover'
  | 'favorites'
  | 'my-recipes'
  | 'create-recipe'
  | 'recipe-form'
  | 'settings';

export const getDictionary = async (locale: Locale, namespace: Namespace) => {
  const mod = await import(`./${namespace}/${locale}.json`).then(
    (m) => m.default
  );
  return mod;
};
