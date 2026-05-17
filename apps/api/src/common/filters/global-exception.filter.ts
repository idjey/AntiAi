import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorDetails = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      
      // Extract detailed validation messages if they exist
      if (typeof res === 'object' && res !== null && 'message' in res) {
        if (Array.isArray((res as any).message)) {
          message = 'Validation failed';
          errorDetails = (res as any).message;
        } else {
          message = (res as any).message;
        }
      } else if (typeof res === 'string') {
        message = res;
      }
    } else if (exception instanceof Error) {
      // Don't expose internal error messages to the client in production
      this.logger.error(`[Unhandled Exception] ${request.method} ${request.url}`, exception.stack);
      
      if (process.env.NODE_ENV !== 'production') {
        message = exception.message;
      }
    }

    // Log the error
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} ${status} - ${message}`,
        exception instanceof Error ? exception.stack : ''
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} ${status} - ${message}`);
    }

    // Send the sanitized response
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      ...(errorDetails ? { errors: errorDetails } : {}),
    });
  }
}
