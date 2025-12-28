import { Schema, model, Types } from 'mongoose';

export const IngredientVariantSchema = new Schema({
  ingredientId: { type: Types.ObjectId, ref: 'Ingredient', required: true },
  defaultName: { type: String, required: true },
  locales: {
    en: { type: String, required: true },
    cs: { type: String },
  },
  attributes: {
    preparation: { type: String },
    state: { type: String },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Ensure unique index on ingredientId + defaultName
IngredientVariantSchema.index(
  { ingredientId: 1, defaultName: 1 },
  { unique: true }
);

export const IngredientVariant = model(
  'IngredientVariant',
  IngredientVariantSchema
);
