import { ValidationPipe } from './validation.pipe';
import { ArgumentMetadata, BadRequestException } from '@nestjs/common';

describe('ValidationPipe', () => {
  let pipe: ValidationPipe;

  beforeEach(() => {
    pipe = new ValidationPipe();
  });

  describe('transform', () => {
    it('should return value when validation passes', async () => {
      const value = { name: 'Test', email: 'test@example.com' };
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: Object,
        data: '',
      };

      const result = await pipe.transform(value, metadata);

      expect(result).toEqual(value);
    });

    it('should handle primitive values', async () => {
      const value = 'test-string';
      const metadata: ArgumentMetadata = {
        type: 'param',
        metatype: String,
        data: 'id',
      };

      const result = await pipe.transform(value, metadata);

      expect(result).toEqual(value);
    });

    it('should handle null values', async () => {
      const value = null;
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: Object,
        data: '',
      };

      const result = await pipe.transform(value, metadata);

      expect(result).toBeNull();
    });

    it('should handle undefined values', async () => {
      const value = undefined;
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: Object,
        data: '',
      };

      const result = await pipe.transform(value, metadata);

      expect(result).toBeUndefined();
    });

    it('should handle empty objects', async () => {
      const value = {};
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: Object,
        data: '',
      };

      const result = await pipe.transform(value, metadata);

      expect(result).toEqual({});
    });

    it('should handle arrays', async () => {
      const value = [{ id: 1 }, { id: 2 }];
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: Array,
        data: '',
      };

      const result = await pipe.transform(value, metadata);

      expect(result).toEqual(value);
    });
  });

  describe('toValidate', () => {
    it('should validate primitive types correctly', async () => {
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: String,
        data: '',
      };

      // Test that primitive types are not validated
      const result = await pipe.transform('test', metadata);
      expect(result).toBe('test');
    });

    it('should validate custom classes', async () => {
      class TestDto {
        name: string;
        email: string;
      }

      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: TestDto,
        data: '',
      };

      const value = { name: 'Test', email: 'test@example.com' };
      const result = await pipe.transform(value, metadata);
      expect(result).toEqual(value);
    });
  });
}); 