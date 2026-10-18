import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';

export class SignupDto {
  @IsString()
  full_name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  branch_office?: string;

  @IsOptional()
  @IsString()
  secretKey?: string;
}