import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User } from '../users/user.schema';

@Schema({ _id: false })
class Ingredient {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  quantity: string;
}

@Schema({ _id: false })
class Image {
  @Prop({ required: true })
  url: string;
  @Prop({ required: true })
  description: string;
}

@Schema({ timestamps: true })
export class Recipe extends mongoose.Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  author: User;
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  images: Image[];

  @Prop()
  prepTime: number;

  @Prop({ required: true })
  cookTime: number;

  @Prop()
  servings: number;

  @Prop({ type: [Ingredient], required: true })
  ingredients: Ingredient[];

  @Prop({ type: [String], required: true })
  instructions: string[];

  @Prop()
  country: string;
}

export const RecipeSchema = SchemaFactory.createForClass(Recipe);
