import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ResponseHelper } from '../utils/response';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const message = exception.message;

    // Get validation errors if available
    let validationErrors = [];
    if (exception.getResponse() && typeof exception.getResponse() === 'object') {
      const exceptionResponse = exception.getResponse() as any;
      if (exceptionResponse.message && Array.isArray(exceptionResponse.message)) {
        validationErrors = exceptionResponse.message.map((error: string) => ({
          field: 'unknown',
          message: error,
        }));
      }
    }

    // Use ResponseHelper for standardized error format
    const errorResponse = ResponseHelper.error(
      message,
      status,
      validationErrors
    );

    response.status(status).json(errorResponse);
  }
} 