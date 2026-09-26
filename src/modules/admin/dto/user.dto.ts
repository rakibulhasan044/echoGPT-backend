import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({ example: false, description: 'Set to false to restrict the user, true to unrestrict' })
  @IsBoolean()
  @IsNotEmpty()
  isActive!: boolean;
}
