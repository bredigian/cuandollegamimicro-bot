import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { NotificationsService } from 'src/notifications/notifications.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ScraperService } from 'src/scraper/scraper.service';
import { TasksProcessor } from './tasks.processor';
import { TasksService } from './tasks.service';
import { TelegramHttpService } from 'src/telegram/telegram-http.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications',
      redis: {
        host: '127.0.0.1',
        port: 6379,
        password: process.env.REDIS_PASSWORD,
      },
    }),
  ],
  providers: [
    TasksService,
    ScraperService,
    NotificationsService,
    PrismaService,
    TasksProcessor,
    TelegramHttpService,
  ],
})
export class TasksModule {}
