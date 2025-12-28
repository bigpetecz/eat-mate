import {
  Controller,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { IngredientsAutocompleteService } from './service/ingredients-autocomplete.service';
import {
  IngredientAutocompleteQueryDto,
  IngredientAutocompleteResultDto,
} from './dto/ingredient-autocomplete.dto';
import { ApiQuery, ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('ingredients')
@Controller('ingredients')
export class IngredientsController {
  constructor(
    private readonly ingredientsAutocompleteService: IngredientsAutocompleteService
  ) {}

  @Get('autocomplete')
  @ApiQuery({
    name: 'q',
    type: String,
    description: 'Query string for ingredient search',
    required: true,
  })
  @ApiQuery({
    name: 'lang',
    type: String,
    description: 'Language code',
    required: false,
  })
  @ApiOkResponse({ type: [IngredientAutocompleteResultDto] })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async autocomplete(
    @Query() query: IngredientAutocompleteQueryDto
  ): Promise<IngredientAutocompleteResultDto[]> {
    return this.ingredientsAutocompleteService.autocomplete(
      query.q,
      query.lang
    );
  }
}
