import { ConfigCronScene } from 'src/scene/config-cron.scene';
import { ConfigModule } from '@nestjs/config';
import { LineBusService } from 'src/line-bus/line-bus.service';
import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ScraperService } from 'src/scraper/scraper.service';
import { SuscribersService } from 'src/suscribers/suscribers.service';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegramService } from './telegram.service';
import { session } from 'telegraf';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TelegrafModule.forRoot({
      token: process.env.TELEGRAM_BOT_TOKEN!,
      middlewares: [session()],
    }),
  ],
  providers: [
    TelegramService,
    SuscribersService,
    PrismaService,
    ScraperService,
    ConfigCronScene,
    LineBusService,
  ],

  exports: [TelegramService, ConfigCronScene],
})
export class TelegramModule {}
