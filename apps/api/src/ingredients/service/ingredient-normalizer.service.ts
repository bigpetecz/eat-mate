import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
// pluralize has no TypeScript types, use require

const pluralize = require('pluralize');
import { distance } from 'fastest-levenshtein';

@Injectable()
export class IngredientNormalizerService {
  constructor(
    @InjectModel('IngredientVariant') private variantModel: Model<any>, // eslint-disable-line @typescript-eslint/no-explicit-any
    @InjectModel('Ingredient') private ingredientModel: Model<any> // eslint-disable-line @typescript-eslint/no-explicit-any
  ) {}

  async normalizeIngredientString(str: string): Promise<string> {
    return str
      .toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\\-_`~()]/g, '')
      .trim();
  }

  async findOrCreateVariant(
    inputName: string
  ): Promise<{ ingredientId: string; variantId: string }> {
    const normalized = await this.normalizeIngredientString(inputName);
    // 1. Exact match in variants
    const variant = await this.variantModel
      .findOne({ defaultName: normalized })
      .exec();
    if (variant) {
      return {
        ingredientId: String(variant.ingredientId),
        variantId: String(variant._id),
      };
    }
    // 2. Fuzzy match
    const allVariants = await this.variantModel.find().exec();
    let bestMatch = null;
    let bestScore = Infinity;
    for (const v of allVariants) {
      const score = distance(normalized, v.defaultName);
      if (score < bestScore) {
        bestScore = score;
        bestMatch = v;
      }
    }
    if (bestMatch && bestScore < 3) {
      return {
        ingredientId: String(bestMatch.ingredientId),
        variantId: String(bestMatch._id),
      };
    }
    // 3. Create new variant (and base if needed)
    const words = normalized.split(' ');
    const baseName = pluralize.singular(words[words.length - 1]);
    let baseIngredient = await this.ingredientModel
      .findOne({ defaultName: baseName })
      .exec();
    if (!baseIngredient) {
      baseIngredient = await this.ingredientModel.create({
        defaultName: baseName,
        locales: { en: baseName },
        variants: [],
      });
    }
    const newVariant = await this.variantModel.create({
      ingredientId: baseIngredient._id,
      defaultName: normalized,
      locales: { en: normalized },
    });
    baseIngredient.variants.push(newVariant._id);
    await baseIngredient.save();
    return {
      ingredientId: String(baseIngredient._id),
      variantId: String(newVariant._id),
    };
  }
}
