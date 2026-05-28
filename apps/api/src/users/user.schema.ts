import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';

@Schema({ timestamps: true }) // This automatically adds createdAt and updatedAt
export class User extends Document {
  @Prop({
    type: String,
    required: false,
    unique: true,
    sparse: true,
    default: null,
  })
  googleId: string | null;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ select: false })
  password: string;

  @Prop({ required: true, unique: true })
  displayName: string;

  @Prop({
    type: String,
    enum: ['auto', 'dark', 'light'],
    default: 'auto',
  })
  theme: 'auto' | 'dark' | 'light';

  @Prop()
  picture: string;

  // Add favorites: array of Recipe ObjectIds
  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'Recipe', default: [] })
  favorites: mongoose.Types.ObjectId[];

  @Prop({ type: String, enum: ['male', 'female', null], default: null })
  gender: 'male' | 'female' | null;

  @Prop({ type: String, enum: ['en', 'cs'], default: 'en' })
  language: 'en' | 'cs';
}

export const UserSchema = SchemaFactory.createForClass(User);
