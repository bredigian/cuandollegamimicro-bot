import { BusArrivalData, FormattedBusArrivalData } from 'src/types/bus.types';
import { Context, Telegraf } from 'telegraf';
import { Command, Ctx, InjectBot, Start, Update } from 'nestjs-telegraf';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { MESSAGES } from 'src/const/messages';
import { NotificationsService } from 'src/notifications/notifications.service';

import { SceneContext } from 'telegraf/typings/scenes';
import { Notification } from 'generated/prisma';
import { capitalizeText, WEEKDAYS_NUM_TO_TEXT } from 'src/utils/weekdays';
import { DateTime } from 'luxon';

@Update()
@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private notificationsService: NotificationsService,
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

  @Command('enablenotification')
  async activeNotification(@Ctx() ctx: SceneContext) {
    try {
      await ctx.scene.enter('ACTIVE_CRON_SCENE');
    } catch (error) {
      this.logger.error(
        'An error occurred while configuring the cron scene.',
        error,
      );
    }
  }

  @Command('disablenotification')
  async deactiveNotification(@Ctx() ctx: SceneContext) {
    try {
      await ctx.scene.enter('DEACTIVE_CRON_SCENE');
    } catch (error) {
      this.logger.error(
        'An error occurred while configuring the cron scene.',
        error,
      );
    }
  }

  @Command('getmynotifications')
  async getMyNotifications(@Ctx() ctx: Context) {
    try {
      const chatId = ctx?.chat?.id?.toString();
      if (!chatId) throw new BadRequestException('No chatId received.');

      const notifications = await this.notificationsService.getByChatId(chatId);
      if (notifications.length === 0) {
        ctx.reply('Todavía no configuraste ninguna notificación.');

        return;
      }

      const message = notifications
        .map(
          (n) =>
            `${n.active ? '🟢 Activa' : '🔴 Inactiva'}\n🚍 Línea ${n.lineBus.name}\n🚏 ${n.stop.name} (${n.stop.code})\n📅 ${n.weekdays.map((w) => capitalizeText(WEEKDAYS_NUM_TO_TEXT[w])).join(', ')}\n🕒 ${n.startTime} - ${n.endTime}\nCreado el ${DateTime.fromJSDate(new Date(n.createdAt)).toLocaleString(DateTime.DATETIME_SHORT, { locale: 'es-AR' })}\nActualizado el ${DateTime.fromJSDate(new Date(n.updatedAt)).toLocaleString(DateTime.DATETIME_SHORT, { locale: 'es-AR' })}`,
        )
        .join('\n\n');

      ctx.reply(`Tus notificaciones son:\n\n${message}`);
    } catch (error) {
      this.logger.error(
        "An error occurred while getting chatId's notifications.",
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
