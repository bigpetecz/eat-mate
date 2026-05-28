import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '../database/database.module';
import { RecipesModule } from '../recipes/recipes.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { PingService } from './ping.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios';
import { TranslationModule } from '../translation/translation.module';

import { IngredientsModule } from '../ingredients/ingredients.module';
import { UnitsModule } from '../units/units.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'local'}`,
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    RecipesModule,
    TranslationModule,
    UsersModule,
    AuthModule,
    HttpModule,
    IngredientsModule,
    UnitsModule,
  ],
  controllers: [AppController],
  providers: [AppService, PingService],
})
export class AppModule {}
