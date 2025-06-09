import { Context, Telegraf } from 'telegraf';
import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import * as fs from 'fs/promises';
import * as path from 'path';

import { BusArrivalData } from 'src/types/bus.types';
import { InjectBot } from 'nestjs-telegraf';
import { Message, Update } from 'telegraf/typings/core/types/typegram';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private suscribers: string[] = [];
  private readonly subscribersFile = path.resolve(
    process.cwd(),
    'db',
    'subscribers.json',
  );

  constructor(@InjectBot() private readonly bot: Telegraf<Context>) {}

  async onModuleInit() {
    await this.loadSuscribers();

    this.bot.command('start', async (ctx) => {
      const chatId = ctx.chat.id.toString();
      if (!this.suscribers.includes(chatId)) {
        this.suscribers = [...this.suscribers, chatId];
        await this.saveSuscribers();
        this.logger.log(`New suscriptor: ${chatId}`);

        ctx.reply('¡Bienvenido! Te notificaré los horarios de los micros.');
      } else ctx.reply('¡Tranqui, ya estás suscrito!');
    });
  }
  async onModuleDestroy() {
    this.bot.stop();
    this.logger.log('Telegram Bot stopped.');
  }

  async handleUpdate(update: Update) {
    await this.bot.handleUpdate(update);
  }

  async saveSuscribers() {
    try {
      await fs.writeFile(
        this.subscribersFile,
        JSON.stringify(this.suscribers, null, 2),
      );
    } catch (error) {
      this.logger.error(
        'An error occurred while saving suscribers to file.',
        error,
      );
    }
  }

  async loadSuscribers() {
    try {
      const suscribers = await fs.readFile(this.subscribersFile, 'utf-8');
      this.suscribers = JSON.parse(suscribers);
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.logger.warn('Suscribers file not found. Creating a new one...');

        this.suscribers = [];
        await this.saveSuscribers();
      } else
        this.logger.error('An error occurred while loading suscribers.', error);
    }
  }

  async sendPreviewListMessage(value: string) {
    try {
      for (const suscriber of this.suscribers) {
        await this.bot.telegram.sendMessage(suscriber, value, {
          parse_mode: 'Markdown',
        });
      }
    } catch (error) {
      this.logger.error(
        'An error occurred while sending preview list message.\n',
        error,
      );
    }
  }

  async sendMessageToSuscribers(data: BusArrivalData[]) {
    if (this.suscribers.length === 0)
      throw new NotFoundException('Data scraped but no suscribers found.');

    console.log(this.suscribers);
    for (const suscriber of this.suscribers) {
      try {
        if (data[0].error)
          return await this.bot.telegram.sendMessage(suscriber, data[0].error, {
            parse_mode: 'Markdown',
          });

        const formattedData = data.map((bus) => {
          const [letter, ...x] = bus?.description?.split(' ')!;
          return {
            ...bus,
            letter,
            description: x.splice(1).join(' '),
          };
        });

        const message = formattedData
          .map(
            (bus) =>
              `🚍 ${bus.line} ${bus.letter}\n➡️ ${bus.description}\n🕒 ${bus?.remainingArrivalTime}`,
          )
          .join('\n\n');
        await this.bot.telegram.sendMessage(suscriber, message, {
          parse_mode: 'Markdown',
        });

        this.logger.log(`Message sent to ${suscriber}!`);
      } catch (error) {
        this.logger.error(
          `An error ocurred while sending message to ${suscriber}.`,
          error,
        );
      }
    }
  }
}
