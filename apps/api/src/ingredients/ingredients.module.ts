import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IngredientsAutocompleteService } from './service/ingredients-autocomplete.service';
import { IngredientsController } from './ingredients.controller';
import { IngredientSchema } from './schema/ingredient.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Ingredient', schema: IngredientSchema },
    ]),
  ],
  controllers: [IngredientsController],
  providers: [IngredientsAutocompleteService],
})
export class IngredientsModule {}
