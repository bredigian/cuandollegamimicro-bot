import { BusArrivalData, FormattedBusArrivalData } from 'src/types/bus.types';
import { Context, Telegraf } from 'telegraf';
import { Command, Ctx, Hears, InjectBot, Start, Update } from 'nestjs-telegraf';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { Suscriber } from 'generated/prisma';
import { SuscribersService } from 'src/suscribers/suscribers.service';
import { Message } from 'telegraf/typings/core/types/typegram';

@Update()
@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly suscribersService: SuscribersService,
  ) {}

  @Start()
  async start(@Ctx() ctx: Context) {
    try {
      const chatId = ctx?.chat?.id.toString();
      if (!chatId) throw new BadRequestException('No chatId received.');

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
    } catch (error) {
      this.logger.error(
        'An error occurred while initializing the Telegram bot.',
        error,
      );
    }
  }

  @Hears('/stop')
  async stop(@Ctx() ctx: Context) {
    try {
      const chatId = ctx?.chat?.id.toString();
      if (!chatId) throw new BadRequestException('No chatId received.');

      const unsuscriptor = await this.suscribersService.unsuscribe(chatId);
      if (!unsuscriptor) {
        ctx.reply('No estás suscripto.');
        this.logger.warn(
          `${chatId} wants to unsuscribe, but is not suscribed.`,
        );
      } else {
        ctx.reply('Te has desuscripto a las notificaciones del bot.');
        this.logger.log(`${chatId} was unsuscribed.`);
      }
    } catch (error) {
      this.logger.error(
        'An error ocurred while stopping the Telegram bot suscription.',
      );
    }
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
  ): Promise<Message.TextMessage | undefined> {
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
}
