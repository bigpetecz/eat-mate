import mongoose from 'mongoose';
import { Unit } from '../src/units/schema/unit.schema';
import 'dotenv/config';
import { config } from 'dotenv';
config({ path: ['apps/api/.env', 'apps/api/.env.local'] });
import { Translate } from '@google-cloud/translate/build/src/v2';

const MONGO_URI = process.env.MONGODB_URI;
const GOOGLE_KEY_PATH = process.env.GOOGLE_KEY_PATH;

async function main() {
  if (!MONGO_URI) throw new Error('MONGODB_URI is not defined');
  if (!GOOGLE_KEY_PATH) throw new Error('GOOGLE_KEY_PATH is not defined');
  await mongoose.connect(MONGO_URI);

  const translate = new Translate({ keyFilename: GOOGLE_KEY_PATH });

  const units = await Unit.find({
    $or: [
      { 'locales.cs': { $exists: false } },
      { 'locales.cs': '' },
      { 'locales.cs': null },
    ],
  });

  for (const unit of units) {
    const locales = (unit.locales || {}) as { en: string; cs?: string };
    // Always ensure 'en' is present
    if (!locales.en) {
      locales.en = unit.defaultName;
    }
    const enName = String(locales.en);
    if (!enName || typeof enName !== 'string') continue;
    try {
      const [csName] = await translate.translate(enName, 'cs');
      locales.cs = csName;
      unit.locales = locales;
      await unit.save();
      console.log(`Translated unit: ${enName} → ${csName}`);
    } catch (err) {
      console.error(`Failed to translate unit: ${enName}`, err);
    }
  }

  await mongoose.disconnect();
  console.log('Done translating units to Czech.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
