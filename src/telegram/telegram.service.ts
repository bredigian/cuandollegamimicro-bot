import { BusArrivalData, FormattedBusArrivalData } from 'src/types/bus.types';
import { Context, Telegraf } from 'telegraf';
import { Command, Ctx, InjectBot, Start, Update } from 'nestjs-telegraf';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { MESSAGES } from 'src/const/messages';
import { ScraperService } from 'src/scraper/scraper.service';

import { SceneContext } from 'telegraf/typings/scenes';
import { Notification } from 'generated/prisma';

@Update()
@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly scraperService: ScraperService,
  ) {}

  @Start()
  async start(@Ctx() ctx: Context) {
    try {
      const chatId = ctx?.chat?.id.toString();
      if (!chatId) throw new BadRequestException('No chatId received.');

      ctx.reply(MESSAGES.START);
    } catch (error) {
      this.logger.error(
        'An error occurred while initializing the Telegram bot.',
        error,
      );
    }
  }

  // @Command('pauseto')
  // async pauseTo(@Ctx() ctx: Context) {
  //   try {
  //     const chatId = ctx?.chat?.id.toString();
  //     if (!chatId) throw new BadRequestException('No chatId received.');

  //     await ctx.sendChatAction('typing');

  //     const isSuscribed = await this.suscribersService.findByChatId(chatId);
  //     if (!isSuscribed) {
  //       ctx.reply(
  //         'No es posible pausar las notificaciones ya que no estás suscripto.',
  //       );
  //       return;
  //     }

  //     const dateTo = ctx.message?.['text'].split(' ')[1];
  //     if (!dateTo) {
  //       ctx.reply(
  //         'No es posible pausar las notificaciones sin una fecha indicada.',
  //       );
  //       return;
  //     }
  //     const date = DateTime.fromFormat(dateTo, 'dd/MM/yyyy', {
  //       locale: 'es-AR',
  //       zone: 'America/Argentina/Buenos_Aires',
  //     });

  //     if (!date.isValid) {
  //       ctx.reply(
  //         'La fecha no es válida. Por favor, revisa el formato solicitado.',
  //       );
  //       return;
  //     }

  //     await this.suscribersService.pauseNotifications(
  //       chatId,
  //       date.toUTC().toJSDate(),
  //     );
  //     ctx.reply(
  //       `Las notificaciones por defecto han sido pausadas hasta ${date.toLocaleString(DateTime.DATE_SHORT)}`,
  //     );
  //   } catch (error) {
  //     this.logger.error(
  //       'An error occurred while pausing the Telegram bot.',
  //       error,
  //     );
  //   }
  // }

  // @Command('resume')
  // async resume(@Ctx() ctx: Context) {
  //   try {
  //     const chatId = ctx?.chat?.id.toString();
  //     if (!chatId) throw new BadRequestException('No chatId received.');

  //     await ctx.sendChatAction('typing');
  //     await this.suscribersService.resumeNotifications(chatId);

  //     ctx.reply('Las notificaciones por defecto han sido reactivadas.');
  //   } catch (error) {
  //     this.logger.error(
  //       'An error ocurred while resuming the Telegram bot suscription.',
  //     );
  //   }
  // }

  @Command('configcron')
  async configCron(@Ctx() ctx: SceneContext) {
    try {
      await ctx.scene.enter('CONFIG_CRON_SCENE');
    } catch (error) {
      this.logger.error(
        'An error occurred while configuring the cron scene.',
        error,
      );
    }
  }

  @Command('info')
  async info(@Ctx() ctx: Context) {
    try {
      ctx.reply(MESSAGES.INFO);
    } catch (error) {
      this.logger.error('An error ocurred while sending info Telegram bot.');
    }
  }

  @Command('about')
  async about(@Ctx() ctx: Context) {
    try {
      ctx.reply(MESSAGES.ABOUT);
    } catch (error) {
      this.logger.error(
        'An error ocurred while sending about info Telegram bot.',
      );
    }
  }

  async sendPreviewListMessage(value: string, suscribers: string[]) {
    try {
      for (const chatId of suscribers) {
        await this.bot.telegram.sendMessage(chatId, value, {
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

  async sendMessageToChatId(
    previewMessage: string,
    data: BusArrivalData[],
    chatId: Notification['chatId'],
  ) {
    try {
      const formattedData = this.formatData(data);
      const message = previewMessage
        .concat('\n\n')
        .concat(
          typeof formattedData == 'string'
            ? formattedData
            : this.makeMessage(formattedData),
        );

      await this.bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
      });

      this.logger.log(`Message sent to ${chatId}!`);
    } catch (error) {
      this.logger.error(
        `An error ocurred while sending message to ${chatId}.`,
        error,
      );
    }
  }
  private formatData(
    data: BusArrivalData[],
  ): FormattedBusArrivalData[] | string {
    if (data[0].error) return data[0].error;

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
