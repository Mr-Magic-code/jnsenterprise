import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { LeadsModule } from './leads/leads.module.js';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './auth/auth.module.js';
import { PagesModule } from './pages/pages.module.js';
import { EventsModule } from './events/events.module.js';
import { BlogsModule } from './blogs/blogs.module.js'; // 1. BlogsModule imported securely

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Rate Limiter Configuration: 1 minute (60000 ms) mein ek IP se maximum 20 requests allow hongi
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 20,
      },
    ]),
    DatabaseModule,
    LeadsModule,
    AuthModule,
    PagesModule,
    EventsModule,
    BlogsModule, // 2. BlogsModule registered in imports array
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Global guard enforcing rate limits across all endpoints
    },
  ],
})
export class AppModule {}