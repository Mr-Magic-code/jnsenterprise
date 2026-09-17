import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service.js';
import { SignupDto } from './dto/signup.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService
  ) {}

  async handleManagerRequest(id: number, action: 'approve' | 'reject') {
    if (action === 'approve') {
      await this.databaseService.query(
        "UPDATE users SET status = 'approved' WHERE id = ?",
        [id]
      );
      return { success: true, message: 'Manager approved successfully' };
    } else {
      await this.databaseService.query(
        "DELETE FROM users WHERE id = ?",
        [id]
      );
      return { success: true, message: 'Request rejected and removed' };
    }
  }
  
  async getPendingRequests() {
    const users: any = await this.databaseService.query(
      "SELECT id, full_name, email, role, branch_office, status, created_at FROM users WHERE status = 'pending'"
    );
    return users;
  }

  /**
   * Generic register method jo controller se role ('super-admin' ya 'manager') receive karta hai
   */
  async register(dto: SignupDto, role: 'super-admin' | 'manager') {
    if (role === 'super-admin') {
      const masterKey = process.env.SUPER_ADMIN_SECRET_KEY;
      if (!masterKey || dto.secretKey !== masterKey) {
        throw new UnauthorizedException('Invalid Super Admin Secret Key!');
      }
    } else if (role === 'manager') {
      const managerKey = process.env.MANAGER_SECRET_KEY;
      if (!managerKey || dto.secretKey !== managerKey) {
        throw new UnauthorizedException('Invalid Manager Secret Key! You are not authorized.');
      }
    }

    // Check if user already exists
    const existingUsers: any = await this.databaseService.query(
      'SELECT * FROM users WHERE email = ?',
      [dto.email]
    );

    if (existingUsers.length > 0) {
      throw new BadRequestException('User with this email already exists!');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    
    // Super-admin ke liye branch null hogi, manager ke liye jo select ki hogi woh save hogi
    const accountStatus = role === 'super-admin' ? 'approved' : 'pending';
    const dbRole = role === 'super-admin' ? 'Super-Admin' : 'Manager';
    const branchOffice = role === 'super-admin' ? null : (dto.branch_office || null);

    await this.databaseService.query(
      `INSERT INTO users (full_name, email, password, role, branch_office, status) VALUES (?, ?, ?, ?, ?, ?)`,
      [dto.full_name, dto.email, hashedPassword, dbRole, branchOffice, accountStatus]
    );

    return { 
      success: true, 
      message: `${dbRole} registered successfully!` 
    };
  }

  async deleteUser(id: number) {
    await this.databaseService.query("DELETE FROM users WHERE id = ?", [id]);
    return { success: true, message: 'User deleted successfully' };
  }

  async getAllUsers() {
    const users = await this.databaseService.query(
      "SELECT id, full_name, email, role, branch_office, status, created_at FROM users WHERE status = 'approved'"
    );
    return { users };
  }

  async login(dto: LoginDto) {
    const users: any = await this.databaseService.query(
      'SELECT * FROM users WHERE email = ?',
      [dto.email]
    );

    if (users.length === 0) {
      throw new UnauthorizedException('Invalid email or password!');
    }

    const user = users[0];

    if (user.status !== 'approved') {
      throw new UnauthorizedException('Your account is pending approval from Super Admin.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password!');
    }

    // Generate 8-hour JWT Token
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      success: true,
      message: 'Login successful!',
      accessToken,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    };
  }
}