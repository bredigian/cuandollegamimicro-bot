import { Context, Telegraf } from 'telegraf';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { BusArrivalData } from 'src/types/bus.types';
import { InjectBot } from 'nestjs-telegraf';
import { Message, Update } from 'telegraf/typings/core/types/typegram';

interface SendMessageProps {
  chatId: string;
  data: BusArrivalData;
}

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);

  constructor(@InjectBot() private readonly bot: Telegraf<Context>) {}

  async onModuleInit() {
    this.bot.command('start', (ctx) => {
      const chatId = ctx.chat.id.toString();
      this.logger.log(`Nuevo suscriptor: ${chatId}`);
      ctx.reply('¡Bienvenido! Te notificaré los horarios de los micros.');
    });
  }
  async onModuleDestroy() {
    this.bot.stop();
    this.logger.log('Bot de Telegram detenido');
  }

  async handleUpdate(update: Update) {
    await this.bot.handleUpdate(update);
  }

  async sendMessage({
    chatId,
    data,
  }: SendMessageProps): Promise<Message.TextMessage | undefined> {
    try {
      if (data.error)
        return await this.bot.telegram.sendMessage(chatId, data.error, {
          parse_mode: 'Markdown',
        });

      const [letter, ...x] = data?.description?.split(' ')!;
      const description = x.splice(1).join(' ');
      const message = `🚍 ${data.line} ${letter}\n➡️ ${description}\n🕒 ${data?.remainingArrivalTime}`;
      const sentMessage = await this.bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
      });

      this.logger.log(`Message sent to ${chatId}!`);

      return sentMessage;
    } catch (error) {
      this.logger.error(
        `An error ocurred while sending message to ${chatId}`,
        error,
      );
    }
  }
}
