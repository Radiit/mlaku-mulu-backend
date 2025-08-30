import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.use(require('express').json({ 
    limit: '10mb',
    verify: (req: any, res: any, buf: Buffer) => {
      try {
        JSON.parse(buf.toString());
      } catch (e) {
        throw new Error('Invalid JSON');
      }
    }
  }));
  app.use(require('express').urlencoded({ extended: true, limit: '10mb' }));
  
  app.use((err: any, req: any, res: any, next: any) => {
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Invalid JSON format',
        data: null,
        meta: null,
        validationErrors: [{
          field: 'body',
          message: 'Request body is not valid JSON',
          value: null
        }]
      });
    }
    next(err);
  });
  
  app.useGlobalFilters(new HttpExceptionFilter());
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));
  
  app.enableCors();
  
  await app.listen(process.env.PORT ?? 8086);
}
bootstrap();
