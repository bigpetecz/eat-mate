import { BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { RecipesController } from './recipes.controller';
import { Recipe } from './schema/recipe.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { IngredientNormalizerService } from '../ingredients/service/ingredient-normalizer.service';
import { RecipesQueryService } from './service/recipes-query.service';
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

  beforeEach(async () => {
    createMock.mockReset();
    findByIdMock.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecipesController],
      providers: [
        {
          provide: getModelToken(Recipe.name),
          useValue: {
            create: createMock,
            findById: findByIdMock,
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
          provide: CACHE_MANAGER,
          useValue: {
            del: jest.fn(),
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
      })
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
      })
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
      })
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
      })
    );
  });
});
