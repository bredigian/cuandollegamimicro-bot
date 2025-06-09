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

  private async handleBusTask(lineCode: BUSES, stopId: STOPS) {
    try {
      const data = await this.scraperService.scrapeData({
        lineCode,
        stopId,
      });

      const lineValue = lineCode;
      const lineName = Object.keys(BUSES).find(
        (key) => BUSES[key as keyof typeof BUSES] === lineValue,
      );

      const stopValue = stopId;
      const stopName = Object.keys(STOPS).find(
        (key) => STOPS[key as keyof typeof STOPS] === stopValue,
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

  // 202 & 214 (to UTN), 16:00 - 18:59, Monday to Friday
  @Cron('*/2 16-18 * * 1-5')
  async handleBusToUTNTask() {
    this.logger.log('Handling bus to UTN task...');
    try {
      await this.handleBusTask(BUSES.L_214, STOPS.L_214_DIAG73Y10);
      await this.handleBusTask(BUSES.L_202, STOPS.L_202_7Y56);
    } catch (error) {
      this.logger.error(
        'An error occurred while handling the bus to UTN task.',
        error,
      );
    }
  }

  // 202 (to La Plata), 20:00 - 23:59, Monday to Friday
  @Cron('*/2 20-23 * * 1-5')
  async handleBusTask202ToLaPlata() {
    this.logger.log('Handling bus 202 (to La Plata) task...');
    try {
      await this.handleBusTask(BUSES.L_202, STOPS.L_202_60Y125);
    } catch (error) {
      this.logger.error(
        'An error occurred while handling the bus 202 (to La Plata) task.',
        error,
      );
    }
  }
}
