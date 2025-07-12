import { LineBusService } from 'src/line-bus/line-bus.service';
import {
  Action,
  Ctx,
  On,
  Scene,
  SceneEnter,
  SceneLeave,
} from 'nestjs-telegraf';
import { SceneContext } from 'telegraf/typings/scenes';
import { Markup } from 'telegraf';
import { Notification, Stop } from 'generated/prisma';
import { NotificationsService } from 'src/notifications/notifications.service';
import { convertWeekdaysStringsToNumbers } from 'src/utils/weekdays';
import { isValidTime, Time } from 'src/utils/time';

type State = {
  chatId: string;
  line: { code: number; name: string };
  stop: { code: string; name: string };
  time: { start: Time; end: Time };
  weekdays: string[];
};
@Scene('CONFIG_CRON_SCENE')
export class ConfigCronScene {
  private stops: Stop[] = [];

  constructor(
    private lineBusService: LineBusService,
    private notificationsService: NotificationsService,
  ) {}

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: SceneContext) {
    const chatId = ctx.chat?.id.toString();

    const lineBus = await this.lineBusService.getLinesBus();

    await ctx.reply(
      'OK, ¡Configuremos una nueva notificación! Seleccioná el micro.',
      Markup.inlineKeyboard(
        lineBus.map((line) => [
          Markup.button.callback(line.name, `line:${line.code}`),
        ]),
      ),
    );

    ctx.scene.session.state = { chatId };
  }

  @Action(/line:(.+)/)
  async onLineSelected(@Ctx() ctx: SceneContext) {
    const line = (ctx.callbackQuery?.['data'] as string).split(':')[1];

    const storedLine = await this.lineBusService.findByLineCode(Number(line));
    if (!storedLine) {
      await ctx.reply('El micro seleccionado no existe o no está disponible.');
      return;
    }

    this.stops = storedLine.Stop;

    const firstStreets = storedLine.Stop.reduce((acc: string[], stop) => {
      const key = stop.name.split('y')[0].trim();
      if (!acc.includes(key)) {
        acc.push(key);
      }
      return acc;
    }, []);

    await ctx.reply(
      '¿Dónde lo tomás?',
      Markup.inlineKeyboard(
        firstStreets.map((street) => [
          Markup.button.callback(street, `street:${street}`),
        ]),
      ),
    );

    (ctx.scene.session.state as Record<string, any>).line = {
      code: Number(line),
      name: storedLine.name,
    };

    await ctx.answerCbQuery();
  }

  @Action(/street:(.+)/)
  async onStreetSelected(@Ctx() ctx: SceneContext) {
    const street = (ctx.callbackQuery?.['data'] as string).split(':')[1];

    const filteredStops = this.stops.filter((stop) =>
      stop.name.startsWith(street),
    );

    await ctx.reply(
      `${street} y ...?`,
      Markup.inlineKeyboard(
        filteredStops.map((stop) => [
          Markup.button.callback(
            `${stop.name} (${stop.code})`,
            `stop:${stop.code}`,
          ),
        ]),
      ),
    );

    await ctx.answerCbQuery();
  }

  @Action(/stop:(.+)/)
  async onStopSelected(@Ctx() ctx: SceneContext) {
    const stop = (ctx.callbackQuery?.['data'] as string).split(':')[1];

    await ctx.reply(
      "¿Que días queres que te avise? Escribilos separados por coma (ej: lunes, martes, miércoles), o 'todos' para todos los días.",
    );

    (ctx.scene.session.state as Record<string, any>).stop = {
      code: stop,
      name: this.stops.find((s) => s.code === stop)?.name,
    };

    await ctx.answerCbQuery();
  }

  @On('text')
  async onText(@Ctx() ctx: SceneContext) {
    const text = (ctx.message?.['text'] as string).trim().toLowerCase();
    const state = ctx.scene.session.state as Record<string, any>;

    if ('line' in state && 'stop' in state && !('weekdays' in state)) {
      await ctx.reply(
        "¿En que rango horario querés que te avise? Indicamelo en formato 'hh:mm - hh:mm' (ej: 19:00 - 23:30).",
      );
      (ctx.scene.session.state as Record<string, any>).weekdays = text
        .split(',')
        .map((day) => day.trim());

      return;
    }

    if (
      'line' in state &&
      'stop' in state &&
      'weekdays' in state &&
      !('time' in state)
    ) {
      const [startTime, endTime] = (text as string).split('-') as Time[];

      if (!isValidTime(startTime) || !isValidTime(endTime)) {
        await ctx.reply(
          'El rango horario no es válido. Revisalo e intentá de nuevo.',
        );

        return;
      }

      const joinedWeekdays = (state.weekdays as string[])
        .map((day) => day.charAt(0).toUpperCase() + day.slice(1))
        .join(', ');

      const summary = `🚍 Línea ${state?.line.name}\n🚏 ${state?.stop.name} (${state?.stop.code})\n 📅 ${joinedWeekdays}\n 🕒 ${startTime} a ${endTime}`;

      await ctx.reply(
        `${summary}\n\n ¿Lo confirmás?`,
        Markup.inlineKeyboard([
          Markup.button.callback('Confirmar', 'confirm:yes'),
          Markup.button.callback('Cancelar', 'confirm:no'),
        ]),
      );

      (ctx.scene.session.state as Record<string, any>).time = {
        start: startTime,
        end: endTime,
      };

      return;
    }
  }

  @Action(/confirm:(.+)/)
  async onCancel(@Ctx() ctx: SceneContext) {
    const action = (ctx.callbackQuery?.['data'] as string).split(':')[1];
    const confirm = action === 'yes';

    if (!confirm) {
      await ctx.reply('Configuración cancelada.');
      await ctx.scene.leave();
      await ctx.answerCbQuery();

      return;
    }

    const state = ctx.scene.session.state as State;

    const lineBus = await this.lineBusService.findByLineCode(state.line.code);

    if (!lineBus) {
      await ctx.reply('El micro seleccionado no existe o no está disponible.');

      return;
    }

    const weekdays = convertWeekdaysStringsToNumbers(state.weekdays);

    const selectedStop = this.stops.find(
      (stop) => stop.code === state.stop.code,
    );

    const notification: Partial<Notification> = {
      lineBusId: lineBus.id,
      stopId: selectedStop?.id,
      chatId: state.chatId,
      weekdays,
      startTime: state.time.start,
      endTime: state.time.end,
    };

    const storedNotification =
      await this.notificationsService.createNotification(
        notification as Notification,
      );

    if (!storedNotification) {
      await ctx.reply(
        'Ocurrió un error al crear la notificación. Intentá de nuevo más tarde.',
      );

      return;
    }

    await ctx.reply('¡Tu notificación se creó exitosamente! ✅');
    await ctx.scene.leave();
    await ctx.answerCbQuery();
  }

  @SceneLeave()
  async onSceneLeave(@Ctx() ctx: SceneContext) {
    delete ctx.scene.session.state;
  }
}
