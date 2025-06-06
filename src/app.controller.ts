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
      const data = await this.scraperService.scrapeData({
        url: process.env.URL_TO_SCRAP!,
        lineCode: 169,
        stopId: 'LP1438',
      });

      const message = await this.telegramService.sendMessage({
        chatId: process.env.TELEGRAM_CHAT_ID!,
        data: data[0],
      });
      if (!message) throw new Error('Data scraped but message not sent!');

      return data;
    } catch (error) {
      throw error;
    }
  }
}
