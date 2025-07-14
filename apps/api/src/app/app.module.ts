import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { RecipesModule } from '../recipes/recipes.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { PingService } from './ping.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'local'}`,
    }),
    DatabaseModule,
    RecipesModule,
    UsersModule,
    AuthModule,
    HttpModule,
  ],
  providers: [PingService],
})
export class AppModule {}
