import { BusArrivalData, FormattedBusArrivalData } from 'src/types/bus.types';

import { Injectable } from '@nestjs/common';

@Injectable()
export class MessagesService {
  formatData(data: BusArrivalData[]): FormattedBusArrivalData[] | string {
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

  makeMessage(data: FormattedBusArrivalData[]): string {
    return data
      .map(
        (bus) =>
          `🚍 ${bus.line} ${bus.letter}\n➡️ ${bus.description}\n🕒 ${bus?.remainingArrivalTime}`,
      )
      .join('\n\n');
  }
}
