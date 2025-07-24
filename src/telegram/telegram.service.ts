import { Context, Telegraf } from 'telegraf';
import { Command, Ctx, InjectBot, Start, Update } from 'nestjs-telegraf';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { MESSAGES } from 'src/const/messages';
import { NotificationsService } from 'src/notifications/notifications.service';

import { SceneContext } from 'telegraf/typings/scenes';
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
            `${n.active ? '🟢 Activa' : '🔴 Inactiva'}\n🚍 Línea ${n.lineBus.name}\n🚏 ${n.stop.name} (${n.stop.code})\n📅 ${n.weekdays.map((w) => capitalizeText(WEEKDAYS_NUM_TO_TEXT[w])).join(', ')}\n🕒 ${n.startTime} - ${n.endTime}\nCreado el ${DateTime.fromJSDate(new Date(n.createdAt)).setZone('America/Argentina/Buenos_Aires').toLocaleString(DateTime.DATETIME_SHORT, { locale: 'es-AR' })}\nActualizado el ${DateTime.fromJSDate(new Date(n.updatedAt)).setZone('America/Argentina/Buenos_Aires').toLocaleString(DateTime.DATETIME_SHORT, { locale: 'es-AR' })}`,
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
}
