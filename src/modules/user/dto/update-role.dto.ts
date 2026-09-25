import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from '../../../generated/prisma/enums.js';

export class UpdateRoleDto {
  @ApiProperty({
    description: 'The role to assign to the user',
    enum: Object.values(Role),
    example: 'ADMIN',
  })
  @IsEnum(Role, { message: 'Invalid role specified' })
  @IsNotEmpty({ message: 'Role is required' })
  role!: Role;
}
