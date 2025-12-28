import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Nutrition } from './recipe-ingredient.schema';
import { Flavour, FlavourSchema } from './flavour.schema';
import { DietLabel, SpecialAttribute, Technique } from '../recipe.enums';

@Schema({ _id: false, timestamps: true })
export class AIInfo {
  @Prop() nutrition: Nutrition; // full breakdown
  @Prop({ type: [String], enum: DietLabel, default: [] })
  dietLabels: DietLabel[];
  @Prop() winePairing: string;
  @Prop({ type: [String] })
  keywords: string[]; // e.g., "quick lunch", "low carb"
  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'Recipe' })
  relatedRecipes: mongoose.Types.ObjectId[];
  @Prop({ type: [String], enum: Technique, default: [] })
  techniques: Technique[];
  @Prop({ enum: ['Easy', 'Medium', 'Hard'] })
  difficulty: string;
  @Prop()
  estimatedCost: number;
  @Prop() hash: string;
  @Prop({ type: [String], enum: SpecialAttribute, default: [] })
  specialAttributes: SpecialAttribute[];
  @Prop({ type: FlavourSchema })
  flavour?: Flavour;
}

export const AIInfoSchema = SchemaFactory.createForClass(AIInfo);
