import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

interface ExceptionResponse {
  message?: string | string[];
  error?: string;
  errors?: unknown;
}

/**
 * Global HTTP Exception Filter
 * Centralizes error handling and provides consistent API responses
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';
    let errors: unknown = undefined;

    // Handle HTTP exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as ExceptionResponse;
        message = Array.isArray(responseObj.message)
          ? responseObj.message
          : responseObj.message || exception.message;
        error = responseObj.error || 'Error';
        errors = responseObj.errors;
      }
    }
    // Handle TypeORM QueryFailedError
    else if (exception instanceof QueryFailedError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Database query failed';
      error = 'Query Failed';
      this.logger.error(
        `QueryFailedError: ${exception.message}`,
        exception.stack,
      );
    }
    // Handle unknown errors
    else if (exception instanceof Error) {
      message = Array.isArray(message) ? message : exception.message || message;
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );
    }

    const responseBody = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error,
      message: Array.isArray(message) ? message : [message],
      ...(errors !== undefined && { errors }),
    };

    response.status(status).json(responseBody);
  }
}
