import { OnQueueFailed, Process, Processor } from '@nestjs/bull';

import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { NotificationGroup } from 'src/notifications/notifications.service';
import { ScraperService } from 'src/scraper/scraper.service';
import { TelegramHttpService } from 'src/telegram/telegram-http.service';

@Processor('notifications')
export class TasksProcessor {
  private readonly logger = new Logger('TaskProcessorLogger');

  constructor(
    private scraperService: ScraperService,
    private telegramHttpService: TelegramHttpService,
  ) {}

  @Process('notificationEnqueued')
  async handleTask(job: Job) {
    try {
      const { id, data: jobData } = job;
      const { lineBus, stop, chats } = jobData as NotificationGroup;

      const data = await this.scraperService.scrapeData({
        lineCode: lineBus.code,
        stopId: stop.code,
      });

      if (!data || 'error' in data[0]) {
        this.logger.error(`Job ${id} failed!!!`);
        throw new Error('Failed while scraping data.');
      }

      const previewMessage = `⌛ Los próximos ${lineBus.name} que están por llegar a ${stop.name} (${stop.code}) son:`;

      for (const chatId of chats)
        await this.telegramHttpService.sendMessageToChatId(
          chatId,
          previewMessage,
          data,
        );

      this.logger.log(`Job ${id} done!`);
    } catch (error) {
      this.logger.error('An error occurred while executing the job.', error);
    }
  }

  @OnQueueFailed()
  async onTaskFailed(job: Job, error: any) {
    this.logger.error(`Job ${job.id} has failed.`, error);
  }
}
