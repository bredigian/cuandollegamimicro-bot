import { DateTime } from 'luxon';
import { Injectable } from '@nestjs/common';
import { Notification } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { Time } from 'src/utils/time';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async createNotification(data: Notification) {
    return await this.prisma.notification.create({ data });
  }

  async getNotifications(currentTime: Time, weekday: number) {
    const notifications = await this.prisma.notification.findMany({
      where: { active: true, weekdays: { hasSome: [weekday] } },
      include: { lineBus: true, stop: true },
      orderBy: { createdAt: 'desc' },
    });

    return notifications.filter((n) => {
      const [startHours, startMinutes] = n.startTime.split(':').map(Number);
      const [endHours, endMinutes] = n.endTime.split(':').map(Number);

      const now = DateTime.now().setZone('America/Argentina/Buenos_Aires');

      const startTime = now.set({ hour: startHours, minute: startMinutes });
      const endTime = now
        .set({ hour: endHours, minute: endMinutes })
        .plus({ days: endHours === 0 ? 1 : 0 });

      return (
        now.toMillis() >= startTime.toMillis() &&
        now.toMillis() <= endTime.toMillis()
      );
    });
  }

  async getByChatId(chatId: string, activity?: boolean) {
    return await this.prisma.notification.findMany({
      where: { chatId, active: activity ?? undefined },
      include: { lineBus: true, stop: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateById(id: Notification['id'], data: Partial<Notification>) {
    return await this.prisma.notification.update({ where: { id }, data });
  }
}
