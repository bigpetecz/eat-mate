import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user.schema';
import { UsersController } from './users.controller';
import { Recipe, RecipeSchema } from '../recipes/recipe.schema';
import { OpenAIModule } from '../openai/openai.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Recipe.name, schema: RecipeSchema },
    ]),
    OpenAIModule,
  ],
  exports: [MongooseModule],
  providers: [],
  controllers: [UsersController],
})
export class UsersModule {}
