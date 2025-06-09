import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ScraperService } from 'src/scraper/scraper.service';
import { SuscribersService } from 'src/suscribers/suscribers.service';
import { TasksService } from './tasks.service';
import { TelegramService } from 'src/telegram/telegram.service';

@Module({
  providers: [
    TasksService,
    ScraperService,
    TelegramService,
    SuscribersService,
    PrismaService,
  ],
})
export class TasksModule {}
