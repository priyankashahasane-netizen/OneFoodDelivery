import type { DriverEntity } from '../../drivers/entities/driver.entity.js';
import type { RoutePlanEntity } from '../../routes/entities/route-plan.entity.js';
import type { SubscriptionExecutionEntity } from './subscription-execution.entity.js';
export declare class SubscriptionEntity {
    id: string;
    orderTemplateId: string;
    driver: DriverEntity | null;
    driverId: string | null;
    routePlan: RoutePlanEntity | null;
    routePlanId: string | null;
    frequency: string;
    daysOfWeek: string[] | null;
    startDate: Date;
    endDate: Date | null;
    nextDeliveryAt: Date | null;
    active: boolean;
    executions: SubscriptionExecutionEntity[];
    createdAt: Date;
    updatedAt: Date;
}
