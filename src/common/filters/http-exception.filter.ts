import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ResponseHelper } from '../utils/response';
import { PrismaClientKnownRequestError, PrismaClientUnknownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let validationErrors: any[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;

      if (exception.getResponse() && typeof exception.getResponse() === 'object') {
        const exceptionResponse = exception.getResponse() as any;
        if (exceptionResponse.message && Array.isArray(exceptionResponse.message)) {
          validationErrors = exceptionResponse.message.map((error: string) => ({
            field: 'unknown',
            message: error,
          }));
        }
      }
    } else if (exception instanceof PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = 'Resource already exists';
          if (exception.meta?.target && Array.isArray(exception.meta.target)) {
            validationErrors = exception.meta.target.map((field: string) => ({
              field: field,
              message: `${field} already exists`,
              value: null
            }));
          } else {
            validationErrors = [{
              field: 'unknown',
              message: 'A field with this value already exists',
              value: null
            }];
          }
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Resource not found';
          break;
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          message = 'Invalid reference';
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = 'Database operation failed';
      }
      this.logger.error(`Prisma error ${exception.code}: ${exception.message}`, exception.meta);
    } else if (exception instanceof PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Validation failed';
      this.logger.error(`Prisma validation error: ${exception.message}`);
    } else if (exception instanceof PrismaClientUnknownRequestError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid database operation';
      this.logger.error(`Prisma unknown error: ${exception.message}`);
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
    } else {
      this.logger.error(`Unknown error type: ${typeof exception}`, exception);
    }

    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : undefined
    );

    const errorResponse = ResponseHelper.error(
      message,
      status,
      validationErrors
    );

    response.status(status).json(errorResponse);
  }
} 