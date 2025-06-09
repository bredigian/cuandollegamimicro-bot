import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SuscribersService } from './suscribers.service';

@Module({
  providers: [SuscribersService, PrismaService],
})
export class SuscribersModule {}
