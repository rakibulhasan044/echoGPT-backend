import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'The full name of the user',
    example: 'User Name',
  })
  @IsOptional()
  @IsString()
  @Length(2, 50, { message: 'Full name must be between 2 and 50 characters' })
  fullName?: string;
}
