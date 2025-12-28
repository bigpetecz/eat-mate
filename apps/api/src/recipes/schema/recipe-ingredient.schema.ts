import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

// Nutrition schema for nested documents
@Schema({ _id: false })
export class Nutrition {
  @Prop() calories: number;
  @Prop() protein: number;
  @Prop() fat: number;
  @Prop() carbs: number;
  @Prop() fiber: number;
  @Prop() sugar: number;
  @Prop() sodium: number;
}
export const NutritionSchema = SchemaFactory.createForClass(Nutrition);

// Nested ingredient entry in a recipe
@Schema({ _id: false })
export class RecipeIngredient {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingredient',
    required: true,
  })
  ingredientId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'IngredientVariant' })
  variantId?: mongoose.Types.ObjectId;

  @Prop({ required: true })
  quantity: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: false })
  unit?: mongoose.Types.ObjectId;

  @Prop({ type: NutritionSchema, required: false })
  nutrition?: Nutrition;
}
export const RecipeIngredientSchema =
  SchemaFactory.createForClass(RecipeIngredient);
