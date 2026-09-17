import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS enable with credentials support for HttpOnly cookies
  app.enableCors({
    origin: 'http://localhost:3000', // Next.js frontend URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Cookies allow karne ke liye lazmi hai
  }); 

  // Cookie parser middleware to read HTTP-only cookies
  app.use(cookieParser());

  // Global Validation Pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  await app.listen(4000);
}
bootstrap();