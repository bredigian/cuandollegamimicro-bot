import { BusArrivalData, FormattedBusArrivalData } from 'src/types/bus.types';

import { Injectable } from '@nestjs/common';

@Injectable()
export class TelegramHttpService {
  private readonly botToken = process.env.TELEGRAM_BOT_TOKEN;

  async sendMessageToChatId(
    chatId: string,
    previewMessage: string,
    data: BusArrivalData[],
  ) {
    const formattedData = this.formatData(data);
    const message = previewMessage
      .concat('\n\n')
      .concat(
        typeof formattedData == 'string'
          ? formattedData
          : this.makeMessage(formattedData),
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
