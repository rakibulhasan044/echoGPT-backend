import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsUrl } from 'class-validator';

export class CreateProviderDto {
  @ApiProperty({ example: 'OpenAI', description: 'Name of the AI Provider' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'https://api.openai.com/v1', description: 'Base URL for the API' })
  @IsUrl()
  @IsOptional()
  baseUrl?: string;

  @ApiProperty({ example: 'sk-proj-...', description: 'The raw API key (will be encrypted securely)' })
  @IsString()
  @IsNotEmpty()
  apiKey!: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class UpdateProviderDto {
  @ApiPropertyOptional({ example: 'OpenAI' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'https://api.openai.com/v1' })
  @IsUrl()
  @IsOptional()
  baseUrl?: string;

  @ApiPropertyOptional({ example: 'sk-proj-...', description: 'New API key (will be encrypted securely)' })
  @IsString()
  @IsOptional()
  apiKey?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
