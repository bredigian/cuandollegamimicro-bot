import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ScraperModule } from './scraper/scraper.module';
import { ScraperService } from './scraper/scraper.service';
import { SuscribersModule } from './suscribers/suscribers.module';
import { TasksModule } from './tasks/tasks.module';
import { TelegramModule } from './telegram/telegram.module';
import { LineBusModule } from './line-bus/line-bus.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    ScraperModule,
    TelegramModule,
    TasksModule,
    SuscribersModule,
    LineBusModule,
  ],
  controllers: [AppController],
  providers: [ScraperService],
})
export class AppModule {}
