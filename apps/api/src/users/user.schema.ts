import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true }) // This automatically adds createdAt and updatedAt
export class User extends Document {
  @Prop({ required: true, unique: true })
  googleId: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  displayName: string;

  @Prop()
  picture: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
