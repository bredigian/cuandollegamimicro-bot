import { Context, Telegraf } from 'telegraf';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { BusArrivalData, FormattedBusArrivalData } from 'src/types/bus.types';
import { InjectBot } from 'nestjs-telegraf';
import { Update } from 'telegraf/typings/core/types/typegram';
import { SuscribersService } from 'src/suscribers/suscribers.service';
import { Suscriber } from 'generated/prisma';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private suscribersService: SuscribersService,
  ) {}

  async onModuleInit() {
    try {
      this.bot.command('start', async (ctx) => {
        const chatId = ctx.chat.id.toString();
        const isSuscriber = await this.suscribersService.findByChatId(chatId);
        if (!isSuscriber) {
          await this.suscribersService.suscribe(chatId);
          this.logger.log(`New suscriptor: ${chatId}`);

          ctx.reply(
            'Bienvenido! Te notificaré cada 2 minutos los próximos arribos que tiene configurado el bot por defecto.\n\nLas líneas son:\n- 202 (hacia La Plata y hacia UTN)\n- 214 (hacia la UTN)\n\nLas paradas son:\n- 202: 7 y 56 (hacia UTN) y 60 y 125 (hacia La Plata)\n- 214: Diagonal 73 y 10 (hacia UTN)\n\nEstas notificaciones se enviarán de lunes a viernes. En caso de que quieras desuscribirte, envia un mensaje con el comando /stop.',
          );
        } else
          ctx.reply(
            '¡Tranquilo, ya estás suscrito!\nSi estás en el rango horario, en unos instantes recibirás la notificación.',
          );
      });
    } catch (error) {
      this.logger.error(
        'An error occurred while initializing the Telegram bot.',
        error,
      );
    }
  }
  async onModuleDestroy() {
    this.bot.stop();
    this.logger.log('Telegram Bot stopped.');
  }

  async handleUpdate(update: Update) {
    await this.bot.handleUpdate(update);
  }

  async sendPreviewListMessage(value: string, suscribers: Suscriber[]) {
    try {
      for (const suscriber of suscribers) {
        await this.bot.telegram.sendMessage(suscriber.chatId, value, {
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

  async sendMessageToSuscribers(
    data: BusArrivalData[],
    suscribers: Suscriber[],
  ) {
    for (const suscriber of suscribers) {
      try {
        if (data[0].error)
          return await this.bot.telegram.sendMessage(
            suscriber.chatId,
            data[0].error,
            {
              parse_mode: 'Markdown',
            },
          );

        const formattedData = this.formatData(data);
        const message = this.makeMessage(formattedData);

        await this.bot.telegram.sendMessage(suscriber.chatId, message, {
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

  private formatData(data: BusArrivalData[]): FormattedBusArrivalData[] {
    return data.map((bus) => {
      const [letter, ...x] = bus?.description?.split(' ')!;
      return {
        ...bus,
        letter,
        description: x.splice(1).join(' '),
      };
    });
  }

  private makeMessage(data: FormattedBusArrivalData[]): string {
    return data
      .map(
        (bus) =>
          `🚍 ${bus.line} ${bus.letter}\n➡️ ${bus.description}\n🕒 ${bus?.remainingArrivalTime}`,
      )
      .join('\n\n');
  }

  async sendMessage() {}
}
