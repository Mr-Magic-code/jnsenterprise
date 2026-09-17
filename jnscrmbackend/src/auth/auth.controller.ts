import { Controller, Post, Get, Patch, Delete, Body, Query, Res, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { SignupDto } from './dto/signup.dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('token', result.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 8 * 60 * 60 * 1000,
      path: '/',
    });

    return {
      success: true,
      message: result.message,
      user: result.user,
    };
  }

  @Post('register-super-admin')
  @HttpCode(HttpStatus.CREATED)
  async registerSuperAdmin(@Body() dto: SignupDto) {
    return this.authService.register(dto, 'super-admin');
  }

  @Post('register-manager')
  @HttpCode(HttpStatus.CREATED)
  async registerManager(@Body() dto: SignupDto) {
    return this.authService.register(dto, 'manager');
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    const isProduction = process.env.NODE_ENV === 'production';

    res.clearCookie('token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/',
    });

    return { success: true, message: 'Logged out successfully' };
  }

  // --- PROTECTED ROUTES (Requires JWT Guard) ---

  @Get('users')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getAllUsers() {
    return this.authService.getAllUsers();
  }

  @Get('pending-requests')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getPendingRequests() {
    return this.authService.getPendingRequests();
  }

  @Patch('requests')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async handleManagerRequest(@Body() body: { id: number; action: 'approve' | 'reject' }) {
    return this.authService.handleManagerRequest(body.id, body.action);
  }

  @Delete('delete-user')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Query('id') id: number) {
    return this.authService.deleteUser(Number(id));
  }
}