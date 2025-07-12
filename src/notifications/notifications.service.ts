import { Injectable } from '@nestjs/common';
import { Notification } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async createNotification(data: Notification) {
    return await this.prisma.notification.create({ data });
  }
}
