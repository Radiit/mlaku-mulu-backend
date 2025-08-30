import { BaseResponse, ValidationError } from '../types/base-response';

export class ResponseHelper {
  static success<T>(
    data: T,
    message: string = 'Success',
    statusCode: number = 200,
    meta?: any
  ): BaseResponse<T> {
    return {
      statusCode,
      message,
      data,
      meta,
      validationErrors: [],
    };
  }

  static error(
    message: string,
    statusCode: number = 400,
    validationErrors: ValidationError[] = []
  ): BaseResponse<null> {
    return {
      statusCode,
      message,
      data: null,
      meta: null,
      validationErrors,
    };
  }

  static created<T>(
    data: T,
    message: string = 'Resource created successfully'
  ): BaseResponse<T> {
    return this.success(data, message, 201);
  }

  static notFound(message: string = 'Resource not found'): BaseResponse<null> {
    return this.error(message, 404);
  }

  static badRequest(
    message: string = 'Bad request',
    validationErrors: ValidationError[] = []
  ): BaseResponse<null> {
    return this.error(message, 400, validationErrors);
  }

  static unauthorized(message: string = 'Unauthorized'): BaseResponse<null> {
    return this.error(message, 401);
  }

  static forbidden(message: string = 'Forbidden'): BaseResponse<null> {
    return this.error(message, 403);
  }

  static conflict(message: string = 'Conflict'): BaseResponse<null> {
    return this.error(message, 409);
  }

  static internalError(message: string = 'Internal server error'): BaseResponse<null> {
    return this.error(message, 500);
  }
} 