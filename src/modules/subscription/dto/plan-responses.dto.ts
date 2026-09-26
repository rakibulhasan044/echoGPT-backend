import { ApiProperty } from '@nestjs/swagger';


export class PlanResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: 'PREMIUM' })
  name!: string;

  @ApiProperty({ example: 5.0 })
  price!: number;

  @ApiProperty({ example: 500 })
  requestLimit!: number;

  @ApiProperty({ example: ['Access to GPT-4', 'Priority Support'] })
  benefits!: string[];
}
