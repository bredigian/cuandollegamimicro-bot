import { LineBusService } from 'src/line-bus/line-bus.service';
import { Action, Ctx, Scene, SceneEnter, SceneLeave } from 'nestjs-telegraf';
import { SceneContext } from 'telegraf/typings/scenes';
import { Markup } from 'telegraf';
import { Stop } from 'generated/prisma';

import { Time } from 'src/utils/time';
import { Logger } from '@nestjs/common';
import { ScraperService } from 'src/scraper/scraper.service';
import { BusArrivalData } from 'src/types/bus.types';
import { MessagesService } from 'src/messages/messages.service';

type State = {
  chatId: string;
  line: { code: number; name: string };
  stop: { code: string; name: string };
  time: { start: Time; end: Time };
  weekdays: string[];
};
@Scene('GET_INSTANT_NOTIFICATION_SCENE')
export class GetInstantNotificationScene {
  private stops: Stop[] = [];
  private readonly logger = new Logger('GetInstantNotificationSceneLogger');

  constructor(
    private lineBusService: LineBusService,
    private scraperService: ScraperService,
    private messagesService: MessagesService,
  ) {}

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: SceneContext) {
    const chatId = ctx.chat?.id.toString();
    if (!chatId) {
      this.logger.error('No chatId received.');
      await ctx.scene.leave();

      return;
    }

    const lineBus = await this.lineBusService.getLinesBus();

    await ctx.reply(
      'OK. Te voy a enviar una notificación instantánea. Seleccioná el micro:',
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

    const { line } = ctx.scene.session.state as Record<string, any>;

    const busData = await this.scraperService.scrapeData({
      lineCode: line.code,
      stopId: stop,
    });

    if (!busData || 'error' in busData[0]) {
      await ctx.reply(
        busData?.[0].error ||
          'No se pudieron obtener los datos del micro. Intenta nuevamente más tarde.',
      );
      await ctx.scene.leave();
      await ctx.answerCbQuery();

      return;
    }

    await ctx.reply(
      `Este micro va en sentido hacia:\n\n${(busData as BusArrivalData[]).map((b) => b.description).join('\n')}\n\n¿Está bien? Si es así, presioná Continuar. Caso contrario, seleccioná otra parada.`,
      Markup.inlineKeyboard([
        Markup.button.callback('Continuar', `confirm:${stop}`),
      ]),
    );
    await ctx.answerCbQuery();

    return;
  }

  @Action(/confirm:(.+)/)
  async onConfirm(@Ctx() ctx: SceneContext) {
    const stop = (ctx.callbackQuery?.['data'] as string).split(':')[1];

    const state = ctx.scene.session.state as State;
    const { line } = state;

    const currentArrives = await this.scraperService.scrapeData({
      lineCode: line.code,
      stopId: stop,
    });

    if (!currentArrives || 'error' in currentArrives[0]) {
      await ctx.reply(
        currentArrives?.[0].error ||
          'No se pudieron obtener los datos del micro. Intentá nuevamente más tarde.',
      );
      await ctx.scene.leave();
      await ctx.answerCbQuery();

      return;
    }

    const stopName = this.stops.find((s) => s.code === stop)?.name;

    const previewMessage = `⌛ Los próximos ${line.name} que están por llegar a ${stopName} (${stop}) son:`;

    const formattedData = this.messagesService.formatData(currentArrives);
    const message = previewMessage
      .concat('\n\n')
      .concat(
        typeof formattedData == 'string'
          ? formattedData
          : this.messagesService.makeMessage(formattedData),
      );

    await ctx.reply(message);
    await ctx.scene.leave();
    await ctx.answerCbQuery();
  }

  @SceneLeave()
  async onSceneLeave(@Ctx() ctx: SceneContext) {
    delete ctx.scene.session.state;
  }
}
