import 'dotenv/config';
import { config } from 'dotenv';
config({ path: 'apps/api/.env.local' });
import mongoose from 'mongoose';
import { Unit } from '../src/units/schema/unit.schema';

const units = [
  {
    code: 'g',
    defaultName: 'gram',
    category: 'weight',
    conversionToBase: 1,
    locales: { en: 'gram', cz: 'gram', fr: 'gramme', es: 'gramo' },
  },
  {
    code: 'kg',
    defaultName: 'kilogram',
    category: 'weight',
    conversionToBase: 1000,
    locales: {
      en: 'kilogram',
      cz: 'kilogram',
      fr: 'kilogramme',
      es: 'kilogramo',
    },
  },
  {
    code: 'ml',
    defaultName: 'milliliter',
    category: 'volume',
    conversionToBase: 1,
    locales: {
      en: 'milliliter',
      cz: 'mililitr',
      fr: 'millilitre',
      es: 'mililitro',
    },
  },
  {
    code: 'l',
    defaultName: 'liter',
    category: 'volume',
    conversionToBase: 1000,
    locales: { en: 'liter', cz: 'litr', fr: 'litre', es: 'litro' },
  },
  {
    code: 'tsp',
    defaultName: 'teaspoon',
    category: 'volume',
    conversionToBase: 5,
    locales: {
      en: 'teaspoon',
      cz: 'lžička',
      fr: 'cuillère à café',
      es: 'cucharadita',
    },
  },
  {
    code: 'tbsp',
    defaultName: 'tablespoon',
    category: 'volume',
    conversionToBase: 15,
    locales: {
      en: 'tablespoon',
      cz: 'lžíce',
      fr: 'cuillère à soupe',
      es: 'cucharada',
    },
  },
  {
    code: 'cup',
    defaultName: 'cup',
    category: 'volume',
    conversionToBase: 240,
    locales: { en: 'cup', cz: 'hrnek', fr: 'tasse', es: 'taza' },
  },
  {
    code: 'pcs',
    defaultName: 'piece',
    category: 'count',
    conversionToBase: 1,
    locales: { en: 'piece', cz: 'kus', fr: 'pièce', es: 'pieza' },
  },
];

const MONGO_URI = process.env.MONGODB_URI;

async function main() {
  if (MONGO_URI === undefined) {
    throw new Error('MONGODB_URI is not defined');
  }
  await mongoose.connect(MONGO_URI);
  for (const unit of units) {
    await Unit.updateOne({ code: unit.code }, { $set: unit }, { upsert: true });
  }
  console.log('Units populated!');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
