import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { NotificationsService } from 'src/notifications/notifications.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ScraperService } from 'src/scraper/scraper.service';
import { TasksProcessor } from './tasks.processor';
import { TasksService } from './tasks.service';
import { TelegramModule } from 'src/telegram/telegram.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications',
    }),
    TelegramModule,
  ],
  providers: [
    TasksService,
    ScraperService,
    NotificationsService,
    PrismaService,
    TasksProcessor,
  ],
})
export class TasksModule {}
