import { NotFoundException } from '@nestjs/common';

import { RecipesQueryService } from './recipes-query.service';
import {
  RecipePublicationEligibility,
  RecipeSourceType,
} from '../recipe.enums';

function createFindQueryMock(result: unknown) {
  return {
    select: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(result),
  };
}

describe('RecipesQueryService', () => {
  const findMock = jest.fn();
  const aggregateExecMock = jest.fn();
  const aggregateMock = jest.fn(() => ({ exec: aggregateExecMock }));
  let service: RecipesQueryService;

  beforeEach(() => {
    findMock.mockReset();
    aggregateMock.mockClear();
    aggregateExecMock.mockReset();

    service = new RecipesQueryService({
      find: findMock,
      aggregate: aggregateMock,
    } as never);
  });

  it('excludes blocked recipes from findAll queries', async () => {
    findMock.mockReturnValue(createFindQueryMock([]));

    await service.findAll('en');

    expect(findMock).toHaveBeenCalledWith({
      language: 'en',
      publicationEligibility: { $ne: RecipePublicationEligibility.Blocked },
    });
  });

  it('includes sourceType in filter queries and still excludes blocked recipes', async () => {
    findMock.mockReturnValue(createFindQueryMock([]));

    await service.filter('en', {
      sourceType: RecipeSourceType.LicensedPartner,
    });

    expect(findMock).toHaveBeenCalledWith({
      $and: [
        {
          language: 'en',
          publicationEligibility: { $ne: RecipePublicationEligibility.Blocked },
        },
        {
          sourceType: RecipeSourceType.LicensedPartner,
        },
      ],
    });
  });

  it('adds blocked exclusion to recipe detail aggregate pipeline', async () => {
    aggregateExecMock.mockResolvedValue([
      {
        id: 'recipe-1',
        slug: 'tomato-pasta',
        title: 'Tomato Pasta',
        author: 'user-1',
        description: 'A simple pasta.',
        images: [],
        cookTime: 20,
        prepTime: 10,
        servings: 2,
        instructions: ['Boil pasta and mix with sauce.'],
        country: 'Italy',
        sourceType: RecipeSourceType.UserOriginal,
        rightsStatus: 'unknown',
        publicationEligibility: 'public_allowed',
        averageRating: 0,
        ratingCount: 0,
        ai: {},
        ingredients: [],
      },
    ]);

    await service.findBySlug('en', 'tomato-pasta');

    expect(aggregateMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        { $match: { language: 'en', slug: 'tomato-pasta' } },
        {
          $match: {
            publicationEligibility: {
              $ne: RecipePublicationEligibility.Blocked,
            },
          },
        },
      ])
    );
  });

  it('throws NotFoundException when detail aggregate returns no recipe', async () => {
    aggregateExecMock.mockResolvedValue([]);

    await expect(service.findBySlug('en', 'missing')).rejects.toThrow(
      NotFoundException
    );
  });
});
