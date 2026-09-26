import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, IsEnum, IsBoolean } from 'class-validator';


export class CreatePlanDto {
  @ApiProperty({ example: 'PRO' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 5.0 })
  @IsNumber()
  price!: number;

  @ApiProperty({ example: 500 })
  @IsNumber()
  requestLimit!: number;

  @ApiProperty({ example: ['Feature 1', 'Feature 2'] })
  @IsArray()
  @IsString({ each: true })
  benefits!: string[];

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdatePlanDto {
  @ApiProperty({ example: 10.0, required: false })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiProperty({ example: 1000, required: false })
  @IsNumber()
  @IsOptional()
  requestLimit?: number;

  @ApiProperty({ example: ['Feature 1', 'Feature 2', 'Feature 3'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  benefits?: string[];

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
