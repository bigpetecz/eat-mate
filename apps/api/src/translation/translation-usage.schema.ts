import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class TranslationUsage extends Document {
  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  words: number;
}

export const TranslationUsageSchema =
  SchemaFactory.createForClass(TranslationUsage);
