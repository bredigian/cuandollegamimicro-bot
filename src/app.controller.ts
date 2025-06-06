import { Controller, Get } from '@nestjs/common';

import { ScraperService } from './scraper/scraper.service';
import { TelegramService } from './telegram/telegram.service';

@Controller()
export class AppController {
  constructor(
    private readonly scraperService: ScraperService,
    private readonly telegramService: TelegramService,
  ) {}

  @Get()
  async runScraper() {
    try {
      const [firstIncomingBus] = await this.scraperService.scrapeData({
        lineCode: 169,
        stopId: 'LP1438',
      });

      // await this.telegramService.sendMessageToSuscribers(firstIncomingBus);

      return firstIncomingBus;
    } catch (error) {
      throw error;
    }
  }
}
