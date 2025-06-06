import { Module } from '@nestjs/common';
import { ScraperService } from 'src/scraper/scraper.service';
import { TasksService } from './tasks.service';
import { TelegramService } from 'src/telegram/telegram.service';

@Module({
  providers: [TasksService, ScraperService, TelegramService],
})
export class TasksModule {}
