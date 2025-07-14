import { Action, Ctx, Scene, SceneEnter, SceneLeave } from 'nestjs-telegraf';
import { SceneContext } from 'telegraf/typings/scenes';
import { Markup } from 'telegraf';
import { NotificationsService } from 'src/notifications/notifications.service';
import { capitalizeText, WEEKDAYS_NUM_TO_TEXT } from 'src/utils/weekdays';
import { Logger } from '@nestjs/common';

@Scene('DEACTIVE_CRON_SCENE')
export class DeactiveCronScene {
  private readonly logger = new Logger('DeactiveCronSceneLogger');

  constructor(private notificationsService: NotificationsService) {}

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: SceneContext) {
    const chatId = ctx.chat?.id.toString();
    if (!chatId) {
      this.logger.error('No chatId received.');
      await ctx.scene.leave();

      return;
    }

    const notifications = await this.notificationsService.getByChatId(
      chatId,
      true,
    );

    if (notifications.length === 0) {
      await ctx.reply('No tenés notificaciones activas.');
      await ctx.scene.leave();

      return;
    }

    const notificationsString = notifications
      .map(
        (n, idx) =>
          `${idx + 1}.\n\n🚍 Línea ${n.lineBus.name}\n🚏 ${n.stop.name} (${n.stop.code})\n📅 ${n.weekdays.map((w) => capitalizeText(WEEKDAYS_NUM_TO_TEXT[w])).join(', ')}\n🕒 ${n.startTime} - ${n.endTime}`,
      )
      .join('\n\n\n');

    await ctx.reply(
      `¿Que notificación querés desactivar?\n\n${notificationsString}`,
      Markup.inlineKeyboard(
        notifications.map((n, idx) => [
          Markup.button.callback(`${idx + 1}`, `notification:${n.id}`),
        ]),
      ),
    );

    ctx.scene.session.state = { chatId };
  }

  @Action(/notification:(.+)/)
  async onSelectNotification(@Ctx() ctx: SceneContext) {
    const notificationId = (ctx.callbackQuery?.['data'] as string).split(
      ':',
    )[1];

    await this.notificationsService.updateById(notificationId, {
      active: false,
    });

    await ctx.answerCbQuery();

    await ctx.reply('La notificación fue desactivada.');
    await ctx.scene.leave();
  }

  @SceneLeave()
  async onSceneLeave(@Ctx() ctx: SceneContext) {
    delete ctx.scene.session.state;
  }
}
