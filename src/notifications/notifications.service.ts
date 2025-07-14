import { Time, timeStringToMinutes } from 'src/utils/time';

import { Injectable } from '@nestjs/common';
import { Notification } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async createNotification(data: Notification) {
    return await this.prisma.notification.create({ data });
  }

  async getNotifications(currentTime: Time, weekday: number) {
    const [hours, minutes] = currentTime.split(':').map(Number);
    const currentMinutes = hours * 60 + minutes;

    const notifications = await this.prisma.notification.findMany({
      where: { active: true, weekdays: { hasSome: [weekday] } },
      include: { lineBus: true, stop: true },
    });

    return notifications.filter((n) => {
      const start = timeStringToMinutes(n.startTime as Time);
      const end = timeStringToMinutes(n.endTime as Time);

      return currentMinutes >= start && currentMinutes <= end;
    });
  }

  async getByChatId(chatId: string) {
    return await this.prisma.notification.findMany({
      where: { chatId },
      include: { lineBus: true, stop: true },
    });
  }
}
