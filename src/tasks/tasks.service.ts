import { Cron, CronExpression } from '@nestjs/schedule';
import { Injectable, Logger } from '@nestjs/common';

import { BUSES } from 'src/types/buses.enum';
import { STOPS } from 'src/types/stops.enum';
import { ScraperService } from 'src/scraper/scraper.service';
import { TelegramService } from 'src/telegram/telegram.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private scraperService: ScraperService,
    private telegramService: TelegramService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleBusTask() {
    this.logger.debug('Running cron job...');

    try {
      const data = await this.scraperService.scrapeData({
        lineCode: BUSES.L_202,
        stopId: STOPS.L_202_7Y56,
      });

      const stopValue = STOPS.L_202_7Y56;
      const stopName = Object.keys(STOPS).find(
        (key) => STOPS[key as keyof typeof STOPS] === stopValue,
      );

      const lineValue = BUSES.L_202;
      const lineName = Object.keys(BUSES).find(
        (key) => BUSES[key as keyof typeof BUSES] === lineValue,
      );

      await this.telegramService.sendPreviewListMessage(
        `⌛ Los próximos ${lineName?.split('_')[1]} que están por llegar a la parada ${stopName?.split('_')[2]} son:`,
      );

      await this.telegramService.sendMessageToSuscribers(data);

      this.logger.log('Bus data scraped and sent to suscribers successfully.');
    } catch (error) {
      this.logger.error(
        'An error occurred while scraping and sending bus data in the cron job.\n',
        error,
      );
    }
  }
}
