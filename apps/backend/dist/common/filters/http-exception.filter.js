var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AllExceptionsFilter_1;
import { Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
let AllExceptionsFilter = AllExceptionsFilter_1 = class AllExceptionsFilter {
    logger = new Logger(AllExceptionsFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception instanceof HttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;
        const message = exception instanceof HttpException
            ? (typeof exception.getResponse() === 'string' ? exception.getResponse() : exception.getResponse()?.message || exception.message)
            : exception instanceof Error ? exception.message : 'Internal server error';
        this.logger.error(`Exception caught: ${message}`, exception instanceof Error ? exception.stack : String(exception), `${request.method} ${request.url}`);
        if ((request.url?.includes('/track/') || request.url?.includes('/api/track/')) && request.method === 'POST') {
            response.status(200).json({
                ok: true,
                id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                orderId: request.params?.orderId || 'unknown',
                driverId: request.body?.driverId || 'unknown',
                message: 'Tracking point recorded (may not be persisted)',
                persisted: false
            });
            return;
        }
        if ((request.url?.includes('/routes/optimize') || request.url?.includes('/api/routes/optimize')) && request.method === 'POST') {
            response.status(200).json({
                error: 'Failed to optimize route',
                message: String(message),
                driverId: request.body?.driverId || 'unknown',
                stops: request.body?.stops || []
            });
            return;
        }
        response.status(status).json({
            statusCode: status,
            message,
            timestamp: new Date().toISOString(),
            path: request.url
        });
    }
};
AllExceptionsFilter = AllExceptionsFilter_1 = __decorate([
    Catch()
], AllExceptionsFilter);
export { AllExceptionsFilter };
