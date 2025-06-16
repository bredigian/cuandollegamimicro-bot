import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Suscriber } from 'generated/prisma';

@Injectable()
export class SuscribersService {
  constructor(private prisma: PrismaService) {}

  async getSuscribers() {
    return await this.prisma.suscriber.findMany();
  }

  async findByChatId(chatId: Suscriber['chatId']) {
    return await this.prisma.suscriber.findUnique({ where: { chatId } });
  }

  async suscribe(chatId: Suscriber['chatId']) {
    const suscriber = await this.findByChatId(chatId);
    if (suscriber) return suscriber;

    return await this.prisma.suscriber.create({ data: { chatId } });
  }

  async unsuscribe(chatId: Suscriber['chatId']) {
    const suscriber = await this.findByChatId(chatId);
    if (!suscriber) return null;

    return await this.prisma.suscriber.delete({ where: { chatId } });
  }

  async pauseNotifications(chatId: Suscriber['chatId'], date: Date) {
    return await this.prisma.suscriber.update({
      where: { chatId },
      data: { pauseTo: date },
    });
  }

  async resumeNotifications(chatId: Suscriber['chatId']) {
    return await this.prisma.suscriber.update({
      where: { chatId },
      data: { pauseTo: null },
    });
  }
}
