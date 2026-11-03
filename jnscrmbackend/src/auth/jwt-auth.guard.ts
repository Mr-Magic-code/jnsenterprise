import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly databaseService: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    // Query parameters hata kar sirf clean URL path nikalain
    const urlPath = request.url?.split('?')[0];

    // In public routes par guard bypass kar dein
    const publicPaths = ['/auth/login', '/auth/register-super-admin', '/auth/register-manager', '/auth/logout'];
    if (publicPaths.some(p => urlPath === p)) {
      return true;
    }

    // 1. Cookie se token nikalein
    const token = request.cookies?.token;
    if (!token) {
      throw new UnauthorizedException('Authentication token missing.');
    }

    try {
      // 2. Token verify karein
      const payload = this.jwtService.verify(token);

      // 3. Database mein check karein ke user abhi bhi exist karta hai ya nahi
      const users: any = await this.databaseService.query(
        "SELECT id, email, role, status FROM users WHERE id = ?",
        [payload.sub]
      );

      if (users.length === 0) {
        response.clearCookie('token', { path: '/' });
        throw new UnauthorizedException('User no longer exists or has been deleted.');
      }

      request.user = users[0];
      return true;
    } catch (error) {
      response.clearCookie('token', { path: '/' });
      throw new UnauthorizedException('Invalid or expired session.');
    }
  }
}