import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  DietLabel,
  Technique,
  WinePairing,
  SpecialAttribute,
} from '../recipes/recipe.schema';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;
  private readonly logger = new Logger(OpenAIService.name);

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async generateUsername(profile: { name: string; email: string }) {
    const prompt = `Suggest a unique, short, cook chef and friendly and funny username for this Google profile: Name: ${profile.name} Email: ${profile.email}`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt },
      ],
    });

    const suggestion = completion.choices[0].message.content.trim();
    return suggestion;
  }

  /**
   * Generate AI fields (keywords, dietLabels, nutrition) for a recipe using OpenAI.
   */
  async generateAiFields(recipe: {
    title: string;
    description?: string;
    ingredients: { name: string; quantity: string }[];
    instructions?: string[];
    country?: string;
    dietLabels?: string[];
    servings?: number;
  }): Promise<{
    keywords?: string[];
    dietLabels?: string[];
    nutrition?: any;
    estimatedCost?: number;
    winePairing?: WinePairing;
    techniques?: Technique[];
    difficulty?: string;
    specialAttributes?: string[];
  }> {
    const allowedDietLabels = Object.values(DietLabel);
    const allowedTechniques = Object.values(Technique);
    const allowedWinePairings = Object.values(WinePairing);
    const allowedDifficulties = ['Easy', 'Medium', 'Hard'];
    const allowedSpecialAttributes = Object.values(SpecialAttribute);

    const prompt = `Given the following recipe, extract:
- all applicable diet labels (array, e.g. vegan, vegetarian, gluten-free, etc.)
- all applicable techniques (array, e.g. boiling, grilling, etc.)
- all applicable special attributes (array, e.g. one-pot, slow-cooker, meal-prep, etc.), only use from this list: ${allowedSpecialAttributes.join(
      ', '
    )}, and return as specialAttributes
- estimate nutrition per serving (object: calories, protein, fat, carbs, fiber, sugar, sodium), using the number of servings and ingredient amounts. Calories must be per serving, not for the whole recipe.
- estimate price per 1 serving in Euro (number, e.g. 2.50) and return as estimatedCost
- suggest a wine pairing (string) for this recipe, must be one of: ${allowedWinePairings.join(
      ', '
    )}, and return as winePairing if applicable.
- assign a difficulty (string) for this recipe, must be one of: ${allowedDifficulties.join(
      ', '
    )}, and return as difficulty

Recipe:
Title: ${recipe.title}
Description: ${recipe.description}
Country: ${recipe.country}
Servings: ${recipe.servings}
Ingredients: ${recipe.ingredients
      .map((i) => `${i.name}: ${i.quantity}`)
      .join(', ')}
Instructions: ${(recipe.instructions || []).join(' ')}

Respond in JSON with keys: dietLabels, techniques, specialAttributes, nutrition, estimatedCost, winePairing, difficulty. For dietLabels, only use from this list: ${allowedDietLabels.join(
      ', '
    )}. For techniques, only use from this list: ${allowedTechniques.join(
      ', '
    )}.`;

    let completion;
    try {
      completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful chef AI assistant.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      });
    } catch (err) {
      this.logger.error(
        'OpenAI API call failed in generateAiFields:',
        prompt,
        err
      );
      return {};
    }

    const content = completion.choices[0].message.content;
    try {
      const parsed = JSON.parse(content);
      return {
        dietLabels: parsed.dietLabels,
        nutrition: parsed.nutrition,
        techniques: parsed.techniques,
        specialAttributes: Array.isArray(parsed.specialAttributes)
          ? parsed.specialAttributes.filter((a: string) =>
              allowedSpecialAttributes.includes(a)
            )
          : [],
        estimatedCost: parsed.estimatedCost,
        winePairing: allowedWinePairings.includes(parsed.winePairing)
          ? parsed.winePairing
          : undefined,
        difficulty: allowedDifficulties.includes(parsed.difficulty)
          ? parsed.difficulty
          : undefined,
      };
    } catch (err) {
      this.logger.error(
        'Failed to parse OpenAI response for generateAiFields:',
        content,
        err
      );
      // fallback: return nothing if parsing fails
      return {};
    }
  }
}
