import { Schema, model, Types, Document, InferSchemaType } from 'mongoose';

export const IngredientSchema = new Schema({
  defaultName: { type: String, required: true },
  category: { type: String },
  locales: {
    en: { type: String, required: true },
    cs: { type: String },
  },
  variants: [{ type: Types.ObjectId, ref: 'IngredientVariant' }],
  nutrition: {
    calories: { type: Number },
    protein: { type: Number },
    fat: { type: Number },
    carbs: { type: Number },
    fiber: { type: Number },
    sugar: { type: Number },
    sodium: { type: Number },
  },
  // image can be either a legacy string filename or an object with variants
  image: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Ensure unique index on defaultName
IngredientSchema.index({ defaultName: 1 }, { unique: true });

// Define the Document type for Ingredient
// Infer the TypeScript type of an Ingredient document
// Mongoose model and document type for Ingredient
// TypeScript type for Ingredient based on schema
export type IngredientType = InferSchemaType<typeof IngredientSchema>;
// Full Mongoose Document for Ingredient
export type IngredientDocument = IngredientType & Document;
// Mongoose model for Ingredient
export const Ingredient = model<IngredientDocument>(
  'Ingredient',
  IngredientSchema
);
