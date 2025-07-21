import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';

@Schema({ timestamps: true }) // This automatically adds createdAt and updatedAt
export class User extends Document {
  @Prop({ required: true, unique: true })
  googleId: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
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
}

export const UserSchema = SchemaFactory.createForClass(User);
