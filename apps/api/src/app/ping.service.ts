import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class PingService {
  private readonly logger = new Logger(PingService.name);

  constructor(
    private readonly http: HttpService,
    private readonly configService: ConfigService
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async scheduledPing() {
    const frontendUrl = this.configService.get('FRONTEND_URL');
    if (frontendUrl === undefined) {
      this.logger.warn('FRONTEND_URL is not set, skipping ping');
      return;
    }
    try {
      const res = await firstValueFrom(this.http.get(frontendUrl));
      this.logger.log(`Pinged ${frontendUrl}: ${res.status}`);
    } catch (err) {
      this.logger.warn(`Ping to ${frontendUrl} failed: ${err}`);
    }
  }
}
