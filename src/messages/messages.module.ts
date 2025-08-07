import { MessagesService } from './messages.service';
import { Module } from '@nestjs/common';

@Module({
  providers: [MessagesService],
})
export class MessagesModule {}
