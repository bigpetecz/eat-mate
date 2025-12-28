import { Controller, Get, Query } from '@nestjs/common';
import { UnitsService } from './units.service';
import {
  UnitAutocompleteQueryDto,
  UnitAutocompleteResultDto,
} from './dto/unit-autocomplete.dto';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiQuery, ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('units')
@Controller('units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get('autocomplete')
  @ApiQuery({
    name: 'q',
    type: String,
    description: 'Query string for unit search',
    required: true,
  })
  @ApiQuery({
    name: 'lang',
    type: String,
    description: 'Language code',
    required: false,
  })
  @ApiOkResponse({ type: [UnitAutocompleteResultDto] })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async autocomplete(
    @Query() query: UnitAutocompleteQueryDto
  ): Promise<UnitAutocompleteResultDto[]> {
    return this.unitsService.autocomplete(query.q, query.lang);
  }
}
