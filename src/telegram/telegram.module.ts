import { ActiveCronScene } from 'src/scene/active-cron.scene';
import { ConfigCronScene } from 'src/scene/config-cron.scene';
import { ConfigModule } from '@nestjs/config';
import { DeactiveCronScene } from 'src/scene/deactive-cron.scene';
import { LineBusService } from 'src/line-bus/line-bus.service';
import { Module } from '@nestjs/common';
import { NotificationsService } from 'src/notifications/notifications.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ScraperService } from 'src/scraper/scraper.service';
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
    PrismaService,
    ScraperService,
    ConfigCronScene,
    ActiveCronScene,
    DeactiveCronScene,
    LineBusService,
    NotificationsService,
  ],

  exports: [TelegramService, ConfigCronScene],
})
export class TelegramModule {}
