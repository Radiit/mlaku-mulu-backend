import { ResponseHelper } from './response';
import { ValidationError } from '../types/base-response';

describe('ResponseHelper', () => {
  describe('success', () => {
    it('should create success response with default values', () => {
      const data = { id: 1, name: 'Test' };
      const result = ResponseHelper.success(data);

      expect(result).toEqual({
        statusCode: 200,
        message: 'Success',
        data,
        meta: undefined,
        validationErrors: [],
      });
    });

    it('should create success response with custom values', () => {
      const data = { id: 1, name: 'Test' };
      const message = 'Custom success message';
      const statusCode = 201;
      const meta = { page: 1, total: 10 };

      const result = ResponseHelper.success(data, message, statusCode, meta);

      expect(result).toEqual({
        statusCode: 201,
        message: 'Custom success message',
        data,
        meta,
        validationErrors: [],
      });
    });
  });

  describe('error', () => {
    it('should create error response with default values', () => {
      const message = 'Something went wrong';
      const result = ResponseHelper.error(message);

      expect(result).toEqual({
        statusCode: 400,
        message: 'Something went wrong',
        data: null,
        meta: null,
        validationErrors: [],
      });
    });

    it('should create error response with custom values', () => {
      const message = 'Validation failed';
      const statusCode = 422;
      const validationErrors: ValidationError[] = [
        { field: 'email', message: 'Invalid email format' },
        { field: 'password', message: 'Password too short' },
      ];

      const result = ResponseHelper.error(message, statusCode, validationErrors);

      expect(result).toEqual({
        statusCode: 422,
        message: 'Validation failed',
        data: null,
        meta: null,
        validationErrors,
      });
    });
  });

  describe('created', () => {
    it('should create created response with default message', () => {
      const data = { id: 1, name: 'New Item' };
      const result = ResponseHelper.created(data);

      expect(result).toEqual({
        statusCode: 201,
        message: 'Resource created successfully',
        data,
        meta: undefined,
        validationErrors: [],
      });
    });

    it('should create created response with custom message', () => {
      const data = { id: 1, name: 'New Item' };
      const message = 'User registered successfully';
      const result = ResponseHelper.created(data, message);

      expect(result).toEqual({
        statusCode: 201,
        message: 'User registered successfully',
        data,
        meta: undefined,
        validationErrors: [],
      });
    });
  });

  describe('notFound', () => {
    it('should create not found response with default message', () => {
      const result = ResponseHelper.notFound();

      expect(result).toEqual({
        statusCode: 404,
        message: 'Resource not found',
        data: null,
        meta: null,
        validationErrors: [],
      });
    });

    it('should create not found response with custom message', () => {
      const message = 'User not found';
      const result = ResponseHelper.notFound(message);

      expect(result).toEqual({
        statusCode: 404,
        message: 'User not found',
        data: null,
        meta: null,
        validationErrors: [],
      });
    });
  });

  describe('badRequest', () => {
    it('should create bad request response with default message', () => {
      const result = ResponseHelper.badRequest();

      expect(result).toEqual({
        statusCode: 400,
        message: 'Bad request',
        data: null,
        meta: null,
        validationErrors: [],
      });
    });

    it('should create bad request response with custom message and validation errors', () => {
      const message = 'Invalid input data';
      const validationErrors: ValidationError[] = [
        { field: 'email', message: 'Email is required' },
      ];

      const result = ResponseHelper.badRequest(message, validationErrors);

      expect(result).toEqual({
        statusCode: 400,
        message: 'Invalid input data',
        data: null,
        meta: null,
        validationErrors,
      });
    });
  });

  describe('unauthorized', () => {
    it('should create unauthorized response with default message', () => {
      const result = ResponseHelper.unauthorized();

      expect(result).toEqual({
        statusCode: 401,
        message: 'Unauthorized',
        data: null,
        meta: null,
        validationErrors: [],
      });
    });

    it('should create unauthorized response with custom message', () => {
      const message = 'Invalid credentials';
      const result = ResponseHelper.unauthorized(message);

      expect(result).toEqual({
        statusCode: 401,
        message: 'Invalid credentials',
        data: null,
        meta: null,
        validationErrors: [],
      });
    });
  });

  describe('forbidden', () => {
    it('should create forbidden response with default message', () => {
      const result = ResponseHelper.forbidden();

      expect(result).toEqual({
        statusCode: 403,
        message: 'Forbidden',
        data: null,
        meta: null,
        validationErrors: [],
      });
    });

    it('should create forbidden response with custom message', () => {
      const message = 'Insufficient permissions';
      const result = ResponseHelper.forbidden(message);

      expect(result).toEqual({
        statusCode: 403,
        message: 'Insufficient permissions',
        data: null,
        meta: null,
        validationErrors: [],
      });
    });
  });

  describe('conflict', () => {
    it('should create conflict response with default message', () => {
      const result = ResponseHelper.conflict();

      expect(result).toEqual({
        statusCode: 409,
        message: 'Conflict',
        data: null,
        meta: null,
        validationErrors: [],
      });
    });

    it('should create conflict response with custom message', () => {
      const message = 'Email already exists';
      const result = ResponseHelper.conflict(message);

      expect(result).toEqual({
        statusCode: 409,
        message: 'Email already exists',
        data: null,
        meta: null,
        validationErrors: [],
      });
    });
  });

  describe('internalError', () => {
    it('should create internal error response with default message', () => {
      const result = ResponseHelper.internalError();

      expect(result).toEqual({
        statusCode: 500,
        message: 'Internal server error',
        data: null,
        meta: null,
        validationErrors: [],
      });
    });

    it('should create internal error response with custom message', () => {
      const message = 'Database connection failed';
      const result = ResponseHelper.internalError(message);

      expect(result).toEqual({
        statusCode: 500,
        message: 'Database connection failed',
        data: null,
        meta: null,
        validationErrors: [],
      });
    });
  });
}); 