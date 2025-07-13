import { Module } from '@nestjs/common';
import { NotificationsService } from 'src/notifications/notifications.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ScraperService } from 'src/scraper/scraper.service';
import { TasksService } from './tasks.service';
import { TelegramService } from 'src/telegram/telegram.service';

@Module({
  providers: [
    TasksService,
    ScraperService,
    TelegramService,
    NotificationsService,
    PrismaService,
  ],
})
export class TasksModule {}
