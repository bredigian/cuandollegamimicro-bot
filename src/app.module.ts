import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { ScraperModule } from './scraper/scraper.module';
import { ScraperService } from './scraper/scraper.service';

@Module({
  imports: [ScraperModule, ConfigModule.forRoot()],
  controllers: [AppController],
  providers: [ScraperService],
})
export class AppModule {}
