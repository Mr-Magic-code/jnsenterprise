import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS enable with credentials support for HttpOnly cookies
  app.enableCors({
    // Next.js frontend URLs (extra ones can be added via FRONTEND_URLS, comma separated)
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://jnsedu-website.vercel.app',
      ...(process.env.FRONTEND_URLS?.split(',').map((u) => u.trim()).filter(Boolean) ?? []),
    ],
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

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();