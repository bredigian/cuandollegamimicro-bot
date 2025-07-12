import { BusArrivalData, FormattedBusArrivalData } from 'src/types/bus.types';
import { Context, Telegraf } from 'telegraf';
import { Command, Ctx, InjectBot, Start, Update } from 'nestjs-telegraf';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { DateTime } from 'luxon';

import { SuscribersService } from 'src/suscribers/suscribers.service';
import { Message } from 'telegraf/typings/core/types/typegram';
import { MESSAGES } from 'src/const/messages';
import { ScraperService } from 'src/scraper/scraper.service';
import { BUSES } from 'src/types/buses.enum';
import { STOPS } from 'src/types/stops.enum';
import { SceneContext } from 'telegraf/typings/scenes';

@Update()
@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly suscribersService: SuscribersService,
    private readonly scraperService: ScraperService,
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

        ctx.reply(MESSAGES.START.WELCOME);
      } else ctx.reply(MESSAGES.START.ALREADY_SUSCRIBED);
    } catch (error) {
      this.logger.error(
        'An error occurred while initializing the Telegram bot.',
        error,
      );
    }
  }

  @Command('stop')
  async stop(@Ctx() ctx: Context) {
    try {
      const chatId = ctx?.chat?.id.toString();
      if (!chatId) throw new BadRequestException('No chatId received.');

      const unsuscriptor = await this.suscribersService.unsuscribe(chatId);
      if (!unsuscriptor) {
        ctx.reply(MESSAGES.STOP.NOT_SUSCRIBED);

        this.logger.warn(
          `${chatId} wants to unsuscribe, but is not suscribed.`,
        );
      } else {
        ctx.reply(MESSAGES.STOP.UNSUSCRIBED);

        this.logger.log(`${chatId} was unsuscribed.`);
      }
    } catch (error) {
      this.logger.error(
        'An error ocurred while stopping the Telegram bot suscription.',
      );
    }
  }

  @Command('pauseto')
  async pauseTo(@Ctx() ctx: Context) {
    try {
      const chatId = ctx?.chat?.id.toString();
      if (!chatId) throw new BadRequestException('No chatId received.');

      await ctx.sendChatAction('typing');

      const isSuscribed = await this.suscribersService.findByChatId(chatId);
      if (!isSuscribed) {
        ctx.reply(
          'No es posible pausar las notificaciones ya que no estás suscripto.',
        );
        return;
      }

      const dateTo = ctx.message?.['text'].split(' ')[1];
      if (!dateTo) {
        ctx.reply(
          'No es posible pausar las notificaciones sin una fecha indicada.',
        );
        return;
      }
      const date = DateTime.fromFormat(dateTo, 'dd/MM/yyyy', {
        locale: 'es-AR',
        zone: 'America/Argentina/Buenos_Aires',
      });

      if (!date.isValid) {
        ctx.reply(
          'La fecha no es válida. Por favor, revisa el formato solicitado.',
        );
        return;
      }

      await this.suscribersService.pauseNotifications(
        chatId,
        date.toUTC().toJSDate(),
      );
      ctx.reply(
        `Las notificaciones por defecto han sido pausadas hasta ${date.toLocaleString(DateTime.DATE_SHORT)}`,
      );
    } catch (error) {
      this.logger.error(
        'An error occurred while pausing the Telegram bot.',
        error,
      );
    }
  }

  @Command('resume')
  async resume(@Ctx() ctx: Context) {
    try {
      const chatId = ctx?.chat?.id.toString();
      if (!chatId) throw new BadRequestException('No chatId received.');

      await ctx.sendChatAction('typing');
      await this.suscribersService.resumeNotifications(chatId);

      ctx.reply('Las notificaciones por defecto han sido reactivadas.');
    } catch (error) {
      this.logger.error(
        'An error ocurred while resuming the Telegram bot suscription.',
      );
    }
  }

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

  @Command('get214toutn')
  async handle214BusToUTN(@Ctx() ctx: Context) {
    this.logger.log('Handling 214 bus to UTN task...');

    try {
      const chatId = ctx?.chat?.id.toString();
      if (!chatId) throw new BadRequestException('No chatId received.');

      const lineCode = BUSES.L_214;
      const stopId = STOPS.L_214_DIAG73Y10;
      const lineName = Object.keys(BUSES).find(
        (key) => BUSES[key as keyof typeof BUSES] === lineCode,
      );
      const stopName = Object.keys(STOPS).find(
        (key) => STOPS[key as keyof typeof STOPS] === stopId,
      );

      ctx.reply(
        `⌛ Los próximos ${lineName?.split('_')[1]} que están por llegar a la parada ${stopName?.split('_')[2]} son:`,
      );

      const data = await this.scraperService.scrapeData({ lineCode, stopId });

      const formattedData = this.formatData(data);
      const message =
        typeof formattedData === 'string'
          ? formattedData
          : this.makeMessage(formattedData);

      ctx.reply(message);
    } catch (error) {
      this.logger.error(
        'An error occurred while handling the bus to UTN task.',
        error,
      );
    }
  }

  @Command('get202toutn')
  async handle202BusToUTN(@Ctx() ctx: Context) {
    this.logger.log('Handling 202 bus to UTN task...');

    try {
      const chatId = ctx?.chat?.id.toString();
      if (!chatId) throw new BadRequestException('No chatId received.');

      const lineCode = BUSES.L_202;
      const stopId = STOPS.L_202_7Y56;
      const lineName = Object.keys(BUSES).find(
        (key) => BUSES[key as keyof typeof BUSES] === lineCode,
      );
      const stopName = Object.keys(STOPS).find(
        (key) => STOPS[key as keyof typeof STOPS] === stopId,
      );

      ctx.reply(
        `⌛ Los próximos ${lineName?.split('_')[1]} que están por llegar a la parada ${stopName?.split('_')[2]} son:`,
      );

      const data = await this.scraperService.scrapeData({ lineCode, stopId });

      const formattedData = this.formatData(data);
      const message =
        typeof formattedData === 'string'
          ? formattedData
          : this.makeMessage(formattedData);

      ctx.reply(message);
    } catch (error) {
      this.logger.error(
        'An error occurred while handling the bus to UTN task.',
        error,
      );
    }
  }

  @Command('get202tolaplata')
  async handle202BusToLaPlata(@Ctx() ctx: Context) {
    this.logger.log('Handling 202 bus to La Plata task...');

    try {
      const chatId = ctx?.chat?.id.toString();
      if (!chatId) throw new BadRequestException('No chatId received.');

      const lineCode = BUSES.L_202;
      const stopId = STOPS.L_202_60Y125;
      const lineName = Object.keys(BUSES).find(
        (key) => BUSES[key as keyof typeof BUSES] === lineCode,
      );
      const stopName = Object.keys(STOPS).find(
        (key) => STOPS[key as keyof typeof STOPS] === stopId,
      );

      ctx.reply(
        `⌛ Los próximos ${lineName?.split('_')[1]} que están por llegar a la parada ${stopName?.split('_')[2]} son:`,
      );

      const data = await this.scraperService.scrapeData({ lineCode, stopId });

      const formattedData = this.formatData(data);
      const message =
        typeof formattedData === 'string'
          ? formattedData
          : this.makeMessage(formattedData);

      ctx.reply(message);
    } catch (error) {
      this.logger.error(
        'An error occurred while handling the bus to UTN task.',
        error,
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

  async sendMessageToSuscribers(
    previewMessage: string,
    data: BusArrivalData[],
    suscribers: string[],
  ): Promise<Message.TextMessage | undefined> {
    for (const chatId of suscribers) {
      try {
        if (data[0].error)
          return await this.bot.telegram.sendMessage(chatId, data[0].error, {
            parse_mode: 'Markdown',
          });

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
