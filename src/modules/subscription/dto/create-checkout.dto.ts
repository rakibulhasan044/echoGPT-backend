import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCheckoutDto {
  @ApiProperty({
    description: 'The Plan ID (from your database) you want to subscribe the user to',
    example: '8fe7ce6e-2479-4abc-ad0e-25a7f99fffab',
  })
  @IsString()
  @IsNotEmpty()
  planId!: string;
}
