import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class CreateLeadDto {
  @IsString({ message: 'Form type must be a valid string' })
  @IsNotEmpty({ message: 'Form type is required' })
  form_type: string;

  @IsObject({ message: 'Form data must be a valid object' })
  @IsNotEmpty({ message: 'Form data cannot be empty' })
  form_data: Record<string, any>;

  @IsString({ message: 'Source URL must be a valid string' })
  @IsOptional()
  source_url?: string;
}