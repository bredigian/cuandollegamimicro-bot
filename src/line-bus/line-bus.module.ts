import { LineBusService } from './line-bus.service';
import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [LineBusService, PrismaService],
})
export class LineBusModule {}
