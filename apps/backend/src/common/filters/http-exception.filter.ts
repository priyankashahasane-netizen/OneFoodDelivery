import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? (typeof exception.getResponse() === 'string' ? exception.getResponse() : (exception.getResponse() as any)?.message || exception.message)
      : exception instanceof Error ? exception.message : 'Internal server error';

    this.logger.error(
      `Exception caught: ${message}`,
      exception instanceof Error ? exception.stack : String(exception),
      `${request.method} ${request.url}`
    );

    // Don't send 500 for tracking endpoints - return 200 with mock response
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

    // Don't send 500 for routes endpoints - return graceful error
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
}

