import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ScraperService } from 'src/scraper/scraper.service';
import { SuscribersService } from 'src/suscribers/suscribers.service';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegramService } from './telegram.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TelegrafModule.forRoot({ token: process.env.TELEGRAM_BOT_TOKEN! }),
  ],
  providers: [
    TelegramService,
    SuscribersService,
    PrismaService,
    ScraperService,
  ],
  exports: [TelegramService],
})
export class TelegramModule {}
