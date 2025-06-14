import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000, () =>
    console.log('Cuando Llega Mi Micro Bot is running!'),
  );
}

bootstrap();
