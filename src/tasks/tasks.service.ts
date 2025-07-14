import { Injectable, Logger } from '@nestjs/common';
import { LineBus, Notification, Stop } from 'generated/prisma';

import { Cron } from '@nestjs/schedule';
import { DateTime } from 'luxon';
import { NotificationsService } from 'src/notifications/notifications.service';
import { ScraperService } from 'src/scraper/scraper.service';
import { TelegramService } from 'src/telegram/telegram.service';
import { Time } from 'src/utils/time';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private scraperService: ScraperService,
    private telegramService: TelegramService,
    private notificationsService: NotificationsService,
  ) {}

  private async handleBusTask(
    chatId: Notification['chatId'],
    lineBus: LineBus,
    stop: Stop,
  ) {
    try {
      const data = await this.scraperService.scrapeData({
        lineCode: lineBus.code,
        stopId: stop.code,
      });

      const previewMessage = `⌛ Los próximos ${lineBus.name} que están por llegar a ${stop.name} (${stop.code}) son:`;

      await this.telegramService.sendMessageToChatId(
        previewMessage,
        data,
        chatId,
      );

      this.logger.log('Bus data scraped and sent to suscriber successfully.');
    } catch (error) {
      this.logger.error(
        'An error occurred while scraping and sending bus data in the cron job.\n',
        error,
      );
    }
  }

  // Handle notifications every 2 minutes
  @Cron('*/2 * * * *', { timeZone: 'America/Argentina/Buenos_Aires' })
  async handleBusNotifications() {
    this.logger.log('Handling bus notifications...');

    try {
      const now = DateTime.now()
        .setZone('America/Argentina/Buenos_Aires')
        .setLocale('es-AR');
      const currentTime: Time = `${now.hour}:${now.minute}`;
      const currentWeekday = now.weekday;

      const notifications = await this.notificationsService.getNotifications(
        currentTime,
        currentWeekday,
      );

      for (const notification of notifications)
        await this.handleBusTask(
          notification.chatId,
          notification.lineBus,
          notification.stop,
        );

      this.logger.log('Notifications were sent ✅');
    } catch (error) {
      this.logger.error(
        'An error occurred while handling bus notifications.',
        error,
      );
    }
  }
}
