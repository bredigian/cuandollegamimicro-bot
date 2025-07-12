import { LineBusService } from 'src/line-bus/line-bus.service';
import {
  Action,
  Command,
  Ctx,
  Hears,
  On,
  Scene,
  SceneEnter,
  SceneLeave,
} from 'nestjs-telegraf';
import { SceneContext } from 'telegraf/typings/scenes';
import { Markup } from 'telegraf';
import { Stop } from 'generated/prisma';

@Scene('CONFIG_CRON_SCENE')
export class ConfigCronScene {
  private stops: Stop[] = [];

  constructor(private lineBusService: LineBusService) {}

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
    const text = ctx.message?.['text'].trim().toLowerCase();
    const state = ctx.scene.session.state as Record<string, any>;

    if ('line' in state && 'stop' in state && !('days' in state)) {
      await ctx.reply(
        "¿En que rango horario querés que te avise? Indicamelo en formato 'hh:mm - hh:mm' (ej: 19:00 - 23:30).",
      );
      (ctx.scene.session.state as Record<string, any>).days = text;

      return;
    }

    if (
      'line' in state &&
      'stop' in state &&
      'days' in state &&
      !('time' in state)
    ) {
      const [startTime, endTime] = (text as string)
        .split('-')
        ?.map((t) => Number(t.trim()));

      if (isNaN(startTime) || isNaN(endTime) || startTime > endTime) {
        await ctx.reply(
          'El horario que ingresaste no es valido. Por favor, ingresalo de nuevo.',
        );
        return;
      }
      const summary = `🚍 ${state?.line.name}\n🚏 ${state?.stop.name} (${state?.stop.code})\n 📅 ${state?.days}\n 🕒 ${startTime.toString().padStart(2, '0')}:00 a ${endTime.toString().padStart(2, '0')}:00`;

      await ctx.reply(
        `${summary}\n\n ¿Lo confirmás?`,
        Markup.inlineKeyboard([
          Markup.button.callback('Confirmar', 'confirm:yes'),
          Markup.button.callback('Cancelar', 'confirm:no'),
        ]),
      );

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

    await ctx.reply('Configuración confirmada. Guardando en base de datos...');
    await ctx.scene.leave();
    await ctx.answerCbQuery();
  }

  @SceneLeave()
  async onSceneLeave(@Ctx() ctx: SceneContext) {
    delete ctx.scene.session.state;
  }
}
