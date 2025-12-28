import { Module } from '@nestjs/common';
import { UnitsController } from './units.controller';
import { UnitsService } from './units.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UnitSchema } from '../../units/schema/unit.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Unit', schema: UnitSchema }])],
  controllers: [UnitsController],
  providers: [UnitsService],
  exports: [UnitsService],
})
export class UnitsModule {}
