import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module.js';
import { OrdersModule } from '../orders/orders.module.js';
import { RoutesModule } from '../routes/routes.module.js';
import { AssignmentsController } from './assignments.controller.js';
import { AssignmentsService } from './assignments.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogEntity } from '../../common/audit/audit.entity.js';
import { AuditService } from '../../common/audit/audit.service.js';

@Module({
  imports: [OrdersModule, RoutesModule, NotificationsModule, TypeOrmModule.forFeature([AuditLogEntity])],
  controllers: [AssignmentsController],
  providers: [AssignmentsService, AuditService]
})
export class AssignmentsModule {}

