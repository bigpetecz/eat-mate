/**
 * Integration tests for recipe background processing and translation sync.
 *
 * Strategy:
 *  - Real in-memory MongoDB (mongodb-memory-server) so all Mongoose operations
 *    run against a real connection.
 *  - Real RecipesController, RecipeAiAuditService, and RecipesQueryService so
 *    the full internal logic is exercised.
 *  - GoogleTranslateService and OpenAIService are mocked at the boundary so no
 *    third-party network calls are made.
 *  - The AI audit cron method (auditRecipesMissingAi) is called directly –
 *    no need to wait for the scheduler.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Model, Types } from 'mongoose';

import { RecipesController } from './recipes.controller';
import { RecipeAiAuditService } from './service/recipe-ai-audit.service';
import { RecipesQueryService } from './service/recipes-query.service';
import { IngredientNormalizerService } from '../ingredients/service/ingredient-normalizer.service';

import { Recipe, RecipeSchema } from './schema/recipe.schema';
import { UnitSchema } from '../units/schema/unit.schema';
import { IngredientSchema } from '../ingredients/schema/ingredient.schema';
import { IngredientVariantSchema } from '../ingredients/schema/ingredient-variant.schema';

import { GoogleTranslateService } from '../translation/google-translate.service';
import { OpenAIService } from '../openai/openai.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import {
  RecipePublicationEligibility,
  RecipeRightsStatus,
  RecipeSourceType,
} from './recipe.enums';
import type { JwtUser } from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal valid recipe document for direct DB insertion. */
function makeRecipeDoc(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    title: 'Test Recipe',
    description: 'A test description.',
    instructions: ['Step 1', 'Step 2'],
    cookTime: 30,
    language: 'en',
    ingredients: [],
    author: new Types.ObjectId(),
    sourceType: RecipeSourceType.UserOriginal,
    rightsStatus: RecipeRightsStatus.Unknown,
    publicationEligibility: RecipePublicationEligibility.PublicAllowed,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Recipes integration – background processing & translation sync', () => {
  let mongod: MongoMemoryServer;
  let module: TestingModule;
  let controller: RecipesController;
  let auditService: RecipeAiAuditService;
  let recipeModel: Model<Recipe>;

  // Boundary mocks
  const translateTextMock = jest.fn();
  const generateAiFieldsMock = jest.fn();
  const ingredientNormalizerMock = { findOrCreateVariant: jest.fn() };

  // ------------------------------------------------------------------
  // Module lifecycle
  // ------------------------------------------------------------------

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([
          { name: Recipe.name, schema: RecipeSchema },
          { name: 'Unit', schema: UnitSchema },
          { name: 'Ingredient', schema: IngredientSchema },
          { name: 'IngredientVariant', schema: IngredientVariantSchema },
        ]),
        CacheModule.register(),
      ],
      controllers: [RecipesController],
      providers: [
        RecipeAiAuditService,
        RecipesQueryService,
        {
          provide: GoogleTranslateService,
          useValue: { translateText: translateTextMock },
        },
        {
          provide: OpenAIService,
          useValue: { generateAiFields: generateAiFieldsMock },
        },
        {
          provide: CloudinaryService,
          useValue: { uploadImageBuffer: jest.fn(), deleteImage: jest.fn() },
        },
        {
          provide: IngredientNormalizerService,
          useValue: ingredientNormalizerMock,
        },
      ],
    }).compile();

    controller = module.get(RecipesController);
    auditService = module.get(RecipeAiAuditService);
    recipeModel = module.get<Model<Recipe>>(getModelToken(Recipe.name));
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  afterEach(async () => {
    await recipeModel.deleteMany({});
    jest.clearAllMocks();
  });

  // ===========================================================================
  // AI audit
  // ===========================================================================

  describe('AI audit (RecipeAiAuditService.auditRecipesMissingAi)', () => {
    it('fills ai fields on a recipe that has none', async () => {
      generateAiFieldsMock.mockResolvedValue({
        keywords: ['pasta', 'quick'],
        dietLabels: ['Vegetarian'],
        nutrition: { calories: 400 },
        techniques: ['boiling'],
        difficulty: 'Easy',
      });

      await recipeModel.create(makeRecipeDoc({ title: 'Pasta Primavera' }));

      const before = await recipeModel.findOne({ title: 'Pasta Primavera' });
      // hash is only written after a successful audit; arrays may default to []
      expect(before?.ai?.hash).toBeUndefined();

      await auditService.auditRecipesMissingAi();

      const after = await recipeModel.findOne({ title: 'Pasta Primavera' });
      expect(after?.ai?.keywords).toEqual(['pasta', 'quick']);
      expect(after?.ai?.dietLabels).toEqual(['Vegetarian']);
      expect(after?.ai?.hash).toBeDefined();
      expect(generateAiFieldsMock).toHaveBeenCalledTimes(1);
    });

    it('does NOT re-audit a recipe whose content hash is already current', async () => {
      generateAiFieldsMock.mockResolvedValue({
        keywords: ['stew'],
        dietLabels: [],
        nutrition: {},
      });

      await recipeModel.create(makeRecipeDoc({ title: 'Beef Stew' }));
      await auditService.auditRecipesMissingAi();
      expect(generateAiFieldsMock).toHaveBeenCalledTimes(1);

      // Second run — hash now matches, should be a no-op
      await auditService.auditRecipesMissingAi();
      expect(generateAiFieldsMock).toHaveBeenCalledTimes(1);
    });

    it('fills ai fields for every member of a translation family (processes one per batch)', async () => {
      generateAiFieldsMock.mockResolvedValue({
        keywords: ['chicken'],
        dietLabels: [],
        nutrition: {},
      });

      const authorId = new Types.ObjectId();

      const enRecipe = await recipeModel.create(
        makeRecipeDoc({
          title: 'Chicken Soup',
          language: 'en',
          author: authorId,
        }),
      );
      const csRecipe = await recipeModel.create(
        makeRecipeDoc({
          title: 'Kuřecí polévka',
          language: 'cs',
          author: authorId,
          translations: [{ language: 'en', recipeId: enRecipe._id }],
        }),
      );
      enRecipe.translations = [{ language: 'cs', recipeId: csRecipe._id }];
      await enRecipe.save();

      // Audit processes 1 recipe per batch – run twice to cover both family members
      await auditService.auditRecipesMissingAi();
      await auditService.auditRecipesMissingAi();

      const enAfter = await recipeModel.findById(enRecipe._id);
      const csAfter = await recipeModel.findById(csRecipe._id);
      expect(enAfter?.ai?.keywords).toEqual(['chicken']);
      expect(csAfter?.ai?.keywords).toEqual(['chicken']);
      expect(generateAiFieldsMock).toHaveBeenCalledTimes(2);
    });
  });

  // ===========================================================================
  // Translation sync on update
  // ===========================================================================

  describe('recipe update – text field translation sync', () => {
    it('translates changed text fields into all linked language versions', async () => {
      // Mock returns a predictable "[cs] <original>" so we can assert exact values
      translateTextMock.mockImplementation((text: string) =>
        Promise.resolve(`[cs] ${text}`),
      );

      const authorId = new Types.ObjectId();
      const user: JwtUser = {
        userId: authorId.toString(),
        email: 'chef@test.com',
      };

      const enRecipe = await recipeModel.create(
        makeRecipeDoc({
          title: 'Tomato Soup',
          description: 'A simple tomato soup.',
          instructions: ['Heat tomatoes', 'Blend'],
          language: 'en',
          author: authorId,
        }),
      );
      const csRecipe = await recipeModel.create(
        makeRecipeDoc({
          title: 'Rajská polévka',
          description: 'Jednoduchá rajská polévka.',
          instructions: ['Zahřejte rajčata', 'Rozmixujte'],
          language: 'cs',
          author: authorId,
          translations: [{ language: 'en', recipeId: enRecipe._id }],
        }),
      );
      enRecipe.translations = [{ language: 'cs', recipeId: csRecipe._id }];
      await enRecipe.save();

      await controller.patchUpdate(
        enRecipe._id.toString(),
        user as never,
        {
          title: 'Tomato Bisque',
          description: 'A rich, creamy tomato bisque.',
          instructions: ['Roast tomatoes', 'Blend with cream'],
        } as never,
      );

      const csAfter = await recipeModel.findById(csRecipe._id);
      expect(csAfter?.title).toBe('[cs] Tomato Bisque');
      expect(csAfter?.description).toBe('[cs] A rich, creamy tomato bisque.');
      expect(csAfter?.instructions).toEqual([
        '[cs] Roast tomatoes',
        '[cs] Blend with cream',
      ]);
      expect(translateTextMock).toHaveBeenCalled();
    });

    it('copies text directly (no translate call) when source and target language are the same', async () => {
      const authorId = new Types.ObjectId();
      const user: JwtUser = {
        userId: authorId.toString(),
        email: 'chef@test.com',
      };

      // Two EN recipes linked – an unusual but valid edge case
      const recipe1 = await recipeModel.create(
        makeRecipeDoc({ title: 'Omelette', language: 'en', author: authorId }),
      );
      const recipe2 = await recipeModel.create(
        makeRecipeDoc({
          title: 'Omelette (copy)',
          language: 'en',
          author: authorId,
          translations: [{ language: 'en', recipeId: recipe1._id }],
        }),
      );
      recipe1.translations = [{ language: 'en', recipeId: recipe2._id }];
      await recipe1.save();

      await controller.patchUpdate(
        recipe1._id.toString(),
        user as never,
        {
          title: 'French Omelette',
        } as never,
      );

      // Same-language sync → Google Translate must NOT be called
      expect(translateTextMock).not.toHaveBeenCalled();

      const r2After = await recipeModel.findById(recipe2._id);
      expect(r2After?.title).toBe('French Omelette');
    });
  });

  // ===========================================================================
  // Non-text shared field sync
  // ===========================================================================

  describe('recipe update – non-text shared field sync', () => {
    it('propagates servings and cookTime to linked translations without calling translate', async () => {
      const authorId = new Types.ObjectId();
      const user: JwtUser = {
        userId: authorId.toString(),
        email: 'chef@test.com',
      };

      const enRecipe = await recipeModel.create(
        makeRecipeDoc({
          title: 'Pancakes',
          language: 'en',
          author: authorId,
          servings: 2,
          cookTime: 10,
        }),
      );
      const csRecipe = await recipeModel.create(
        makeRecipeDoc({
          title: 'Palačinky',
          language: 'cs',
          author: authorId,
          servings: 2,
          cookTime: 10,
          translations: [{ language: 'en', recipeId: enRecipe._id }],
        }),
      );
      enRecipe.translations = [{ language: 'cs', recipeId: csRecipe._id }];
      await enRecipe.save();

      await controller.patchUpdate(
        enRecipe._id.toString(),
        user as never,
        {
          servings: 6,
          cookTime: 25,
        } as never,
      );

      const csAfter = await recipeModel.findById(csRecipe._id);
      expect(csAfter?.servings).toBe(6);
      expect(csAfter?.cookTime).toBe(25);
      // No text fields changed → translate must not be called
      expect(translateTextMock).not.toHaveBeenCalled();
    });

    it('propagates country change to all family members', async () => {
      const authorId = new Types.ObjectId();
      const user: JwtUser = {
        userId: authorId.toString(),
        email: 'chef@test.com',
      };

      const enRecipe = await recipeModel.create(
        makeRecipeDoc({
          title: 'Goulash EN',
          language: 'en',
          author: authorId,
          country: 'Austria',
        }),
      );
      const csRecipe = await recipeModel.create(
        makeRecipeDoc({
          title: 'Guláš CS',
          language: 'cs',
          author: authorId,
          country: 'Austria',
          translations: [{ language: 'en', recipeId: enRecipe._id }],
        }),
      );
      enRecipe.translations = [{ language: 'cs', recipeId: csRecipe._id }];
      await enRecipe.save();

      await controller.patchUpdate(
        enRecipe._id.toString(),
        user as never,
        {
          country: 'Hungary',
        } as never,
      );

      const csAfter = await recipeModel.findById(csRecipe._id);
      expect(csAfter?.country).toBe('Hungary');
      expect(translateTextMock).not.toHaveBeenCalled();
    });
  });
});
