import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegramService } from './telegram.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TelegrafModule.forRoot({ token: process.env.TELEGRAM_BOT_TOKEN! }),
  ],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
