import { Controller, Get } from '@nestjs/common';

import { ScraperService } from './scraper/scraper.service';

@Controller()
export class AppController {
  constructor(private readonly scraperService: ScraperService) {}

  @Get()
  async runScraper() {
    const data = await this.scraperService.scrapeData({
      url: process.env.URL_TO_SCRAP!,
      lineCode: 169,
      stopId: 'LP1736',
    });

    // Send to Telegram

    return data;
  }
}
