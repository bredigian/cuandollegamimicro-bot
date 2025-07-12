import { Injectable } from '@nestjs/common';
import { LineBus } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class LineBusService {
  constructor(private prisma: PrismaService) {}

  async getLinesBus() {
    return await this.prisma.lineBus.findMany();
  }

  async findByLineCode(code: LineBus['code']) {
    return await this.prisma.lineBus.findFirst({
      where: { code },
      include: { Stop: true },
    });
  }
}
