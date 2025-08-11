import { Browser, chromium } from '@playwright/test';

import { BusArrivalData } from 'src/types/bus.types';
import { Injectable } from '@nestjs/common';

interface ScrapeDataProps {
  lineCode: number;
  stopId: string;
}

@Injectable()
export class ScraperService {
  constructor() {}

  async scrapeData({
    lineCode,
    stopId,
  }: ScrapeDataProps): Promise<
    BusArrivalData[] | { error: string }[] | undefined
  > {
    let browser: Promise<Browser> | Browser | null = null;
    try {
      browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();

      const URL = `${process.env.URL_TO_SCRAP!}?codLinea=${lineCode}&idParada=${stopId}`;

      await page.goto(URL);

      try {
        await page.waitForSelector('#arribosContainer', { timeout: 5000 });
      } catch {
        await browser.close();

        return [{ error: 'No se encontraron datos de arribos.' }];
      }

      const buses = await page.$$eval('.proximo-arribo', (rows) => {
        return rows.map((row) => {
          const line =
            row.querySelector('.lineaClass')?.textContent?.trim() || '';
          const description =
            row.querySelector('.bandera')?.textContent?.trim() || '';

          const remainingArrivalTime =
            row.querySelector('#tiempoRestanteArribo')?.textContent?.trim() ||
            '';

          return { line, description, remainingArrivalTime };
        });
      });

      await page.close();
      await browser.close();

      return buses.slice(0, 4); // Limit to 4 buses
    } catch (error) {
      console.error(
        'Error scraping data or executing a browser instance:',
        error,
      );
    } finally {
      if (browser) await browser.close();
    }
  }
}
