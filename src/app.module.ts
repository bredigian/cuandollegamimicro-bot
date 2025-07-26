import { AppController } from './app.controller';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { LineBusModule } from './line-bus/line-bus.module';
import { Module } from '@nestjs/common';
import { NotificationsModule } from './notifications/notifications.module';
import { NotificationsService } from './notifications/notifications.service';
import { PrismaService } from './prisma/prisma.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ScraperModule } from './scraper/scraper.module';
import { ScraperService } from './scraper/scraper.service';
import { TasksModule } from './tasks/tasks.module';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: '127.0.0.1',
        port: 6379,
        password: process.env.REDIS_PASSWORD,
      },
    }),
    ScraperModule,
    TelegramModule,
    TasksModule,
    LineBusModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [ScraperService, NotificationsService, PrismaService],
})
export class AppModule {}
