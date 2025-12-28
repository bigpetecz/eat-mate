import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class Flavour {
  @Prop() sweetness: number;
  @Prop() saltiness: number;
  @Prop() sourness: number;
  @Prop() bitterness: number;
  @Prop() savoriness: number;
  @Prop() fattiness: number;
  @Prop() spiciness: number;
}

export const FlavourSchema = SchemaFactory.createForClass(Flavour);
