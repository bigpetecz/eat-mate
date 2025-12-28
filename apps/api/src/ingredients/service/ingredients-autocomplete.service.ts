import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IngredientAutocompleteResultDto } from '../dto/ingredient-autocomplete.dto';
import { IngredientDocument } from '../schema/ingredient.schema';
import { Types } from 'mongoose';

// Shape of the raw ingredient documents returned by `.lean()`
interface IngredientRaw {
  _id: Types.ObjectId;
  locales: Record<string, string>;
  image?: string | { variants?: Record<string, string> };
}

@Injectable()
export class IngredientsAutocompleteService {
  constructor(
    @InjectModel('Ingredient')
    private ingredientModel: Model<IngredientDocument>
  ) {}

  async autocomplete(
    query: string,
    lang?: string
  ): Promise<IngredientAutocompleteResultDto[]> {
    if (!query || query.length < 2) {
      return [];
    }
    const locale = lang || 'en';
    const filter = { [`locales.${locale}`]: { $regex: query, $options: 'i' } };
    // Execute lean query and cast to local lean interface
    // Execute lean query and cast via unknown to our local lean interface
    const docs = (await this.ingredientModel
      .find(filter)
      .limit(10)
      .lean()
      .exec()) as unknown as IngredientRaw[];
    return docs.map((doc) => this.toDto(doc, locale));
  }

  // Map raw Mongo result to DTO
  private toDto(
    doc: IngredientRaw,
    locale: string
  ): IngredientAutocompleteResultDto {
    let imageUrl: string | null = null;
    if (doc.image) {
      if (typeof doc.image === 'object' && doc.image.variants?.['36']) {
        imageUrl = doc.image.variants['36'];
      } else if (typeof doc.image === 'string') {
        imageUrl = doc.image;
      }
    }
    return {
      id: doc._id.toString(),
      name: doc.locales[locale] || doc.locales.en || '',
      image: imageUrl,
    };
  }
}
