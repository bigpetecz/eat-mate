import fs from 'fs';
import path from 'path';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import mongoose from 'mongoose';
import { Ingredient } from '../src/recipes/ingredient.schema';
import 'dotenv/config';
import { config } from 'dotenv';
config({ path: 'apps/api/.env.local' });

const IMAGE_DIR = '/Volumes/Yoda/ingredients';
const SIZE_36 = 36;
const SIZE_250 = 250;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

function resizeImageBuffer(buffer: Buffer, size: number): Promise<Buffer> {
  const sharp = require('sharp');
  return sharp(buffer).resize(size, size).toBuffer();
}

async function resourceExists(publicId: string): Promise<boolean> {
  try {
    await cloudinary.api.resource(publicId, { resource_type: 'image' });
    return true;
  } catch (e: unknown) {
    if (
      e &&
      typeof e === 'object' &&
      'http_code' in e &&
      (e as { http_code?: number }).http_code === 404
    )
      return false;
    throw e;
  }
}

interface UploadResult {
  skipped: boolean;
  sizedPublicId: string;
  secureUrl?: string;
}

interface IngredientImageObject {
  basePublicId: string;
  variants: { [size: string]: string };
}

function buildCloudinaryUrl(publicId: string, ext = 'png') {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}.${ext}`;
}

async function uploadImage(
  filePath: string,
  publicId: string,
  size: number,
  force = false
): Promise<UploadResult> {
  const sizedPublicId = `${publicId}_${size}x${size}`;
  if (!force) {
    const exists = await resourceExists(sizedPublicId).catch((err) => {
      console.warn(
        `Warn: existence check failed for ${sizedPublicId}: ${
          (err as Error).message
        }`
      );
      return false;
    });
    if (exists) return { skipped: true, sizedPublicId };
  }
  const originalBuffer = fs.readFileSync(filePath);
  const buffer =
    size === SIZE_250
      ? originalBuffer
      : await resizeImageBuffer(originalBuffer, size);
  return new Promise<UploadResult>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: 'image',
          public_id: sizedPublicId,
          overwrite: true,
        },
        (error: unknown, result: UploadApiResponse | undefined) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('No Cloudinary result'));
          resolve({
            skipped: false,
            sizedPublicId,
            secureUrl: result.secure_url,
          });
        }
      )
      .end(buffer);
  });
}

async function main() {
  const force = process.argv.includes('--force');
  const dryRun = process.argv.includes('--dry-run');
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI is not defined');
  await mongoose.connect(mongoUri);
  console.log(`Start ingredient image upload. Force=${force} DryRun=${dryRun}`);

  const files = fs
    .readdirSync(IMAGE_DIR)
    .filter((f) => /\.(png|jpe?g)$/i.test(f));

  for (const file of files) {
    const filePath = path.join(IMAGE_DIR, file);
    const publicId = path.parse(file).name; // base name
    try {
      const original = await uploadImage(filePath, publicId, SIZE_250, force);
      const thumb = await uploadImage(filePath, publicId, SIZE_36, force);

      // Find ingredient whose current stored filename matches this file
      // Handles legacy string (image === file) or already migrated object with basePublicId
      const ingredient = await Ingredient.findOne({
        $or: [{ image: file }, { 'image.basePublicId': publicId }],
      }).exec();

      let dbStatus = 'no-match';
      if (ingredient) {
        if (!dryRun) {
          const ext = path.extname(file).replace('.', '') || 'png';
          const imageObject: IngredientImageObject = {
            basePublicId: publicId,
            variants: {
              '250': buildCloudinaryUrl(original.sizedPublicId, ext),
              '36': buildCloudinaryUrl(thumb.sizedPublicId, ext),
            },
          };
          ingredient.set('image', imageObject);
          await ingredient.save();
          dbStatus = 'updated';
        } else {
          dbStatus = 'would-update';
        }
      }

      console.log(
        `${file}: 250=${original.skipped ? 'skip' : 'up'}, 36=${
          thumb.skipped ? 'skip' : 'up'
        } | ingredient=${dbStatus}`
      );
    } catch (err) {
      console.error(`Failed ${file}:`, err);
    }
  }

  await mongoose.disconnect();
  console.log('Upload complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
