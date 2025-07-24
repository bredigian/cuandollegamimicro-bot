import { OnQueueFailed, Process, Processor } from '@nestjs/bull';

import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { NotificationGroup } from 'src/notifications/notifications.service';
import { ScraperService } from 'src/scraper/scraper.service';
import { TelegramService } from 'src/telegram/telegram.service';

@Processor('notifications')
export class TasksProcessor {
  private readonly logger = new Logger('TaskProcessorLogger');

  constructor(
    private scraperService: ScraperService,
    private telegramService: TelegramService,
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

      const previewMessage = `⌛ Los próximos ${lineBus.name} que están por llegar a ${stop.name} (${stop.code}) son:`;

      for (const chatId of chats)
        await this.telegramService.sendMessageToChatId(
          previewMessage,
          data,
          chatId,
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
