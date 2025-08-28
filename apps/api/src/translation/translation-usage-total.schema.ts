import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class TranslationUsageTotal extends Document {
  @Prop({ required: true, default: 0 })
  total: number;
  @Prop({ required: true, default: new Date() })
  lastUpdated: Date;
}

export const TranslationUsageTotalSchema = SchemaFactory.createForClass(
  TranslationUsageTotal
);
