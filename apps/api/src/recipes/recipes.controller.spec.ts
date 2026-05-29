import { BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { RecipesController } from './recipes.controller';
import { Recipe } from './schema/recipe.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { IngredientNormalizerService } from '../ingredients/service/ingredient-normalizer.service';
import { RecipesQueryService } from './service/recipes-query.service';
import { GoogleTranslateService } from '../translation/google-translate.service';
import {
  RecipePublicationEligibility,
  RecipeRightsStatus,
  RecipeSourceType,
} from './recipe.enums';

function createLeanQueryMock(result: unknown) {
  const query = {
    select: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(result),
  };

  return query;
}

describe('RecipesController', () => {
  let controller: RecipesController;
  const createMock = jest.fn();
  const findByIdMock = jest.fn();
  const findMock = jest.fn();
  const cacheDelMock = jest.fn();
  const translateTextMock = jest.fn();

  beforeEach(async () => {
    createMock.mockReset();
    findByIdMock.mockReset();
    findMock.mockReset();
    cacheDelMock.mockReset();
    translateTextMock.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecipesController],
      providers: [
        {
          provide: getModelToken(Recipe.name),
          useValue: {
            create: createMock,
            findById: findByIdMock,
            find: findMock,
          },
        },
        {
          provide: getModelToken('Unit'),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: CloudinaryService,
          useValue: {},
        },
        {
          provide: IngredientNormalizerService,
          useValue: {
            findOrCreateVariant: jest.fn(),
          },
        },
        {
          provide: RecipesQueryService,
          useValue: {},
        },
        {
          provide: GoogleTranslateService,
          useValue: {
            translateText: translateTextMock,
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            del: cacheDelMock,
          },
        },
      ],
    }).compile();

    controller = module.get(RecipesController);
  });

  it('rejects non-original recipes without sourceName or attributionText', async () => {
    await expect(
      controller.create({ userId: 'user-1' } as never, {
        author: 'ignored',
        title: 'Tomato Pasta',
        description: 'A fully rewritten pasta recipe.',
        country: 'Italy',
        cookTime: 20,
        prepTime: 10,
        servings: 2,
        ingredients: [],
        instructions: ['Boil pasta and mix with sauce.'],
        sourceType: RecipeSourceType.InspiredByChef,
        sourceName: '',
        attributionText: '',
        rightsStatus: RecipeRightsStatus.Attributed,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(createMock).not.toHaveBeenCalled();
  });

  it('rejects licensed_partner recipes without licensed rightsStatus', async () => {
    await expect(
      controller.create({ userId: 'user-1' } as never, {
        author: 'ignored',
        title: 'Partner Pasta',
        description: 'A partner recipe entry.',
        country: 'Italy',
        cookTime: 20,
        prepTime: 10,
        servings: 2,
        ingredients: [],
        instructions: ['Boil pasta and mix with sauce.'],
        sourceType: RecipeSourceType.LicensedPartner,
        sourceName: 'BBC Good Food',
        attributionText: '',
        rightsStatus: RecipeRightsStatus.Attributed,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(createMock).not.toHaveBeenCalled();
  });

  it('defaults original recipes to public_allowed and unknown rightsStatus', async () => {
    createMock.mockResolvedValue({ _id: 'recipe-1' });
    findByIdMock.mockReturnValue(
      createLeanQueryMock({
        _id: 'recipe-1',
        id: 'recipe-1',
        slug: 'tomato-pasta',
        title: 'Tomato Pasta',
        description: 'A simple pasta.',
        country: 'Italy',
        author: 'user-1',
        cookTime: 20,
        prepTime: 10,
        servings: 2,
        ingredients: [],
        instructions: ['Boil pasta and mix with sauce.'],
        averageRating: 0,
        ratingCount: 0,
      }),
    );

    await controller.create({ userId: 'user-1' } as never, {
      author: 'ignored',
      title: 'Tomato Pasta',
      description: 'A simple pasta.',
      country: 'Italy',
      cookTime: 20,
      prepTime: 10,
      servings: 2,
      ingredients: [],
      instructions: ['Boil pasta and mix with sauce.'],
      sourceType: RecipeSourceType.UserOriginal,
    });

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceType: RecipeSourceType.UserOriginal,
        rightsStatus: RecipeRightsStatus.Unknown,
        publicationEligibility: RecipePublicationEligibility.PublicAllowed,
        sourceName: undefined,
        sourceUrl: undefined,
        attributionText: undefined,
      }),
    );
  });

  it('propagates shared origin updates to linked translations', async () => {
    const primaryId = new Types.ObjectId();
    const translatedId = new Types.ObjectId();

    const primaryRecipe = {
      _id: primaryId,
      author: new Types.ObjectId(),
      language: 'en',
      slug: 'tomato-pasta',
      sourceType: RecipeSourceType.UserOriginal,
      sourceName: undefined,
      sourceUrl: undefined,
      attributionText: undefined,
      rightsStatus: RecipeRightsStatus.Unknown,
      publicationEligibility: RecipePublicationEligibility.PublicAllowed,
      translations: [{ language: 'cs', recipeId: translatedId }],
      set: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    primaryRecipe.author = {
      toString: () => 'user-1',
    } as unknown as Types.ObjectId;

    const translatedRecipe = {
      _id: translatedId,
      language: 'cs',
      slug: 'rajcatove-testoviny',
      translations: [{ language: 'en', recipeId: primaryId }],
      set: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };

    findByIdMock
      .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(primaryRecipe) })
      .mockReturnValueOnce(
        createLeanQueryMock({
          _id: primaryId,
          id: primaryId.toHexString(),
          language: 'en',
          slug: 'tomato-pasta',
          title: 'Tomato Pasta',
          description: 'A simple pasta.',
          cookTime: 25,
          prepTime: 10,
          servings: 2,
          ingredients: [],
          instructions: ['Boil pasta.'],
          averageRating: 0,
          ratingCount: 0,
        }),
      );

    findMock
      .mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue([primaryRecipe, translatedRecipe]),
      })
      .mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue([primaryRecipe, translatedRecipe]),
      });

    await controller.patchUpdate(
      primaryId.toHexString(),
      { userId: 'user-1' } as never,
      {
        cookTime: 25,
        sourceType: RecipeSourceType.AdaptedFromExternal,
        sourceName: 'Example Food Blog',
        rightsStatus: RecipeRightsStatus.Attributed,
      },
    );

    expect(translatedRecipe.set).toHaveBeenCalledWith(
      expect.objectContaining({
        cookTime: 25,
        sourceType: RecipeSourceType.AdaptedFromExternal,
        sourceName: 'Example Food Blog',
        rightsStatus: RecipeRightsStatus.Attributed,
      }),
    );
    expect(translatedRecipe.save).toHaveBeenCalledTimes(1);
    expect(cacheDelMock).toHaveBeenCalledWith(
      'GET:/recipes/cs/recipe/rajcatove-testoviny',
    );
  });

  it('translates only changed text fields synchronously for linked translations', async () => {
    const primaryId = new Types.ObjectId();
    const translatedId = new Types.ObjectId();

    const primaryRecipe = {
      _id: primaryId,
      author: { toString: () => 'user-1' } as unknown as Types.ObjectId,
      language: 'en',
      slug: 'tomato-pasta',
      sourceType: RecipeSourceType.UserOriginal,
      sourceName: undefined,
      sourceUrl: undefined,
      attributionText: undefined,
      rightsStatus: RecipeRightsStatus.Unknown,
      publicationEligibility: RecipePublicationEligibility.PublicAllowed,
      translations: [{ language: 'cs', recipeId: translatedId }],
      set: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };

    const translatedRecipe = {
      _id: translatedId,
      language: 'cs',
      slug: 'rajcatove-testoviny',
      translations: [{ language: 'en', recipeId: primaryId }],
      set: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };

    translateTextMock.mockImplementation(async (text: string, lang: string) => {
      if (lang === 'cs') {
        return `cs:${text}`;
      }
      return `en:${text}`;
    });

    findByIdMock
      .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(primaryRecipe) })
      .mockReturnValueOnce(
        createLeanQueryMock({
          _id: primaryId,
          id: primaryId.toHexString(),
          language: 'en',
          slug: 'tomato-pasta',
          title: 'Updated title',
          description: 'Original description',
          cookTime: 20,
          prepTime: 10,
          servings: 2,
          ingredients: [],
          instructions: ['Step one'],
          averageRating: 0,
          ratingCount: 0,
        }),
      );

    findMock
      .mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue([primaryRecipe, translatedRecipe]),
      })
      .mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue([primaryRecipe, translatedRecipe]),
      });

    await controller.patchUpdate(
      primaryId.toHexString(),
      { userId: 'user-1' } as never,
      {
        title: 'Updated title',
        cookTime: 20,
      },
    );

    expect(translateTextMock).toHaveBeenCalledTimes(1);
    expect(translateTextMock).toHaveBeenCalledWith('Updated title', 'cs');
    expect(translatedRecipe.set).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'cs:Updated title',
        cookTime: 20,
      }),
    );
  });
});
