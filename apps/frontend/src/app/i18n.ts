import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Example translations
const resources = {
  en: {
    translation: {
      'Discover Your Next Favorite Recipe':
        'Discover Your Next Favorite Recipe',
      'Cook smarter, filter better, enjoy more.':
        'Cook smarter, filter better, enjoy more.',
      'Loading recipes...': 'Loading recipes...',
      'Login to your account': 'Login to your account',
      'Enter your email below to login to your account':
        'Enter your email below to login to your account',
      Email: 'Email',
      Password: 'Password',
      'Forgot your password?': 'Forgot your password?',
      Login: 'Login',
      'Login with Google': 'Login with Google',
      "Don't have an account?": "Don't have an account?",
      'Sign up': 'Sign up',
      Prep: 'Prep',
      Cook: 'Cook',
      Servings: 'Servings',
      Ingredients: 'Ingredients',
      Instructions: 'Instructions',
      Save: 'Save',
      Favorite: 'Favorite',
      'Sign In': 'Sign In',
      Register: 'Register',
      Profile: 'Profile',
      Logout: 'Logout',
    },
  },
  cs: {
    translation: {
      'Discover Your Next Favorite Recipe':
        'Objevte svůj další oblíbený recept',
      'Cook smarter, filter better, enjoy more.':
        'Vařte chytřeji, lépe filtrujte, více si užívejte.',
      'Loading recipes...': 'Načítání receptů...',
      'Login to your account': 'Přihlaste se ke svému účtu',
      'Enter your email below to login to your account':
        'Zadejte svůj e-mail pro přihlášení',
      Email: 'E-mail',
      Password: 'Heslo',
      'Forgot your password?': 'Zapomněli jste heslo?',
      Login: 'Přihlásit se',
      'Login with Google': 'Přihlásit se přes Google',
      "Don't have an account?": 'Nemáte účet?',
      'Sign up': 'Zaregistrovat se',
      Prep: 'Příprava',
      Cook: 'Vaření',
      Servings: 'Porce',
      Ingredients: 'Ingredience',
      Instructions: 'Postup',
      Save: 'Uložit',
      Favorite: 'Oblíbené',
      'Sign In': 'Přihlásit se',
      Register: 'Registrovat',
      Profile: 'Profil',
      Logout: 'Odhlásit se',
    },
  },
};

i18n.use(LanguageDetector).init({
  resources,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  detection: {
    order: ['localStorage', 'navigator'],
    caches: ['localStorage'],
  },
});

export default i18n;
