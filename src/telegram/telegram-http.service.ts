import { BusArrivalData } from 'src/types/bus.types';
import { Injectable } from '@nestjs/common';
import { MessagesService } from 'src/messages/messages.service';

@Injectable()
export class TelegramHttpService {
  private readonly botToken = process.env.TELEGRAM_BOT_TOKEN;

  constructor(private messagesService: MessagesService) {}

  async sendMessageToChatId(
    chatId: string,
    previewMessage: string,
    data: BusArrivalData[],
  ) {
    const formattedData = this.messagesService.formatData(data);
    const message = previewMessage
      .concat('\n\n')
      .concat(
        typeof formattedData == 'string'
          ? formattedData
          : this.messagesService.makeMessage(formattedData),
      );

    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Telegram API error: ${error}`);
    }
  }
}
