import { Injectable, Logger } from '@nestjs/common';

import { Cron } from '@nestjs/schedule';
import { DateTime } from 'luxon';
import { InjectQueue } from '@nestjs/bull';
import { NotificationsService } from 'src/notifications/notifications.service';
import { Queue } from 'bull';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private notificationsService: NotificationsService,
    @InjectQueue('notifications') private notificationsQueue: Queue,
  ) {}

  // Handle notifications every 2 minutes
  @Cron('*/2 * * * *', { timeZone: 'America/Argentina/Buenos_Aires' })
  async handleBusNotifications() {
    this.logger.log('Handling bus notifications...');

    try {
      const now = DateTime.now()
        .setZone('America/Argentina/Buenos_Aires')
        .setLocale('es-AR');
      const currentWeekday = now.weekday;

      const notifications =
        await this.notificationsService.getNotifications(currentWeekday);

      // Agrupamos las notificaciones por parada de micro para optimizar
      const groupedNotifications =
        this.notificationsService.groupNotifications(notifications);

      // Enviamos cada grupo de parada de micro como tarea a la cola de Bull
      for (const task of groupedNotifications) {
        await this.notificationsQueue.add('notificationEnqueued', task, {
          attempts: 3,
          backoff: 5000,
        });
      }

      this.logger.log('Notifications were enqueued ✅');
    } catch (error) {
      this.logger.error(
        'An error occurred while handling bus notifications.',
        error,
      );
    }
  }
}
