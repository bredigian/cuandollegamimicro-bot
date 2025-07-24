import { NestFactory } from '@nestjs/core';
import { TasksModule } from './tasks/tasks.module';

async function bootstrap() {
  await NestFactory.createApplicationContext(TasksModule);
}

bootstrap();
