import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ example: 'Hello, what is the capital of France?' })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiPropertyOptional({ example: 'uuid-of-provider', description: 'Omit to use the default AI provider' })
  @IsUUID()
  @IsOptional()
  providerId?: string;

  @ApiPropertyOptional({ example: 'uuid-of-conversation', description: 'Omit to start a new conversation' })
  @IsUUID()
  @IsOptional()
  conversationId?: string;
}
